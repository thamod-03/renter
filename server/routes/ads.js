const express = require("express");
const adController = require("../controllers/adController");
const authMiddleware = require("../middlewares/auth");
const { limiter } = require("../middlewares/rateLimiter");

const router = express.Router();

// Public routes - must be defined before /:id to avoid route conflicts
router.get("/published/list", limiter, adController.getPublishedAds);
router.get("/nearby/search", limiter, adController.getNearbyAds);

// Protected routes (must come before /:id to avoid conflicts)
router.get("/", limiter, authMiddleware, adController.getUserAds);

// Single ad route (public)
router.get("/:id", limiter, adController.getAdById);

// Protected routes
router.post("/", limiter, authMiddleware, adController.createAd);
router.put("/:id", limiter, authMiddleware, adController.updateAd);
router.patch("/:id", limiter, authMiddleware, adController.updateAd);
router.delete("/:id", limiter, authMiddleware, adController.deleteAd);
router.post("/:id/report", limiter, authMiddleware, adController.reportAd);

module.exports = router;
