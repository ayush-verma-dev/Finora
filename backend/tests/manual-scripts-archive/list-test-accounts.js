
require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

async function inspectAccounts() {
    if (!process.env.MONGO_TEST_URI) {
        throw new Error("MONGO_TEST_URI is missing from .env")
    }

    const connection = mongoose.createConnection(
        process.env.MONGO_TEST_URI,
        { serverSelectionTimeoutMS: 10000 }
    )

    try {
        await connection.asPromise()

        if (connection.name !== "bank_transaction_test") {
            throw new Error(
                `Safety check failed: connected to ${connection.name}`
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
            .select("-__v")
            .lean()

        console.log("Test accounts:")

        for (const account of accounts) {
            console.log({
                accountNumber: account.accountNumber,
                balance: account.balance,
                status: account.status
            })
        }
    } finally {
        await connection.close()
    }
}

inspectAccounts().catch(error => {
    console.error(error.message)
    process.exitCode = 1
})
