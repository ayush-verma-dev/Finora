require("dotenv").config()

const app = require("./src/app")
const connectDB = require("./src/config/db")

const PORT = process.env.PORT || 5000

// Validate essential environment variables
const validateEnvironment = () => {
    if (
        !process.env.JWT_SECRET ||
        process.env.JWT_SECRET.length < 32
    ) {
        throw new Error(
            "JWT_SECRET must be configured with at least 32 characters"
        )
    }
}

// Start the server
const startServer = async () => {
    let server

    try {
        validateEnvironment()

        await connectDB()

        server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })

        server.on("error", error => {
            console.error("Server startup failed:", error.message)
            process.exitCode = 1
        })

        // Graceful shutdown
        const shutdown = signal => {
            console.log(`${signal} received. Shutting down server...`)

            if (!server.listening) {
                process.exit(0)
            }

            server.close(async error => {
                if (error) {
                    console.error("Server shutdown failed:", error.message)
                    process.exit(1)
                }

                try {
                    const mongoose = require("mongoose")
                    await mongoose.disconnect()

                    console.log("Server shut down successfully")
                    process.exit(0)
                } catch (disconnectError) {
                    console.error(
                        "Database shutdown failed:",
                        disconnectError.message
                    )
                    process.exit(1)
                }
            })
        }

        process.once("SIGINT", () => shutdown("SIGINT"))
        process.once("SIGTERM", () => shutdown("SIGTERM"))
    } catch (error) {
        console.error("Server failed to start:", error.message)

        if (server && server.listening) {
            server.close()
        }

        process.exitCode = 1
    }
}

startServer()
