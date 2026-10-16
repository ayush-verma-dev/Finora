
require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

const TEST_DB_NAME = "bank_transaction_test"

const seedTestData = async () => {
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
                `Wrong database: ${connection.name}. Preflight stopped.`
            )
        }

        const User = connection.model(
            "User",
            new mongoose.Schema({}, {
                strict: false,
                collection: "users"
            })
        )

        const Account = connection.model(
            "Account",
            new mongoose.Schema({}, {
                strict: false,
                collection: "accounts"
            })
        )

        const userCount = await User.countDocuments()
        const accountCount = await Account.countDocuments()

        console.log("Test-data seeding preflight passed")
        console.log("Connected to:", connection.name)
        console.log("Existing users:", userCount)
        console.log("Existing accounts:", accountCount)

        if (userCount > 0 || accountCount > 0) {
            console.log(
                "Seeding skipped: existing records were found."
            )
        } else {
            console.log(
                "Database is empty. Review the User and Account schemas before enabling seeding."
            )
        }

        console.log("No records were created or modified.")
    } catch (error) {
        console.error("Seeding preflight failed:", error.message)
        process.exitCode = 1
    } finally {
        if (connection) {
            await connection.close()
        }
    }
}

seedTestData()
