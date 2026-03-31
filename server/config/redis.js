const Redis = require("ioredis");

let redisClient;

const initRedis = () => {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL environment variable is not defined");
    }

    redisClient = new Redis(process.env.REDIS_URL);

    redisClient.on("connect", () => {
      console.log("Redis connected successfully");
    });

    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    return redisClient;
  } catch (error) {
    console.error("Redis initialization failed:", error.message);
  }
};

const getRedis = () => {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call initRedis() first.");
  }
  return redisClient;
};

module.exports = {
  initRedis,
  getRedis,
};
