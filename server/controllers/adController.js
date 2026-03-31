const Ad = require("../models/Ad");
const { getRedis } = require("../config/redis");

// Helper function to convert lat/lng to GeoJSON coordinates [lng, lat]
const convertToGeoJSON = (lat, lng) => {
  if (!lat || !lng) return null;
  return {
    type: "Point",
    coordinates: [parseFloat(lng), parseFloat(lat)],
  };
};

// Helper function to get description snippet
const getDescriptionSnippet = (description, length = 120) => {
  if (!description) return "";
  return (
    description.substring(0, length) +
    (description.length > length ? "..." : "")
  );
};

// Helper function to get thumb URL (first image)
const getThumbUrl = (images) => {
  if (!images || images.length === 0) return null;
  return images[0].thumbUrl || images[0].url;
};

// POST /api/ads - Create new ad (protected)
const createAd = async (req, res) => {
  try {
    const {
      title,
      price,
      description,
      location,
      images,
      billsIncluded,
      membersCount,
      phoneNumber,
      address,
    } = req.body;
    const userId = req.user.userId;

    // Check if user is banned
    const User = require("../models/User");
    const user = await User.findById(userId);
    if (user && user.banned) {
      return res
        .status(403)
        .json({ message: "Your account has been banned and cannot post ads" });
    }

    // Validation
    if (!title || !price) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    if (price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    // Convert lat/lng to GeoJSON
    let geoLocation = null;
    if (location && location.lat && location.lng) {
      geoLocation = convertToGeoJSON(location.lat, location.lng);
    }

    const ad = new Ad({
      owner: userId,
      title,
      price: parseFloat(price),
      description: description || "",
      images: images || [],
      location: geoLocation,
      address: address || "",
      billsIncluded: billsIncluded || false,
      phoneNumber: phoneNumber || null,
      membersCount: membersCount || 1,
      status: "review",
    });

    await ad.save();
    await ad.populate("owner", "name email phone");

    res.status(201).json({
      message: "Ad created successfully",
      ad,
    });
  } catch (error) {
    console.error("Create ad error:", error);
    res
      .status(500)
      .json({ message: "Failed to create ad", error: error.message });
  }
};

// PUT /api/ads/:id - Update ad (owner only)
const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const {
      title,
      price,
      description,
      location,
      images,
      billsIncluded,
      phoneNumber,
      membersCount,
      address,
    } = req.body;

    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // Check ownership
    if (ad.owner.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this ad" });
    }

    // Update allowed fields
    if (title) ad.title = title;
    if (price !== undefined) {
      if (price <= 0) {
        return res
          .status(400)
          .json({ message: "Price must be greater than 0" });
      }
      ad.price = parseFloat(price);
    }
    if (description !== undefined) ad.description = description;
    if (address !== undefined) ad.address = address;
    if (billsIncluded !== undefined) ad.billsIncluded = billsIncluded;
    if (membersCount !== undefined) ad.membersCount = membersCount;
    if (phoneNumber !== undefined) ad.phoneNumber = phoneNumber;

    // Update location if provided
    if (location && location.lat && location.lng) {
      ad.location = convertToGeoJSON(location.lat, location.lng);
    }

    // Update images if provided
    if (images) {
      ad.images = images;
    }

    await ad.save();
    await ad.populate("owner", "name email");

    // Invalidate cache
    const redis = getRedis();
    await redis.del("ads:published:minimal");

    // Transform location from GeoJSON to lat/lng format for frontend
    const transformedAd = {
      ...ad.toObject(),
      location: ad.location
        ? {
            lat: ad.location.coordinates[1],
            lng: ad.location.coordinates[0],
          }
        : null,
    };

    res.status(200).json({
      message: "Ad updated successfully",
      ad: transformedAd,
    });
  } catch (error) {
    console.error("Update ad error:", error);
    res
      .status(500)
      .json({ message: "Failed to update ad", error: error.message });
  }
};

// DELETE /api/ads/:id - Soft delete (owner or admin)
const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // Check authorization (owner or admin)
    if (ad.owner.toString() !== userId && userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this ad" });
    }

    // Soft delete
    ad.status = "removed";
    await ad.save();

    // Invalidate cache
    const redis = getRedis();
    await redis.del("ads:published:minimal");

    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    console.error("Delete ad error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete ad", error: error.message });
  }
};

// GET /api/ads/:id - Get single ad
const getAdById = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id)
      .populate("owner", "name email")
      .lean();
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // Skip returning removed ads unless requester is owner or admin
    if (ad.status === "removed") {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (ad.owner._id.toString() !== userId && userRole !== "admin") {
        return res.status(404).json({ message: "Ad not found" });
      }
    }

    // Transform location from GeoJSON to lat/lng format for frontend
    const transformedAd = {
      ...ad,
      location: ad.location
        ? {
            lat: ad.location.coordinates[1],
            lng: ad.location.coordinates[0],
          }
        : null,
    };

    res.status(200).json({
      message: "Ad retrieved successfully",
      ad: transformedAd,
    });
  } catch (error) {
    console.error("Get ad error:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve ad", error: error.message });
  }
};

// GET /api/ads/published - Get published ads with caching (minimal fields)
const getPublishedAds = async (req, res) => {
  try {
    let redis;
    let cached = null;
    const cacheKey = "ads:published:minimal";

    // Try to get from cache (Redis is optional)
    try {
      redis = getRedis();
      cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          message: "Ads retrieved successfully (cached)",
          ads: JSON.parse(cached),
        });
      }
    } catch (redisError) {
      console.warn("Redis cache unavailable:", redisError.message);
      redis = null;
    }

    // Query database
    const ads = await Ad.find({ status: "published" })
      .select(
        "_id title price billsIncluded membersCount description images location address createdAt",
      )
      .lean();

    // Transform response to minimal fields
    const minimalAds = ads.map((ad) => ({
      _id: ad._id,
      title: ad.title,
      price: ad.price,
      billsIncluded: ad.billsIncluded,
      membersCount: ad.membersCount,
      phoneNumber: ad.phoneNumber,
      descriptionSnippet: getDescriptionSnippet(ad.description),
      thumbUrl: getThumbUrl(ad.images),
      location: ad.location
        ? {
            lat: ad.location.coordinates[1],
            lng: ad.location.coordinates[0],
          }
        : null,
      address: ad.address,
      createdAt: ad.createdAt,
    }));

    // Cache for 60 seconds (if Redis is available)
    if (redis) {
      try {
        await redis.setex(cacheKey, 60, JSON.stringify(minimalAds));
      } catch (cacheError) {
        console.warn("Failed to cache ads:", cacheError.message);
      }
    }

    res.status(200).json({
      message: "Ads retrieved successfully",
      ads: minimalAds,
    });
  } catch (error) {
    console.error("Get published ads error:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve ads", error: error.message });
  }
};

// GET /api/ads/nearby - Geospatial query
const getNearbyAds = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng || !radius) {
      return res.status(400).json({
        message: "lat, lng, and radius query parameters are required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMeters)) {
      return res.status(400).json({
        message: "lat, lng, and radius must be valid numbers",
      });
    }

    if (radiusMeters <= 0) {
      return res.status(400).json({
        message: "radius must be greater than 0",
      });
    }

    // Geospatial query using 2dsphere index
    const ads = await Ad.find({
      status: "published",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusMeters,
        },
      },
    })
      .select(
        "_id title price billsIncluded membersCount description images location address",
      )
      .populate("owner", "name email")
      .lean();

    const result = ads.map((ad) => ({
      _id: ad._id,
      title: ad.title,
      price: ad.price,
      billsIncluded: ad.billsIncluded,
      membersCount: ad.membersCount,
      phoneNumber: ad.phoneNumber,
      descriptionSnippet: getDescriptionSnippet(ad.description),
      thumbUrl: getThumbUrl(ad.images),
      location: ad.location
        ? {
            lat: ad.location.coordinates[1],
            lng: ad.location.coordinates[0],
          }
        : null,
      address: ad.address,
    }));

    res.status(200).json({
      message: "Nearby ads retrieved successfully",
      ads: result,
    });
  } catch (error) {
    console.error("Get nearby ads error:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve nearby ads", error: error.message });
  }
};

// GET /api/ads - Get current user's ads (protected)
const getUserAds = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userAds = await Ad.find({ owner: userId })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      ads: userAds,
    });
  } catch (error) {
    console.error("Get user ads error:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve your ads", error: error.message });
  }
};

// POST /api/ads/:id/report - Report an ad (placeholder)
const reportAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    // Validate ad exists
    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // TODO: Store report in database (create Report model)
    // TODO: Send notification to moderators
    // TODO: Implement report tracking and spam detection

    console.log(
      `Report submitted for ad ${id} by user ${userId}: ${reason || "no reason provided"}`,
    );

    res.status(200).json({
      message:
        "Report submitted successfully. Thank you for helping keep our platform safe.",
      reportId: `report_${id}_${Date.now()}`,
    });
  } catch (error) {
    console.error("Report ad error:", error);
    res
      .status(500)
      .json({ message: "Failed to submit report", error: error.message });
  }
};

module.exports = {
  createAd,
  updateAd,
  deleteAd,
  getAdById,
  getPublishedAds,
  getNearbyAds,
  getUserAds,
  reportAd,
};
