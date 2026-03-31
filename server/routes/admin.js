const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/auth");
const roleMiddleware = require("../middlewares/role");

const router = express.Router();

// Apply auth and role middleware to all admin routes
router.use(authMiddleware);
router.use(roleMiddleware(["admin"]));

// Ads management
router.get("/ads/review", adminController.getReviewAds);
router.get("/ads/all", adminController.getAllAds);
router.post("/ads/:id/publish", adminController.publishAd);
router.put("/ads/:id", adminController.updateAdAsAdmin);
router.delete("/ads/:id", adminController.deleteAd);

// Users management
router.post("/users/:id/ban", adminController.banUser);
router.get("/users", adminController.getUsers);
router.patch("/users/role", adminController.updateUserRole);

// Legacy endpoints
router.patch("/ads/flag", adminController.flagAd);

module.exports = router;
