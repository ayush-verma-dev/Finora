
require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose = require("mongoose")

const inspectTestDB = async () => {
    let connection

    try {
        if (!process.env.MONGO_TEST_URI) {
            throw new Error("MONGO_TEST_URI is missing")
        }

        connection = await mongoose.createConnection(
            process.env.MONGO_TEST_URI,
            {
                serverSelectionTimeoutMS: 10000
            }
        ).asPromise()

        if (connection.name !== "bank_transaction_test") {
            throw new Error(
                `Unexpected database: ${connection.name}. Inspection stopped.`
            )
        }

        console.log("Connected to:", connection.name)

        const collections = await connection.db
            .listCollections({}, { nameOnly: true })
            .toArray()

        console.log(
            "Collections:",
            collections.map(collection => collection.name)
        )

        const accountCount = await connection.db
            .collection("accounts")
            .countDocuments()

        const userCount = await connection.db
            .collection("users")
            .countDocuments()

        const transactionCount = await connection.db
            .collection("transactions")
            .countDocuments()

        console.log("Test users:", userCount)
        console.log("Test accounts:", accountCount)
        console.log("Test transactions:", transactionCount)
        console.log("Inspection completed. No data was modified.")
    } catch (error) {
        console.error("Inspection failed:", error.message)
        process.exitCode = 1
    } finally {
        if (connection) {
            await connection.close()
        }
    }
}

inspectTestDB()
