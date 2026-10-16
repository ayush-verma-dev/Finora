
const dns = require("node:dns")
const mongoose = require("mongoose")
require("dotenv").config()

dns.setServers(["10.69.92.49"])

const Account = require("../src/models/Account")

async function main() {
    const dailyTotal = Number(process.argv[2])

    if (!Number.isFinite(dailyTotal) || dailyTotal < 0) {
        throw new Error("Provide a valid non-negative daily total")
    }

    await mongoose.connect(process.env.MONGO_TEST_URI)

    if (mongoose.connection.name !== "bank_transaction_test") {
        throw new Error("Safety check failed: wrong database")
    }

    const account = await Account.findOneAndUpdate(
        { accountNumber: "9000000000001" },
        {
            $set: {
                dailyOutgoingDate: "2026-10-15",
                dailyOutgoingTotal: dailyTotal
            }
        },
        { returnDocument: "after", runValidators: true }
    )

    if (!account) {
        throw new Error("Test sender account not found")
    }

    console.log({
        database: mongoose.connection.name,
        accountNumber: account.accountNumber,
        balance: account.balance,
        dailyOutgoingDate: account.dailyOutgoingDate,
        dailyOutgoingTotal: account.dailyOutgoingTotal
    })
}

main()
    .catch(error => {
        console.error("Update failed:", error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
