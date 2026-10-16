const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const User = require("../models/User")

const isProduction = process.env.NODE_ENV === "production"

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000
}

const clearCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/"
}

// Validate JWT configuration before creating tokens
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET

    if (!secret || secret.length < 32) {
        throw new Error(
            "JWT_SECRET must be configured with at least 32 characters"
        )
    }

    return secret
}

// Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body

        // Validate required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof phone !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password ||
            !phone.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        const normalizedEmail = email.trim().toLowerCase()

        // Validate email format
        if (
            normalizedEmail.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            })
        }

        // Validate name and phone length
        if (name.trim().length > 100 || phone.trim().length > 20) {
            return res.status(400).json({
                success: false,
                message: "Name or phone number is too long"
            })
        }

        // bcrypt supports passwords up to 72 bytes
        if (
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters and no more than 72 bytes"
            })
        }

        // Validate JWT configuration
        const jwtSecret = getJwtSecret()

        // Check whether the user already exists
        const existingUser = await User.findOne({
            email: normalizedEmail
        })

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone.trim()
        })

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            jwtSecret,
            {
                expiresIn: "1d",
                algorithm: "HS256"
            }
        )

        // Set authentication cookie
        res.cookie("token", token, cookieOptions)

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            })
        }

        console.error("Registration failed")

        return res.status(500).json({
            success: false,
            message: "Server error during registration"
        })
    }
}

// Login User
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validate required credentials
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required"
            })
        }

        // Validate input lengths
        if (
            email.trim().length > 254 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        const jwtSecret = getJwtSecret()
        const normalizedEmail = email.trim().toLowerCase()

        // Find user
        const user = await User.findOne({
            email: normalizedEmail
        })

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        )

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        // Prevent blacklisted users from logging in
        if (user.isBlacklisted) {
            return res.status(403).json({
                success: false,
                message: "User account is blacklisted"
            })
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            jwtSecret,
            {
                expiresIn: "1d",
                algorithm: "HS256"
            }
        )

        // Set authentication cookie
        res.cookie("token", token, cookieOptions)

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        })
    } catch (error) {
        console.error("Login failed")

        return res.status(500).json({
            success: false,
            message: "Server error during login"
        })
    }
}

// Logout User
const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token", clearCookieOptions)

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        console.error("Logout failed")

        return res.status(500).json({
            success: false,
            message: "Server error during logout"
        })
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser
}
