
require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

const MONGO_TEST_URI = process.env.MONGO_TEST_URI
const TEST_DB_NAME = "bank_transaction_test"
const TEST_ACCOUNT_NUMBER = "9000000000001"
const TEST_AMOUNT = 50

const runTest = async () => {
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
            new mongoose.Schema({}, { strict: false, collection: "accounts" })
        )

        const account = await Account.findOne({
            accountNumber: TEST_ACCOUNT_NUMBER
        }).lean()

        if (!account) {
            throw new Error("Dedicated test account was not found")
        }

        if (account.status !== "active") {
            throw new Error("Test account must be active")
        }

        if (typeof account.balance !== "number") {
            throw new Error("Test account balance is not numeric")
        }

        console.log("Safe idempotency concurrency preflight passed")
        console.log(`Database: ${connection.name}`)
        console.log(`Test account: ${TEST_ACCOUNT_NUMBER}`)
        console.log(`Current balance: ₹${account.balance}`)
        console.log(`Proposed debit amount: ₹${TEST_AMOUNT}`)
        console.log("Planned requests: two concurrent requests with one idempotency key")
        console.log("No API requests were sent.")
        console.log("No balances or records were changed.")
        console.log("This is a preflight check, not a concurrency test.")
    } finally {
        await connection.close()
    }
}

runTest().catch(error => {
    console.error("Preflight stopped:", error.message)
    process.exitCode = 1
})
