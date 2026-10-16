
const dns = require("node:dns")
const mongoose = require("mongoose")
require("dotenv").config()

dns.setServers(["10.69.92.49"])

const Account = require("../src/models/Account")

const accountNumber = process.argv[2]
const newStatus = process.argv[3]

async function main() {
    if (!accountNumber || !["active", "blocked", "closed"].includes(newStatus)) {
        throw new Error(
            "Usage: node tests/set-test-account-status.js <accountNumber> <active|blocked|closed>"
        )
    }

    await mongoose.connect(process.env.MONGO_TEST_URI)

    if (mongoose.connection.name !== "bank_transaction_test") {
        throw new Error("Safety check failed: not connected to the test database")
    }

    const account = await Account.findOneAndUpdate(
        { accountNumber },
        { $set: { status: newStatus } },
        { returnDocument: "after", runValidators: true }
    )

    if (!account) {
        throw new Error("Test account not found")
    }

    console.log({
        database: mongoose.connection.name,
        accountNumber: account.accountNumber,
        status: account.status,
        balance: account.balance
    })
}

main()
    .catch(error => {
        console.error("Error:", error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
