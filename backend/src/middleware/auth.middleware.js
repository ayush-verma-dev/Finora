const jwt = require("jsonwebtoken")
const User = require("../models/User")

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Get token from cookie
        const token = req.cookies?.token

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            })
        }

        // 2. Validate JWT secret
        const secret = process.env.JWT_SECRET

        if (!secret || secret.length < 32) {
            console.error("JWT_SECRET is missing or invalid")

            return res.status(500).json({
                success: false,
                message: "Authentication service unavailable"
            })
        }

        // 3. Verify token and algorithm
        const decoded = jwt.verify(token, secret, {
            algorithms: ["HS256"]
        })

        // 4. Find user
        const user = await User.findById(decoded.userId).select(
            "-password"
        )

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            })
        }

        // 5. Check blacklist
        if (user.isBlacklisted) {
            return res.status(403).json({
                success: false,
                message: "User account is blacklisted"
            })
        }

        // 6. Attach user to request
        req.user = user

        // 7. Continue
        return next()
    } catch (error) {
        if (error.name !== "JsonWebTokenError" &&
            error.name !== "TokenExpiredError" &&
            error.name !== "NotBeforeError") {
            console.error("Authentication error:", error.message)
        }

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        })
    }
}

module.exports = authMiddleware
