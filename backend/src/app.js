
const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const helmet = require("helmet")

// Routers
const authRoutes = require("./routes/auth.routes")
const accountRoutes = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")

const app = express()

// Security headers
app.use(helmet())

// CORS configuration
const allowedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:5173"
)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests without an Origin header, such as local health checks.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        return callback(new Error("Origin not allowed by CORS"))
    },
    credentials: true
}))

// Request parsing
app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({
    extended: true,
    limit: "10kb"
}))
app.use(cookieParser())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/account", accountRoutes)
app.use("/api/transactions", transactionRoutes)

// Root route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Bank Transaction System API is running"
    })
})

// Central error handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }

    if (err.message === "Origin not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed"
        })
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body too large"
        })
    }

    console.error("Request error:", err.message)

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    })
})

module.exports = app
