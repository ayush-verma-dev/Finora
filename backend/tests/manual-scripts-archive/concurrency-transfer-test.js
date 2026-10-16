
require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

const Account = require("../src/models/Account")

const SENDER_ACCOUNT_NUMBER = "9000000000001"
const RECEIVER_ACCOUNT_NUMBER = "9000000000002"
const TRANSFER_AMOUNT = 5

const runTest = async () => {
    try {
        if (!process.env.MONGO_TEST_URI) {
            throw new Error("MONGO_TEST_URI is missing")
        }

        await mongoose.connect(process.env.MONGO_TEST_URI)

        if (mongoose.connection.name !== "bank_transaction_test") {
            throw new Error(
                `Wrong database: ${mongoose.connection.name}`
            )
        }

        const accounts = await Account.find({
            accountNumber: {
                $in: [
                    SENDER_ACCOUNT_NUMBER,
                    RECEIVER_ACCOUNT_NUMBER
                ]
            }
        }).lean()

        const sender = accounts.find(
            account => account.accountNumber === SENDER_ACCOUNT_NUMBER
        )

        const receiver = accounts.find(
            account => account.accountNumber === RECEIVER_ACCOUNT_NUMBER
        )

        if (!sender || !receiver) {
            throw new Error(
                "Sender or receiver test account is missing"
            )
        }

        if (sender.status !== "active" || receiver.status !== "active") {
            throw new Error("Both test accounts must be active")
        }

        if (sender.balance < TRANSFER_AMOUNT) {
            throw new Error("Sender has insufficient test balance")
        }

        console.log("Transfer preflight passed")
        console.log("Database:", mongoose.connection.name)
        console.log(`Sender balance: ₹${sender.balance}`)
        console.log(`Receiver balance: ₹${receiver.balance}`)
        console.log(`Proposed transfer: ₹${TRANSFER_AMOUNT}`)
        console.log("No API requests were sent.")
        console.log("No balances or records were changed.")
        console.log("This is a preflight check, not a concurrency test.")
    } catch (error) {
        console.error("Transfer preflight failed:", error.message)
        process.exitCode = 1
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect()
        }
    }
}

runTest()
