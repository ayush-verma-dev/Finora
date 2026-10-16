
require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

const TEST_DB_NAME = "bank_transaction_test"
const TEST_ACCOUNT_NUMBER = "9000000000001"
const TEST_AMOUNT = 50

const runTest = async () => {
    if (!process.env.MONGO_TEST_URI) {
        throw new Error("MONGO_TEST_URI is missing from .env")
    }

    const connection = mongoose.createConnection(
        process.env.MONGO_TEST_URI,
        {
            serverSelectionTimeoutMS: 10000
        }
    )

    try {
        await connection.asPromise()

        if (connection.name !== TEST_DB_NAME) {
            throw new Error(
                `Wrong database: ${connection.name}. Test stopped.`
            )
        }

        const Account = connection.model(
            "Account",
            new mongoose.Schema({}, {
                strict: false,
                collection: "accounts"
            })
        )

        const account = await Account.findOne({
            accountNumber: TEST_ACCOUNT_NUMBER
        }).lean()

        if (!account) {
            throw new Error("Test account was not found")
        }

        if (account.status !== "active") {
            throw new Error("Test account must be active")
        }

        if (
            typeof account.balance !== "number" ||
            account.balance < TEST_AMOUNT
        ) {
            throw new Error(
                `Invalid or insufficient test balance: ₹${account.balance}`
            )
        }

        console.log("Idempotency concurrency preflight passed")
        console.log(`Database: ${connection.name}`)
        console.log(`Test account: ${account.accountNumber}`)
        console.log(`Current balance: ₹${account.balance}`)
        console.log(`Proposed debit: ₹${TEST_AMOUNT}`)
        console.log(
            "Planned requests: two concurrent requests with the same idempotency key"
        )
        console.log("No API requests were sent.")
        console.log("No balances or records were changed.")
        console.log(
            "This is a preflight check, not an idempotency concurrency test."
        )
    } finally {
        await connection.close()
    }
}

runTest().catch(error => {
    console.error("Idempotency preflight failed:", error.message)
    process.exitCode = 1
})
