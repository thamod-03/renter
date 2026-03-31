const Ad = require("../models/Ad");
const { getRedis } = require("../config/redis");

const moderationJob = async () => {
  try {
    const redis = getRedis();

    // Fetch flagged ads
    const flaggedAds = await Ad.find({ status: "flagged" });

    for (const ad of flaggedAds) {
      // Check if ad was already reviewed in cache
      const cacheKey = `ad_review:${ad._id}`;
      const cached = await redis.get(cacheKey);

      if (!cached) {
        console.log(`Processing flagged ad: ${ad._id}`);
        // Add moderation logic here

        // Mark as processed in Redis for 24 hours
        await redis.setex(cacheKey, 86400, "processed");
      }
    }

    console.log("Moderation job completed");
  } catch (error) {
    console.error("Moderation job error:", error);
  }
};

module.exports = moderationJob;
