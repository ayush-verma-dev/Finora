const dns = require("node:dns")
dns.setServers(["10.69.92.49"])

require("dotenv").config()

const mongoose = require("mongoose")
const Transaction = require("../src/models/Transaction")
const Ledger = require("../src/models/Ledger")

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_TEST_URI)

        if (mongoose.connection.name !== "bank_transaction_test") {
            throw new Error("Wrong database. Stopping verification.")
        }

        const transactions = await Transaction.find({
            idempotencyKey: {
                $in: [
                    "rollback-test-20261015-001-debit",
                    "rollback-test-20261015-001-credit"
                ]
            }
        }).lean()

        const transactionIds = transactions.map(item => item._id)

        const ledgerCount = transactionIds.length
            ? await Ledger.countDocuments({
                transaction: { $in: transactionIds }
            })
            : 0

        console.log({
            database: mongoose.connection.name,
            matchingTransactions: transactions.length,
            matchingLedgerEntries: ledgerCount
        })
    } catch (error) {
        console.error(error.message)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

run()