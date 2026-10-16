
const mongoose = require("mongoose")
const dns = require("node:dns")

const User = require("../src/models/User")
const Account = require("../src/models/Account")
const Transaction = require("../src/models/Transaction")
const Ledger = require("../src/models/Ledger")

const {
    creditAccount,
    debitAccount,
    transferMoney
} = require("../src/services/transaction.service")

dns.setServers(["8.8.8.8", "8.8.4.4"])

// Atlas integration tests can take longer than Jest's default 5 seconds.
jest.setTimeout(20000)

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createdUserIds = []
const createdAccountIds = []

let sender
let receiver
let senderAccount
let receiverAccount

const makeUser = async (suffix) => {
    const user = await User.create({
        name: `Concurrency Test ${suffix}`,
        email: `concurrency-${runId}-${suffix}@example.com`,
        password: "ConcurrencyTestPassword123",
        phone: `${Date.now()}`.slice(-10)
    })

    createdUserIds.push(user._id)

    return user
}

const makeAccount = async (user, accountNumber, balance) => {
    const account = await Account.create({
        user: user._id,
        accountNumber,
        accountType: "savings",
        balance,
        currency: "INR",
        status: "active"
    })

    createdAccountIds.push(account._id)

    return account
}

const freshKey = (label) => `${runId}-${label}`

describe("Transaction concurrency integration tests", () => {
    beforeAll(async () => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Tests must run with NODE_ENV=test")
        }

        const uri = process.env.MONGO_TEST_URI

        if (!uri) {
            throw new Error("MONGO_TEST_URI is required")
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is required")
        }

        // Verify the target database before connecting.
        const databaseName = new URL(uri).pathname
            .replace(/^\/+/, "")
            .split("?")[0]

        if (databaseName !== "bank_transaction_test") {
            throw new Error(
                "Refusing to run concurrency tests against a non-test database"
            )
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 15000
            })
        }

        if (mongoose.connection.name !== "bank_transaction_test") {
            throw new Error("Connected to an unexpected database")
        }

        sender = await makeUser("sender")
        receiver = await makeUser("receiver")

        const accountSuffix = `${Date.now()}`.slice(-9)

        senderAccount = await makeAccount(
            sender,
            `7${accountSuffix}1`,
            1000
        )

        receiverAccount = await makeAccount(
            receiver,
            `7${accountSuffix}2`,
            0
        )
    }, 30000)

    afterAll(async () => {
        try {
            // Clean up only the records created by this test file.
            if (
                mongoose.connection.readyState !== 0 &&
                mongoose.connection.name === "bank_transaction_test"
            ) {
                const accountIds = createdAccountIds

                const transactions = await Transaction.find({
                    $or: [
                        { account: { $in: accountIds } },
                        { relatedAccount: { $in: accountIds } }
                    ]
                }).select("_id")

                const transactionIds = transactions.map(
                    item => item._id
                )

                await Ledger.deleteMany({
                    $or: [
                        { account: { $in: accountIds } },
                        { transaction: { $in: transactionIds } }
                    ]
                })

                await Transaction.deleteMany({
                    $or: [
                        { account: { $in: accountIds } },
                        { relatedAccount: { $in: accountIds } }
                    ]
                })

                await Account.deleteMany({
                    _id: { $in: accountIds }
                })

                await User.deleteMany({
                    _id: { $in: createdUserIds }
                })
            }
        } finally {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.disconnect()
            }
        }
    }, 30000)

    beforeEach(async () => {
        // Reset only the accounts created for these tests.
        await Account.updateOne(
            { _id: senderAccount._id },
            {
                $set: {
                    balance: 1000,
                    dailyOutgoingTotal: 0,
                    dailyOutgoingDate: ""
                }
            }
        )

        await Account.updateOne(
            { _id: receiverAccount._id },
            {
                $set: {
                    balance: 0,
                    dailyOutgoingTotal: 0,
                    dailyOutgoingDate: ""
                }
            }
        )

        const accountIds = [
            senderAccount._id,
            receiverAccount._id
        ]

        const oldTransactions = await Transaction.find({
            $or: [
                { account: { $in: accountIds } },
                { relatedAccount: { $in: accountIds } }
            ]
        }).select("_id")

        await Ledger.deleteMany({
            $or: [
                { account: { $in: accountIds } },
                {
                    transaction: {
                        $in: oldTransactions.map(item => item._id)
                    }
                }
            ]
        })

        await Transaction.deleteMany({
            $or: [
                { account: { $in: accountIds } },
                { relatedAccount: { $in: accountIds } }
            ]
        })
    })

    test("concurrent debits cannot overspend the account", async () => {
        const results = await Promise.allSettled([
            debitAccount({
                userId: sender._id,
                amount: 700,
                idempotencyKey: freshKey("debit-a"),
                description: "Concurrent debit A"
            }),
            debitAccount({
                userId: sender._id,
                amount: 700,
                idempotencyKey: freshKey("debit-b"),
                description: "Concurrent debit B"
            })
        ])

        const successes = results.filter(
            result => result.status === "fulfilled"
        )

        const failures = results.filter(
            result => result.status === "rejected"
        )

        expect(successes).toHaveLength(1)
        expect(failures).toHaveLength(1)

        const account = await Account.findById(senderAccount._id)

        expect(account.balance).toBe(300)
        expect(account.balance).toBeGreaterThanOrEqual(0)

        const transactions = await Transaction.find({
            account: senderAccount._id,
            type: "debit"
        })

        expect(transactions).toHaveLength(1)
        expect(transactions[0].status).toBe("completed")

        const ledgers = await Ledger.find({
            account: senderAccount._id,
            entryType: "debit"
        })

        expect(ledgers).toHaveLength(1)
    })

    test("concurrent transfers cannot overspend the sender", async () => {
        const results = await Promise.allSettled([
            transferMoney({
                userId: sender._id,
                receiverAccountNumber: receiverAccount.accountNumber,
                amount: 700,
                idempotencyKey: freshKey("transfer-a"),
                description: "Concurrent transfer A"
            }),
            transferMoney({
                userId: sender._id,
                receiverAccountNumber: receiverAccount.accountNumber,
                amount: 700,
                idempotencyKey: freshKey("transfer-b"),
                description: "Concurrent transfer B"
            })
        ])

        const successes = results.filter(
            result => result.status === "fulfilled"
        )

        expect(successes).toHaveLength(1)

        const currentSender = await Account.findById(senderAccount._id)
        const currentReceiver = await Account.findById(receiverAccount._id)

        expect(currentSender.balance).toBe(300)
        expect(currentReceiver.balance).toBe(700)
        expect(currentSender.balance).toBeGreaterThanOrEqual(0)

        const transactions = await Transaction.find({
            account: {
                $in: [senderAccount._id, receiverAccount._id]
            }
        })

        expect(transactions).toHaveLength(2)
        expect(
            transactions.every(
                transaction => transaction.status === "completed"
            )
        ).toBe(true)

        const ledgers = await Ledger.find({
            account: {
                $in: [senderAccount._id, receiverAccount._id]
            }
        })

        expect(ledgers).toHaveLength(2)
    })

    test("repeated concurrent credit requests do not credit twice", async () => {
        const key = freshKey("duplicate-credit")

        const results = await Promise.allSettled([
            creditAccount({
                userId: receiver._id,
                amount: 250,
                idempotencyKey: key,
                description: "Duplicate credit test"
            }),
            creditAccount({
                userId: receiver._id,
                amount: 250,
                idempotencyKey: key,
                description: "Duplicate credit test"
            })
        ])

        const successes = results.filter(
            result => result.status === "fulfilled"
        )

        expect(successes).toHaveLength(2)

        const account = await Account.findById(receiverAccount._id)

        expect(account.balance).toBe(250)

        const transactions = await Transaction.find({
            idempotencyKey: key
        })

        expect(transactions).toHaveLength(1)

        const ledgerEntries = await Ledger.find({
            transaction: transactions[0]._id
        })

        expect(ledgerEntries).toHaveLength(1)
    })

    test("a failed transfer leaves both balances and ledgers unchanged", async () => {
        const results = await Promise.allSettled([
            transferMoney({
                userId: sender._id,
                receiverAccountNumber: receiverAccount.accountNumber,
                amount: 1500,
                idempotencyKey: freshKey("failed-transfer"),
                description: "Transfer exceeding available balance"
            })
        ])

        expect(results[0].status).toBe("rejected")

        const currentSender = await Account.findById(senderAccount._id)
        const currentReceiver = await Account.findById(receiverAccount._id)

        expect(currentSender.balance).toBe(1000)
        expect(currentReceiver.balance).toBe(0)

        const transactions = await Transaction.find({
            $or: [
                { account: senderAccount._id },
                { account: receiverAccount._id }
            ]
        })

        expect(transactions).toHaveLength(0)

        const ledgers = await Ledger.find({
            account: {
                $in: [senderAccount._id, receiverAccount._id]
            }
        })

        expect(ledgers).toHaveLength(0)
    })
})
