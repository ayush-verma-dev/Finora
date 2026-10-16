
require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

const TEST_DB_NAME = "bank_transaction_test"
const TEST_ACCOUNT_NUMBER = "9000000000001"

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

        const Transaction = connection.model(
            "Transaction",
            new mongoose.Schema({}, {
                strict: false,
                collection: "transactions"
            })
        )

        const account = await Account.findOne({
            accountNumber: TEST_ACCOUNT_NUMBER
        }).lean()

        if (!account) {
            throw new Error("Test account was not found")
        }

        const original = await Transaction.findOne({
            account: account._id,
            type: "debit",
            status: "completed",
            idempotencyKey: {
                $exists: true,
                $nin: ["", null]
            }
        }).sort({ createdAt: -1 }).lean()

        if (!original) {
            throw new Error(
                "No completed debit with an idempotency key was found"
            )
        }

        console.log("Same-request idempotency preflight passed")
        console.log(`Database: ${connection.name}`)
        console.log(`Test account: ${account.accountNumber}`)
        console.log(`Current balance: ₹${account.balance}`)
        console.log(`Existing transaction: ${original.transactionId}`)
        console.log(`Existing debit amount: ₹${original.amount}`)
        console.log(`Transaction status: ${original.status}`)
        console.log(
            `Existing idempotency key found: ${Boolean(original.idempotencyKey)}`
        )
        console.log("No API requests were sent.")
        console.log("No balances or records were changed.")
        console.log(
            "This is a preflight check, not an idempotency retry test."
        )
    } finally {
        await connection.close()
    }
}

runTest().catch(error => {
    console.error("Same-request preflight failed:", error.message)
    process.exitCode = 1
})
