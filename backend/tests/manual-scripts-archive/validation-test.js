
require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

const MONGO_TEST_URI = process.env.MONGO_TEST_URI
const TEST_DB_NAME = "bank_transaction_test"
const TEST_ACCOUNT_NUMBER = "9000000000001"

const testCases = [
    {
        name: "Missing amount",
        body: {
            idempotencyKey: "validation-missing",
            description: "Missing amount validation test"
        },
        expectedMessage: "Amount is required"
    },
    {
        name: "Empty amount",
        body: {
            amount: "",
            idempotencyKey: "validation-empty",
            description: "Empty amount validation test"
        },
        expectedMessage: "Amount is required"
    },
    {
        name: "Zero amount",
        body: {
            amount: 0,
            idempotencyKey: "validation-zero",
            description: "Zero amount validation test"
        },
        expectedMessage: "Amount must be greater than 0"
    },
    {
        name: "Negative amount",
        body: {
            amount: -10,
            idempotencyKey: "validation-negative",
            description: "Negative amount validation test"
        },
        expectedMessage: "Amount must be greater than 0"
    },
    {
        name: "Non-numeric amount",
        body: {
            amount: "abc",
            idempotencyKey: "validation-nonnumeric",
            description: "Non-numeric amount validation test"
        },
        expectedMessage: "Amount must be a valid number"
    },
    {
        name: "Credit description exceeds 200 characters",
        endpoint: "/api/transactions/credit",
        body: {
            amount: 10,
            idempotencyKey: "validation-credit-description",
            description: "A".repeat(201)
        },
        expectedMessage: "Description cannot exceed 200 characters"
    },
    {
        name: "Debit description exceeds 200 characters",
        endpoint: "/api/transactions/debit",
        body: {
            amount: 10,
            idempotencyKey: "validation-debit-description",
            description: "A".repeat(201)
        },
        expectedMessage: "Description cannot exceed 200 characters"
    },
    {
        name: "Transfer description exceeds 200 characters",
        endpoint: "/api/transactions/transfer",
        body: {
            receiverAccountNumber: "9000000000002",
            amount: 10,
            idempotencyKey: "validation-transfer-description",
            description: "A".repeat(201)
        },
        expectedMessage: "Description cannot exceed 200 characters"
    },
    {
        name: "Credit description is not a string",
        endpoint: "/api/transactions/credit",
        body: {
            amount: 10,
            idempotencyKey: "validation-credit-type",
            description: 123
        },
        expectedMessage: "Description must be a string"
    },
    {
        name: "Debit description is not a string",
        endpoint: "/api/transactions/debit",
        body: {
            amount: 10,
            idempotencyKey: "validation-debit-type",
            description: 123
        },
        expectedMessage: "Description must be a string"
    },
    {
        name: "Transfer description is not a string",
        endpoint: "/api/transactions/transfer",
        body: {
            receiverAccountNumber: "9000000000002",
            amount: 10,
            idempotencyKey: "validation-transfer-type",
            description: 123
        },
        expectedMessage: "Description must be a string"
    },
    {
        name: "Description exactly 200 characters",
        endpoint: "/api/transactions/debit",
        body: {
            amount: 10,
            idempotencyKey: "validation-description-200",
            description: "A".repeat(200)
        },
        expectedMessage: null
    },
    {
        name: "Description exceeds 200 characters",
        endpoint: "/api/transactions/debit",
        body: {
            amount: 10,
            idempotencyKey: "validation-description-201",
            description: "A".repeat(201)
        },
        expectedMessage: "Description cannot exceed 200 characters"
    }
]

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

        const account = await Account.findOne({
            accountNumber: TEST_ACCOUNT_NUMBER
        }).lean()

        if (!account) {
            throw new Error("Dedicated test account was not found")
        }

        console.log("Validation test preflight passed")
        console.log(`Database: ${connection.name}`)
        console.log(`Test account: ${TEST_ACCOUNT_NUMBER}`)
        console.log(`Current balance: ₹${account.balance}`)
        console.log(`Validation cases reviewed: ${testCases.length}`)

        for (const testCase of testCases) {
            console.log(
                `READY: ${testCase.name} | ` +
                `Expected: ${testCase.expectedMessage || "valid description"}`
            )
        }

        console.log("\nNo API requests were sent.")
        console.log("No balances or records were changed.")
        console.log(
            "This is a preflight check, not an API validation test."
        )
    } finally {
        await connection.close()
    }
}

run().catch(error => {
    console.error("Validation preflight failed:", error.message)
    process.exitCode = 1
})
