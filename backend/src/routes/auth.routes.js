
const express = require("express")

const {
    registerUser,
    loginUser,
    logoutUser
} = require("../controllers/auth.controller")

const authMiddleware = require("../middleware/auth.middleware")
const { authLimiter } = require("../middleware/rateLimit.middleware")

const router = express.Router()

// Test route
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Auth route is working"
    })
})

// Register with rate limiting
router.post("/register", authLimiter, registerUser)

// Login with rate limiting
router.post("/login", authLimiter, loginUser)

// Logout
router.post("/logout", logoutUser)

// Protect user information
router.get("/me", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Authentication successful",
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            role: req.user.role,
            isVerified: req.user.isVerified
        }
    })
})

module.exports = router
