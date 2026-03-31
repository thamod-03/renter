const User = require("../models/User");
const Ad = require("../models/Ad");
const AuditLog = require("../models/AuditLog");
const { getRedis } = require("../config/redis");

// GET /api/admin/ads/review - List ads pending review
const getReviewAds = async (req, res) => {
  try {
    const ads = await Ad.find({ status: "review" })
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Review ads retrieved successfully",
      ads,
    });
  } catch (error) {
    console.error("Get review ads error:", error);
    res.status(500).json({
      message: "Failed to retrieve review ads",
      error: error.message,
    });
  }
};

// POST /api/admin/ads/:id/publish - Publish ad
const publishAd = async (req, res) => {
  try {
    const { id } = req.params;

    // Check admin authentication
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ad = await Ad.findByIdAndUpdate(
      id,
      { status: "published", publishedAt: new Date() },
      { new: true },
    ).populate("owner", "name email phone");

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // Log action - wrap in try-catch to not block response
    try {
      await AuditLog.create({
        action: "PUBLISH_AD",
        actor: req.user.userId,
        targetType: "Ad",
        targetId: id,
        changes: { status: "review -> published" },
      });
    } catch (logError) {
      console.error("Audit log creation error:", logError);
    }

    // Invalidate Redis cache - wrap in try-catch to not block response
    try {
      const redis = getRedis();
      if (redis) {
        await redis.del("ads:published:minimal");
      }
    } catch (redisError) {
      console.error("Redis cache invalidation error:", redisError);
    }

    res.status(200).json({
      message: "Ad published successfully",
      ad,
    });
  } catch (error) {
    console.error("Publish ad error:", error);
    res.status(500).json({
      message: "Failed to publish ad",
      error: error.message,
    });
  }
};

// POST /api/admin/users/:id/ban - Ban user (cannot ban admins)
const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent banning admins or moderators
    if (user.role === "admin" || user.role === "moderator") {
      return res
        .status(403)
        .json({ message: "Cannot ban admin or moderator accounts" });
    }

    user.banned = true;
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;

    // Log action
    await AuditLog.create({
      action: "BAN_USER",
      actor: req.user.userId,
      targetType: "User",
      targetId: id,
      changes: { reason: reason || "Not specified" },
    });

    res.status(200).json({
      message: "User banned successfully",
      user: userObj,
    });
  } catch (error) {
    console.error("Ban user error:", error);
    res.status(500).json({
      message: "Failed to ban user",
      error: error.message,
    });
  }
};

// GET /api/admin/users - Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ message: "Users retrieved successfully", users });
  } catch (error) {
    console.error("Get users error:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve users", error: error.message });
  }
};

// PATCH /api/admin/users/role - Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!["renter", "admin", "moderator"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("Update user role error:", error);
    res
      .status(500)
      .json({ message: "Failed to update user role", error: error.message });
  }
};

// PATCH /api/admin/ads/flag - Flag ad
const flagAd = async (req, res) => {
  try {
    const { adId, reason } = req.body;

    const ad = await Ad.findByIdAndUpdate(
      adId,
      { status: "flagged" },
      { new: true },
    );

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    await AuditLog.create({
      action: "FLAG_AD",
      actor: req.user?.userId,
      targetType: "Ad",
      targetId: adId,
      changes: { reason },
    });

    res.status(200).json({ message: "Ad flagged successfully", ad });
  } catch (error) {
    console.error("Flag ad error:", error);
    res
      .status(500)
      .json({ message: "Failed to flag ad", error: error.message });
  }
};

// GET /api/admin/ads/all - Get all ads for admin management
const getAllAds = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const ads = await Ad.find(query)
      .populate("owner", "name email phone role banned")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "All ads retrieved successfully",
      ads,
    });
  } catch (error) {
    console.error("Get all ads error:", error);
    res.status(500).json({
      message: "Failed to retrieve ads",
      error: error.message,
    });
  }
};

// PUT /api/admin/ads/:id - Update any ad as admin
const updateAdAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      price,
      description,
      status,
      address,
      billsIncluded,
      membersCount,
    } = req.body;

    // Check admin authentication
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // Update fields
    if (title !== undefined) ad.title = title;
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
    if (
      status !== undefined &&
      ["review", "published", "removed"].includes(status)
    ) {
      ad.status = status;
    }

    await ad.save();
    await ad.populate("owner", "name email phone");

    // Log action - wrap in try-catch to not block response
    try {
      await AuditLog.create({
        action: "UPDATE_AD_ADMIN",
        actor: req.user.userId,
        targetType: "Ad",
        targetId: id,
        changes: { updated_fields: Object.keys(req.body) },
      });
    } catch (logError) {
      console.error("Audit log creation error:", logError);
    }

    // Invalidate cache - wrap in try-catch to not block response
    try {
      const redis = getRedis();
      if (redis) {
        await redis.del("ads:published:minimal");
      }
    } catch (redisError) {
      console.error("Redis cache invalidation error:", redisError);
    }

    // Transform location from GeoJSON to lat/lng format
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
    res.status(500).json({
      message: "Failed to update ad",
      error: error.message,
    });
  }
};

// DELETE /api/admin/ads/:id - Delete ad from review (soft delete)
const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    // Check admin authentication
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ad = await Ad.findByIdAndUpdate(
      id,
      { status: "removed" },
      { new: true },
    );

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // Log action - wrap in try-catch to not block response
    try {
      await AuditLog.create({
        action: "DELETE_AD",
        actor: req.user.userId,
        targetType: "Ad",
        targetId: id,
        changes: { reason: reason || "Rejected from review" },
      });
    } catch (logError) {
      console.error("Audit log creation error:", logError);
      // Continue anyway - don't fail the delete if audit log fails
    }

    // Invalidate Redis cache - wrap in try-catch to not block response
    try {
      const redis = getRedis();
      if (redis) {
        await redis.del("ads:published:minimal");
      }
    } catch (redisError) {
      console.error("Redis cache invalidation error:", redisError);
      // Continue anyway - cache invalidation is not critical
    }

    res.status(200).json({
      message: "Ad deleted successfully",
      ad,
    });
  } catch (error) {
    console.error("Delete ad error:", error);
    res.status(500).json({
      message: "Failed to delete ad",
      error: error.message,
    });
  }
};

module.exports = {
  getReviewAds,
  publishAd,
  banUser,
  getUsers,
  updateUserRole,
  flagAd,
  deleteAd,
  getAllAds,
  updateAdAsAdmin,
};
