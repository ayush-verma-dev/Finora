
const dns = require("node:dns")
const mongoose = require("mongoose")
require("dotenv").config()

dns.setServers(["10.69.92.49"])

const Account = require("../src/models/Account")
const Transaction = require("../src/models/Transaction")

async function main() {
    await mongoose.connect(process.env.MONGO_TEST_URI)

    if (mongoose.connection.name !== "bank_transaction_test") {
        throw new Error("Safety check failed: wrong database")
    }

    const account = await Account.findOne({
        accountNumber: "9000000000001"
    })

    if (!account) {
        throw new Error("Test sender account not found")
    }

    const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000)

    const today = [
        istNow.getUTCFullYear(),
        String(istNow.getUTCMonth() + 1).padStart(2, "0"),
        String(istNow.getUTCDate()).padStart(2, "0")
    ].join("-")

    const startOfTodayIST = new Date(
        Date.UTC(
            istNow.getUTCFullYear(),
            istNow.getUTCMonth(),
            istNow.getUTCDate()
        ) - 5.5 * 60 * 60 * 1000
    )

    const transactions = await Transaction.find({
        account: account._id,
        type: "debit",
        status: "completed",
        createdAt: { $gte: startOfTodayIST }
    }).select("amount createdAt transactionId")

    const total = transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
    )

    console.log({
        database: mongoose.connection.name,
        accountNumber: account.accountNumber,
        balance: account.balance,
        storedDailyOutgoingDate: account.dailyOutgoingDate,
        storedDailyOutgoingTotal: account.dailyOutgoingTotal,
        todayIST: today,
        completedDebitTotalToday: total,
        completedDebitCountToday: transactions.length
    })
}

main()
    .catch(error => {
        console.error("Check failed:", error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
