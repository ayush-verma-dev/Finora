
const dns = require("node:dns")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

dns.setServers(["10.69.92.49"])

const User = require("../src/models/User")

async function main() {
    const email = "testuser2@example.com"
    const newPassword = "TestUserTwo@123"

    if (!process.env.MONGO_TEST_URI) {
        throw new Error("MONGO_TEST_URI is missing")
    }

    await mongoose.connect(process.env.MONGO_TEST_URI)

    if (mongoose.connection.name !== "bank_transaction_test") {
        throw new Error("Safety check failed: wrong database")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new Error("Test User Two was not found")
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    console.log("Test User Two password reset successfully")
    console.log("Database:", mongoose.connection.name)
    console.log("Email:", email)
    console.log("You can now log in using the new password")
}

main()
    .catch(error => {
        console.error("Password reset failed:", error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
