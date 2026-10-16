
require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose = require("mongoose")

const TEST_DB_NAME = "bank_transaction_test"

const verifyTestDB = async () => {
    let connection

    try {
        if (!process.env.MONGO_TEST_URI) {
            throw new Error("MONGO_TEST_URI is missing")
        }

        connection = await mongoose.createConnection(
            process.env.MONGO_TEST_URI,
            { serverSelectionTimeoutMS: 10000 }
        ).asPromise()

        if (connection.name !== TEST_DB_NAME) {
            throw new Error(
                `Unexpected database: ${connection.name}. Verification stopped.`
            )
        }

        console.log("Connected to:", connection.name)

        const hello = await connection.db.admin().command({
            hello: 1
        })

        const supportsTransactions = Boolean(
            hello.setName || hello.msg === "isdbgrid"
        )

        console.log("Replica set:", hello.setName || "Not detected")
        console.log("MongoDB router:", hello.msg === "isdbgrid")
        console.log(
            "Transaction support:",
            supportsTransactions ? "Supported" : "Not detected"
        )

        if (!supportsTransactions) {
            throw new Error(
                "MongoDB transactions are not supported by this deployment"
            )
        }

        console.log("Test database verification passed")
        console.log("No documents were inserted, updated, or deleted.")
    } catch (error) {
        console.error("Verification failed:", error.message)
        process.exitCode = 1
    } finally {
        if (connection) {
            await connection.close()
        }
    }
}

verifyTestDB()
