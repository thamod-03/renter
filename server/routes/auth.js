const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth");
const { authLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);

router.get("/me", authMiddleware, authController.getProfile);

module.exports = router;
