
const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

const connectDB = async () => {
    try {
        const isTest = process.env.NODE_ENV === "test"
        const mongoUri = isTest
            ? process.env.MONGO_TEST_URI
            : process.env.MONGO_URI

        if (!mongoUri) {
            throw new Error(
                isTest
                    ? "MONGO_TEST_URI is missing"
                    : "MONGO_URI is missing"
            )
        }

        const connection = await mongoose.connect(mongoUri)

        const expectedDatabase = isTest
            ? "bank_transaction_test"
            : null

        if (
            expectedDatabase &&
            connection.connection.name !== expectedDatabase
        ) {
            await mongoose.disconnect()
            throw new Error(
                `Wrong test database: ${connection.connection.name}`
            )
        }

        console.log(
            `MongoDB Connected: ${connection.connection.host}`
        )
        console.log(
            `Database: ${connection.connection.name}`
        )
    } catch (error) {
        console.error("MongoDB Connection failed:", error.message)
        process.exit(1)
    }
}

module.exports = connectDB
