
const dns = require("node:dns")
const mongoose = require("mongoose")
require("dotenv").config()

dns.setServers(["10.69.92.49"])

const Account = require("../src/models/Account")
const User = require("../src/models/User")

async function main() {
    await mongoose.connect(process.env.MONGO_TEST_URI)

    if (mongoose.connection.name !== "bank_transaction_test") {
        throw new Error("Safety check failed: wrong database")
    }

    const account = await Account.findOne({
        accountNumber: "9000000000002"
    }).select("accountNumber user balance status")

    if (!account) {
        console.log("Receiver test account not found")
        return
    }

    const user = await User.findById(account.user)
        .select("name email role")

    console.log({
        database: mongoose.connection.name,
        accountNumber: account.accountNumber,
        balance: account.balance,
        status: account.status,
        owner: user
            ? {
                name: user.name,
                email: user.email,
                role: user.role
            }
            : "No matching user found"
    })
}

main()
    .catch(error => {
        console.error("Lookup failed:", error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
