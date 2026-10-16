
require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose = require("mongoose")

const TEST_DB_NAME = "bank_transaction_test"

const keys = [
    "isolated-transfer-1791988396094-001-credit",
    "isolated-transfer-1791988396094-002-credit"
]

const run = async () => {
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
                `Unexpected database: ${connection.name}. Inspection stopped.`
            )
        }

        const Transaction = connection.model(
            "Transaction",
            new mongoose.Schema({}, {
                strict: false,
                collection: "transactions"
            })
        )

        const transactions = await Transaction.find({
            idempotencyKey: { $in: keys }
        })
            .select(
                "transactionId account type amount status idempotencyKey relatedAccount createdAt"
            )
            .lean()

        console.log("Connected to:", connection.name)
        console.log("Matching records:", transactions.length)

        console.dir(
            transactions.map(transaction => ({
                transactionId: transaction.transactionId,
                account: transaction.account?.toString(),
                type: transaction.type,
                amount: transaction.amount,
                status: transaction.status,
                idempotencyKey: transaction.idempotencyKey,
                relatedAccount: transaction.relatedAccount?.toString(),
                createdAt: transaction.createdAt
            })),
            { depth: null }
        )

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

run()
