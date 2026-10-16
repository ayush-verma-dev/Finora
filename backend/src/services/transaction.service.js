
const mongoose = require("mongoose")

const Account = require("../models/Account")
const Transaction = require("../models/Transaction")
const Ledger = require("../models/Ledger")
const generateTransactionId = require("../utils/transactionId")

const DAILY_OUTGOING_LIMIT = 200000

const getStartOfTodayIST = () => {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000
    const now = new Date()
    const istNow = new Date(now.getTime() + IST_OFFSET)

    return new Date(
        Date.UTC(
            istNow.getUTCFullYear(),
            istNow.getUTCMonth(),
            istNow.getUTCDate()
        ) - IST_OFFSET
    )
}

const getISTDateString = () => {
    const istNow = new Date(
        Date.now() + 5.5 * 60 * 60 * 1000
    )

    return [
        istNow.getUTCFullYear(),
        String(istNow.getUTCMonth() + 1).padStart(2, "0"),
        String(istNow.getUTCDate()).padStart(2, "0")
    ].join("-")
}

const validateTransactionInput = ({
    amount,
    idempotencyKey
}) => {
    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        Math.round(amount * 100) !== amount * 100
    ) {
        throw new Error("Invalid transaction amount")
    }

    if (
        typeof idempotencyKey !== "string" ||
        !idempotencyKey.trim()
    ) {
        throw new Error("Invalid idempotency key")
    }
}

const getDailyOutgoingTotal = async (accountId, session) => {
    const transactions = await Transaction.find({
        account: accountId,
        type: "debit",
        status: "completed",
        createdAt: {
            $gte: getStartOfTodayIST()
        }
    })
        .select("amount")
        .session(session)

    return transactions.reduce(
        (total, transaction) => total + transaction.amount,
        0
    )
}

const reserveDailyOutgoingAmount = async (
    account,
    amount,
    session
) => {
    const today = getISTDateString()

    if (account.dailyOutgoingDate !== today) {
        account.dailyOutgoingTotal = await getDailyOutgoingTotal(
            account._id,
            session
        )

        account.dailyOutgoingDate = today
    }

    const newDailyTotal = account.dailyOutgoingTotal + amount

    if (newDailyTotal > DAILY_OUTGOING_LIMIT) {
        throw new Error(
            `Daily outgoing transaction limit of ₹${DAILY_OUTGOING_LIMIT.toLocaleString("en-IN")} exceeded`
        )
    }

    account.dailyOutgoingTotal = newDailyTotal
    await account.save({ session })
}

const findExistingTransaction = async (idempotencyKey) => {
    return Transaction.findOne({ idempotencyKey })
}

const verifyExistingTransaction = (
    transaction,
    {
        accountId,
        type,
        amount,
        relatedAccountId = null
    }
) => {
    const sameAccount =
        transaction.account.toString() === accountId.toString()

    const sameRelatedAccount =
        relatedAccountId === null
            ? !transaction.relatedAccount
            : transaction.relatedAccount?.toString() ===
              relatedAccountId.toString()

    const sameRequest =
        sameAccount &&
        transaction.type === type &&
        transaction.amount === amount &&
        sameRelatedAccount

    if (!sameRequest) {
        throw new Error(
            "Idempotency key has already been used with a different transaction request"
        )
    }

    if (transaction.status !== "completed") {
        throw new Error(
            "A transaction with this idempotency key is not completed"
        )
    }

    return transaction
}

const recoverExistingTransaction = async (
    idempotencyKey,
    expected
) => {
    const transaction = await findExistingTransaction(
        idempotencyKey
    )

    if (!transaction) {
        return null
    }

    return verifyExistingTransaction(transaction, expected)
}

const creditAccount = async ({
    userId,
    amount,
    idempotencyKey,
    description
}) => {
    validateTransactionInput({ amount, idempotencyKey })

    const session = await mongoose.startSession()

    try {
        const result = await session.withTransaction(async () => {
            const account = await Account.findOne({
                user: userId
            }).session(session)

            if (!account) {
                throw new Error("Bank account not found")
            }

            if (account.status !== "active") {
                throw new Error("Bank account is not active")
            }

            const existingTransaction = await Transaction.findOne({
                idempotencyKey
            }).session(session)

            if (existingTransaction) {
                verifyExistingTransaction(existingTransaction, {
                    accountId: account._id,
                    type: "credit",
                    amount
                })

                return {
                    alreadyProcessed: true,
                    transaction: existingTransaction
                }
            }

            const balanceBefore = account.balance
            const balanceAfter = balanceBefore + amount

            const transaction = new Transaction({
                transactionId: generateTransactionId(),
                account: account._id,
                type: "credit",
                amount,
                status: "pending",
                idempotencyKey,
                description
            })

            await transaction.save({ session })

            account.balance = balanceAfter
            await account.save({ session })

            const ledger = new Ledger({
                transaction: transaction._id,
                account: account._id,
                entryType: "credit",
                amount,
                balanceBefore,
                balanceAfter,
                description
            })

            await ledger.save({ session })

            transaction.status = "completed"
            await transaction.save({ session })

            return {
                alreadyProcessed: false,
                transaction,
                ledger,
                account
            }
        })

        return result
    } catch (error) {
        
        if (error.code === 11000) {
            const account = await Account.findOne({
                user: userId
            }).select("_id")

            if (account) {
                const transaction = await recoverExistingTransaction(
                    idempotencyKey,
                    {
                        accountId: account._id,
                        type: "credit",
                        amount
                    }
                )

                if (transaction) {
                    return {
                        alreadyProcessed: true,
                        transaction
                    }
                }
            }
        }

        throw error
    } finally {
        await session.endSession()
    }
}

const debitAccount = async ({
    userId,
    amount,
    idempotencyKey,
    description
}) => {
    validateTransactionInput({ amount, idempotencyKey })

    const session = await mongoose.startSession()

    try {
        const result = await session.withTransaction(async () => {
            const account = await Account.findOne({
                user: userId
            }).session(session)

            if (!account) {
                throw new Error("Bank account not found")
            }

            if (account.status !== "active") {
                throw new Error("Bank account is not active")
            }

            const existingTransaction = await Transaction.findOne({
                idempotencyKey
            }).session(session)

            if (existingTransaction) {
                verifyExistingTransaction(existingTransaction, {
                    accountId: account._id,
                    type: "debit",
                    amount
                })

                return {
                    alreadyProcessed: true,
                    transaction: existingTransaction
                }
            }

            await reserveDailyOutgoingAmount(
                account,
                amount,
                session
            )

            if (account.balance < amount) {
                throw new Error("Insufficient balance")
            }

            const balanceBefore = account.balance
            const balanceAfter = balanceBefore - amount

            const transaction = new Transaction({
                transactionId: generateTransactionId(),
                account: account._id,
                type: "debit",
                amount,
                status: "pending",
                idempotencyKey,
                description
            })

            await transaction.save({ session })

            account.balance = balanceAfter
            await account.save({ session })

            const ledger = new Ledger({
                transaction: transaction._id,
                account: account._id,
                entryType: "debit",
                amount,
                balanceBefore,
                balanceAfter,
                description
            })

            await ledger.save({ session })

            transaction.status = "completed"
            await transaction.save({ session })

            return {
                alreadyProcessed: false,
                transaction,
                ledger,
                account
            }
        })

        return result
    } catch (error) {
        if (error.code === 11000) {
            const account = await Account.findOne({
                user: userId
            }).select("_id")

            if (account) {
                const transaction = await recoverExistingTransaction(
                    idempotencyKey,
                    {
                        accountId: account._id,
                        type: "debit",
                        amount
                    }
                )

                if (transaction) {
                    return {
                        alreadyProcessed: true,
                        transaction
                    }
                }
            }
        }

        throw error
    } finally {
        await session.endSession()
    }
}

const transferMoney = async ({
    userId,
    receiverAccountNumber,
    amount,
    idempotencyKey,
    description
}) => {
    validateTransactionInput({ amount, idempotencyKey })

    if (
        typeof receiverAccountNumber !== "string" ||
        !receiverAccountNumber.trim()
    ) {
        throw new Error("Invalid receiver account number")
    }

    const debitIdempotencyKey = `${idempotencyKey}-debit`
    const creditIdempotencyKey = `${idempotencyKey}-credit`

    const session = await mongoose.startSession()

    try {
        const result = await session.withTransaction(async () => {
            const senderAccount = await Account.findOne({
                user: userId
            }).session(session)

            if (!senderAccount) {
                throw new Error("Sender bank account not found")
            }

            if (senderAccount.status !== "active") {
                throw new Error("Sender bank account is not active")
            }

            const receiverAccount = await Account.findOne({
                accountNumber: receiverAccountNumber.trim()
            }).session(session)

            if (!receiverAccount) {
                throw new Error("Receiver bank account not found")
            }

            if (
                senderAccount._id.toString() ===
                receiverAccount._id.toString()
            ) {
                throw new Error(
                    "Cannot transfer money to the same account"
                )
            }

            if (receiverAccount.status !== "active") {
                throw new Error("Receiver bank account is not active")
            }

            const existingDebit = await Transaction.findOne({
                idempotencyKey: debitIdempotencyKey
            }).session(session)

            const existingCredit = await Transaction.findOne({
                idempotencyKey: creditIdempotencyKey
            }).session(session)

            if (existingDebit || existingCredit) {
                if (!existingDebit || !existingCredit) {
                    throw new Error(
                        "Idempotency key has already been used with a different transaction request"
                    )
                }

                verifyExistingTransaction(existingDebit, {
                    accountId: senderAccount._id,
                    type: "debit",
                    amount,
                    relatedAccountId: receiverAccount._id
                })

                verifyExistingTransaction(existingCredit, {
                    accountId: receiverAccount._id,
                    type: "credit",
                    amount,
                    relatedAccountId: senderAccount._id
                })

                return {
                    alreadyProcessed: true,
                    transaction: existingDebit,
                    debitTransaction: existingDebit,
                    creditTransaction: existingCredit
                }
            }

            await reserveDailyOutgoingAmount(
                senderAccount,
                amount,
                session
            )

            if (senderAccount.balance < amount) {
                throw new Error("Insufficient balance")
            }

            const senderBalanceBefore = senderAccount.balance
            const receiverBalanceBefore = receiverAccount.balance
            const senderBalanceAfter = senderBalanceBefore - amount
            const receiverBalanceAfter = receiverBalanceBefore + amount

            const debitTransaction = new Transaction({
                transactionId: generateTransactionId(),
                account: senderAccount._id,
                relatedAccount: receiverAccount._id,
                type: "debit",
                amount,
                status: "pending",
                idempotencyKey: debitIdempotencyKey,
                description
            })

            const creditTransaction = new Transaction({
                transactionId: generateTransactionId(),
                account: receiverAccount._id,
                relatedAccount: senderAccount._id,
                type: "credit",
                amount,
                status: "pending",
                idempotencyKey: creditIdempotencyKey,
                description
            })

            await debitTransaction.save({ session })
            await creditTransaction.save({ session })

            senderAccount.balance = senderBalanceAfter
            receiverAccount.balance = receiverBalanceAfter

            await senderAccount.save({ session })
            await receiverAccount.save({ session })

            const senderLedger = new Ledger({
                transaction: debitTransaction._id,
                account: senderAccount._id,
                entryType: "debit",
                amount,
                balanceBefore: senderBalanceBefore,
                balanceAfter: senderBalanceAfter,
                description
            })

            const receiverLedger = new Ledger({
                transaction: creditTransaction._id,
                account: receiverAccount._id,
                entryType: "credit",
                amount,
                balanceBefore: receiverBalanceBefore,
                balanceAfter: receiverBalanceAfter,
                description
            })

            await senderLedger.save({ session })
            await receiverLedger.save({ session })

            debitTransaction.status = "completed"
            creditTransaction.status = "completed"

            await debitTransaction.save({ session })
            await creditTransaction.save({ session })

            return {
                alreadyProcessed: false,
                transaction: debitTransaction,
                debitTransaction,
                creditTransaction,
                senderAccount,
                receiverAccount,
                senderLedger,
                receiverLedger
            }
        })

        return result
    } catch (error) {
        if (error.code === 11000) {
            const senderAccount = await Account.findOne({
                user: userId
            }).select("_id")

            const receiverAccount = await Account.findOne({
                accountNumber: receiverAccountNumber.trim()
            }).select("_id")

            if (senderAccount && receiverAccount) {
                const existingDebit = await Transaction.findOne({
                    idempotencyKey: debitIdempotencyKey
                })

                const existingCredit = await Transaction.findOne({
                    idempotencyKey: creditIdempotencyKey
                })

                if (existingDebit || existingCredit) {
                    if (!existingDebit || !existingCredit) {
                        throw new Error(
                            "Idempotency key has already been used with a different transaction request"
                        )
                    }

                    verifyExistingTransaction(existingDebit, {
                        accountId: senderAccount._id,
                        type: "debit",
                        amount,
                        relatedAccountId: receiverAccount._id
                    })

                    verifyExistingTransaction(existingCredit, {
                        accountId: receiverAccount._id,
                        type: "credit",
                        amount,
                        relatedAccountId: senderAccount._id
                    })

                    return {
                        alreadyProcessed: true,
                        transaction: existingDebit,
                        debitTransaction: existingDebit,
                        creditTransaction: existingCredit
                    }
                }
            }
        }

        throw error
    } finally {
        await session.endSession()
    }
}

module.exports = {
    creditAccount,
    debitAccount,
    transferMoney
}
