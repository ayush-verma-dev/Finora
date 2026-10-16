
require("dotenv").config()

const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const dns = require("dns")
const User = require("../src/models/User")

dns.setServers(["8.8.8.8", "8.8.4.4"])

async function resetPassword() {
    if (!process.env.MONGO_TEST_URI) {
        throw new Error("MONGO_TEST_URI is missing from .env")
    }

    await mongoose.connect(process.env.MONGO_TEST_URI, {
        serverSelectionTimeoutMS: 10000
    })

    try {
        if (mongoose.connection.name !== "bank_transaction_test") {
            throw new Error(
                `Safety check failed: connected to ${mongoose.connection.name}`
            )
        }

        const email = "testuser1@example.com"
        const newPassword = "TestPass123!"

        const user = await User.findOne({ email })

        if (!user) {
            throw new Error("Test user not found in the test database")
        }

        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()

        const updatedUser = await User.findOne({ email })
        const passwordMatches = await bcrypt.compare(
            newPassword,
            updatedUser.password
        )

        if (!passwordMatches) {
            throw new Error("Password verification failed after reset")
        }

        console.log("Password reset and verified successfully")
        console.log("Email:", email)
        console.log("Database:", mongoose.connection.name)
    } finally {
        await mongoose.disconnect()
    }
}

resetPassword().catch(error => {
    console.error(error.message)
    process.exitCode = 1
})
