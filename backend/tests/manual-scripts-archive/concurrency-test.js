require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

const Account = require("../src/models/Account")

const TEST_ACCOUNT_NUMBER = "9000000000001"
const DEBIT_AMOUNT = 9000

const runTest = async () => {
    try {
        if (!process.env.MONGO_TEST_URI) {
            throw new Error("MONGO_TEST_URI is missing")
        }

        await mongoose.connect(process.env.MONGO_TEST_URI)

        if (mongoose.connection.name !== "bank_transaction_test") {
            throw new Error("Wrong database. Test stopped.")
        }

        const account = await Account.findOne({
            accountNumber: TEST_ACCOUNT_NUMBER
        }).lean()

        if (!account) {
            throw new Error("Test account was not found")
        }

        console.log("Connected to:", mongoose.connection.name)
        console.log("Test account:", account.accountNumber)
        console.log("Current balance:", account.balance)
        console.log("Proposed debit amount:", DEBIT_AMOUNT)

        if (account.status !== "active") {
            throw new Error("Test account must be active")
        }

        if (account.balance >= DEBIT_AMOUNT) {
            console.log(
                "Preflight complete: choose an amount greater than the balance for an insufficient-funds test."
            )
        } else {
            console.log(
                "Preflight passed: the debit amount exceeds the available balance."
            )
        }

        console.log("No API requests were sent. No balances were changed.")
    } catch (error) {
        console.error("Concurrency preflight failed:", error.message)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

runTest()
