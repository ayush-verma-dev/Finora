
require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

const MONGO_TEST_URI = process.env.MONGO_TEST_URI
const TEST_DB_NAME = "bank_transaction_test"

const run = async () => {
    if (!MONGO_TEST_URI) {
        throw new Error("MONGO_TEST_URI is missing from .env")
    }

    const connection = mongoose.createConnection(MONGO_TEST_URI, {
        serverSelectionTimeoutMS: 10000
    })

    try {
        await connection.asPromise()

        if (connection.name !== TEST_DB_NAME) {
            throw new Error(
                `Safety check failed: expected ${TEST_DB_NAME}, connected to ${connection.name}`
            )
        }

        const Account = connection.model(
            "Account",
            new mongoose.Schema({}, {
                strict: false,
                collection: "accounts"
            })
        )

        const accounts = await Account.find({})
            .select("accountNumber balance status currency user")
            .limit(20)
            .lean()

        console.log("Account inspection (read-only)")
        console.log(`Connected to: ${connection.name}`)
        console.log(`Accounts found: ${accounts.length}`)

        console.table(
            accounts.map(account => ({
                accountNumber: account.accountNumber,
                balance: account.balance,
                status: account.status,
                currency: account.currency,
                user: account.user?.toString()
            }))
        )

        console.log("Inspection completed. No data was modified.")
    } finally {
        await connection.close()
    }
}

run().catch(error => {
    console.error("Inspection failed:", error.message)
    process.exitCode = 1
})
