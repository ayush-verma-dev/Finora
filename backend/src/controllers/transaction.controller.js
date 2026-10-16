const Account = require("../models/Account")
const Transaction = require("../models/Transaction")
const Ledger = require("../models/Ledger")

const validateAmount = require("../utils/validateAmount")
const validateIdempotencyKey = require("../utils/validateIdempotencyKey");
const { 
    creditAccount ,
    debitAccount,
    transferMoney
} = require("../services/transaction.service")
const validateDescription = require("../utils/validateDescription")


const creditTransaction = async (req, res) => {

    try{

        const {
            amount,
            idempotencyKey,
            description
        } = req.body

        // 1. Validate amount
        const amountValidation = validateAmount(amount)

        if (!amountValidation.valid) {
            return res.status(400).json({
                success: false,
                message: amountValidation.message
            });
        }

        const numericAmount = amountValidation.amount

        // 2. Validate idempotency key
        const idempotencyValidation = validateIdempotencyKey(idempotencyKey)

        if (!idempotencyValidation.valid) {
            return res.status(400).json({
                success: false,
                message: idempotencyValidation.message
            })
        }

        const validatedIdempotencyKey = idempotencyValidation.key

        const descriptionValidation = validateDescription(description)

        if (!descriptionValidation.valid) {
            return res.status(400).json({
                success: false,
                message: descriptionValidation.message
            })
        }

        // 3. Call service
        const result = await creditAccount({
            userId: req.user._id,
            amount: numericAmount,
            idempotencyKey: validatedIdempotencyKey,
            description: descriptionValidation.description
        })

        // 4. Already processed transaction
        if(result.alreadyProcessed){
            return res.status(200).json({
                success: true,
                message: "Transaction already processed",
                transaction: {
                    id: result.transaction._id,
                    transactionId: result.transaction.transactionId,
                    type: result.transaction.type,
                    amount: result.transaction.amount,
                    status: result.transaction.status,
                    createdAt: result.transaction.createdAt
                }
            })
        }

        // 5. New transaction
        return res.status(201).json({
            success: true,
            message: "Amount credited successfully",
            transaction: {
                id: result.transaction._id,
                transactionId: result.transaction.transactionId,
                type: result.transaction.type,
                amount: result.transaction.amount,
                status: result.transaction.status,
                createdAt: result.transaction.createdAt
            },
            account: {
                accountNumber: result.account.accountNumber,
                balance: result.account.balance,
                currency: result.account.currency
            }
        })
    } catch (error) {
        console.error("Credit transaction error:", error.message)

        const clientErrors = [
            "Bank account not found",
            "Bank account is not active",
            "Idempotency key has already been used with a different transaction request"
        ]

        const isClientError = clientErrors.includes(error.message)

        return res.status(isClientError ? 400 : 500).json({
            success: false,
            message: isClientError
                ? error.message
                : "Server error while processing credit"
        })
    }
}

const debitTransaction = async (req, res) => {
    try {
        const {
            amount,
            idempotencyKey,
            description
        } = req.body

        // Validate amount
        const amountValidation = validateAmount(amount);

        if (!amountValidation.valid) {
            return res.status(400).json({
                success: false,
                message: amountValidation.message
            });
        }

        const numericAmount = amountValidation.amount;

        // Validate idempotency key
        const idempotencyValidation = validateIdempotencyKey(idempotencyKey)

        if (!idempotencyValidation.valid) {
            return res.status(400).json({
                success: false,
                message: idempotencyValidation.message
            })
        }

        const validatedIdempotencyKey = idempotencyValidation.key

        const descriptionValidation = validateDescription(description)

        if (!descriptionValidation.valid) {
            return res.status(400).json({
                success: false,
                message: descriptionValidation.message
            })
        }

        const result = await debitAccount({
            userId: req.user._id,
            amount: numericAmount,
            idempotencyKey: validatedIdempotencyKey,
            description: descriptionValidation.description
        })

        // Duplicate transaction
        if(result.alreadyProcessed){
            return res.status(200).json({
                success: true,
                message: "Transaction already processed",
                transaction: {
                    id: result.transaction._id,
                    transactionId: result.transaction.transactionId,
                    type: result.transaction.type,
                    amount: result.transaction.amount,
                    status: result.transaction.status,
                    createdAt: result.transaction.createdAt
                }
            })
        }

        return res.status(201).json({
            success: true,
            message: "Amount debited successfully",
            transaction: {
                id: result.transaction._id,
                transactionId: result.transaction.transactionId,
                type: result.transaction.type,
                amount: result.transaction.amount,
                status: result.transaction.status,
                createdAt: result.transaction.createdAt
            },
            account: {
                accountNumber: result.account.accountNumber,
                balance: result.account.balance,
                currency: result.account.currency
            }
        })

    } catch (error) {
        console.error("Debit transaction error:", error.message)

        const clientErrors = [
            "Bank account not found",
            "Bank account is not active",
            "Insufficient balance",
            "Daily outgoing transaction limit of ₹2,00,000 exceeded",
            "Idempotency key has already been used with a different transaction request"
        ]

        const isClientError = clientErrors.includes(error.message)

        return res.status(isClientError ? 400 : 500).json({
            success: false,
            message: isClientError
                ? error.message
                : "Server error while processing debit"
        })
    }
}

const getTransactionHistory = async(req, res) => {

    try {
        // 1. Get query parameters
        let {
            page = 1,
            limit = 10,
            type,
            from,
            to
        } = req.query

        page = Number(page)
        limit = Number(limit)

        // Validate page
        if (!Number.isSafeInteger(page) || page < 1) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive integer"
            })
        }

        // Validate limit
        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: "Limit must be an integer between 1 and 100"
            })
        }

        // 4. Validation transaction type
        if(type && !["credit", "debit"].includes(type)){
            return res.status(400).json({
                success: false,
                message: "Type must be either credit or debit"
            })
        }

        // Validate date range
        let startDate
        let endDate

        const parseISTDate = (value, isEndDate = false) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return null
            }

            const [year, month, day] = value.split("-").map(Number)

            const date = new Date(Date.UTC(year, month - 1, day))

            if (
                date.getUTCFullYear() !== year ||
                date.getUTCMonth() !== month - 1 ||
                date.getUTCDate() !== day
            ) {
                return null
            }

            const IST_OFFSET_MS = 330 * 60 * 1000

            if (isEndDate) {
                date.setUTCDate(date.getUTCDate() + 1)
                return new Date(date.getTime() - IST_OFFSET_MS - 1)
            }

            return new Date(date.getTime() - IST_OFFSET_MS)
        }

        if (from) {
            startDate = parseISTDate(from)

            if (!startDate) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid from date. Use YYYY-MM-DD format"
                })
            }
        }

        if (to) {
            endDate = parseISTDate(to, true)

            if (!endDate) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid to date. Use YYYY-MM-DD format"
                })
            }
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "From date cannot be greater than to date"
            })
        }

        // 5. Find user's account
        const account = await Account.findOne({
            user: req.user._id
        }).select("_id")

        if(!account){
            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            })
        }

        // 6. Build transaction filter
        const filter = {
            account: account._id
        }

        if(type){
            filter.type = type
        }

        if(startDate || endDate){
            filter.createdAt = {}

            if(startDate){
                filter.createdAt.$gte = startDate
            }

            if(endDate){
                filter.createdAt.$lte = endDate
            }
        }

        // 7. Count total transactions
        const totalTransactions = await Transaction.countDocuments(filter)

        // 8. Calculate pagination
        const skip = (page - 1) * limit

        // 9. Fetch transactions
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1})
            .skip(skip)
            .limit(limit)
            .select("transactionId type amount status description createdAt")

        // 10. Calculate total pages
        const totalPages = Math.ceil(
            totalTransactions / limit
        )

        // 11. Send response
        return res.status(200).json({
            success: true,
            pagination: {
                page,
                limit,
                totalTransactions,
                totalPages
            },
            transactions
        })

    } catch (error){
        console.error("Transaction history error:", error)

        return res.status(500).json({
            success: false,
            message: "Server error while fetching transaction history"
        })
    }
}

const getAccountStatement = async(req, res) => {
    try {
        // 1. Find user's account
        const account = await Account.findOne({
            user: req.user._id
        }).select("_id accountNumber balance currency")

        if(!account){
            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            })
        }

        // 2/ Get ledger entry
        const ledgerEntries = await Ledger.find({
            account: account._id
        })
            .sort({ createdAt: -1})
            .populate("transaction", "transactionId type status")
            .select("transaction account entryType amount balanceBefore balanceAfter description createdAt")

        // 3. Return statement
        return res.status(200).json({
            success: true,
            account: {
                accountNumber: account.accountNumber,
                balance: account.balance,
                currency: account.currency
            },

            count: ledgerEntries.length,
            statement: ledgerEntries
        })

    } catch (error){
        console.error("Account statement error:", error)

        return res.status(500).json({
            success: false,
            message: "Server error while fetching account statement"
        })
    }
}

const transferTransaction = async(req, res) => {
    try{
        const {
            receiverAccountNumber,
            amount,
            idempotencyKey,
            description
        } = req.body

        // 1. Validate receiver account number
        if(!receiverAccountNumber){
            return res.status(400).json({
                success: false,
                message: "Receiver account number is required"
            })
        }

        // 2. Validate amount
        const amountValidation = validateAmount(amount);

        if (!amountValidation.valid) {
            return res.status(400).json({
                success: false,
                message: amountValidation.message
            });
        }

        const numericAmount = amountValidation.amount;

        // 3. Validate idempotency Key
        const idempotencyValidation = validateIdempotencyKey(idempotencyKey)

        if (!idempotencyValidation.valid) {
            return res.status(400).json({
                success: false,
                message: idempotencyValidation.message
            })
        }

        const validatedIdempotencyKey = idempotencyValidation.key

        const descriptionValidation = validateDescription(description)

        if (!descriptionValidation.valid) {
            return res.status(400).json({
                success: false,
                message: descriptionValidation.message
            })
        }

        // 4. Call transfer service
        const result = await transferMoney ({
            userId: req.user._id,
            receiverAccountNumber,
            amount: numericAmount,
            idempotencyKey: validatedIdempotencyKey,
            description: descriptionValidation.description
        })

        // 5. Already processed
        if(result.alreadyProcessed){
            return res.status(200).json({
                success: true,
                message: "Transfer already processed",
                transaction: {
                    id: result.transaction._id,
                    transactionId: result.transaction.transactionId,
                    amount: result.transaction.amount,
                    status: result.transaction.status,
                    createdAt: result.transaction.createdAt
                }
            })
        }

        // 6. Successful transfer
        return res.status(201).json({
            success:true,
            message: "Money transferred successfully",
            transfer: {
                amount: numericAmount,
                status: "completed"
            },
            debit: {
                transactionId: result.debitTransaction.transactionId,
                amount: result.debitTransaction.amount,
                status: result.debitTransaction.status,
                createdAt: result.debitTransaction.createdAt
            },
            credit: {
                transactionId: result.creditTransaction.transactionId,
                amount: result.creditTransaction.amount,
                status: result.creditTransaction.status,
                createdAt: result.creditTransaction.createdAt
            },
            senderAccount: {
                accountNumber: result.senderAccount.accountNumber,
                balance: result.senderAccount.balance,
                currency: result.senderAccount.currency
            },
            receiverAccount: {
                accountNumber: result.receiverAccount.accountNumber,
                balance: result.receiverAccount.balance,
                currency: result.receiverAccount.currency
            }
        })

    } catch (error) {
        console.error("Transfer transaction error:", error.message)

        const clientErrors = [
            "Sender bank account not found",
            "Sender bank account is not active",
            "Receiver bank account not found",
            "Receiver bank account is not active",
            "Cannot transfer money to the same account",
            "Insufficient balance",
            "Idempotency key has already been used with a different transaction request",
            `Daily outgoing transaction limit of ${"₹2,00,000"} exceeded`
        ]

        const isClientError = clientErrors.includes(error.message)

        return res.status(isClientError ? 400 : 500).json({
            success: false,
            message: isClientError
                ? error.message
                : "Server error while processing transfer"
        })
    }
}

const getTransactionById = async(req, res) => {
    try {
        const { transactionId } = req.params

        // 1. Validate transaction ID
        if (!transactionId || !transactionId.trim()) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID is required"
            })
        }

        // 2. Verify authenticated user
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            })
        }

        // 3. Find the account belonging to the authenticated user
        const account = await Account.findOne({
            user: req.user._id
        }).select("_id accountNumber balance currency")

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            })
        }

        // 4. Find the transaction belonging to this account
        const transaction = await Transaction.findOne({
            transactionId: transactionId.trim(),
            account: account._id
        }).select(
            "transactionId type amount status description createdAt"
        )

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            })
        }

        // 5. Find the ledger entry belonging to the same account
        const ledger = await Ledger.findOne({
            transaction: transaction._id,
            account: account._id
        }).select(
            "entryType amount balanceBefore balanceAfter description createdAt"
        )

        // 6. Return transaction details
        return res.status(200).json({
            success: true,
            transaction: {
                transactionId: transaction.transactionId,
                type: transaction.type,
                amount: transaction.amount,
                status: transaction.status,
                description: transaction.description,
                createdAt: transaction.createdAt
            },
            ledger: ledger || null
        })

    } catch (error) {
        console.error("Get transaction details error:", error)

        return res.status(500).json({
            success: false,
            message: "Server error while fetching transaction details"
        })
    }
}


module.exports = {
    creditTransaction,
    debitTransaction,
    getTransactionHistory,
    getAccountStatement,
    transferTransaction,
    getTransactionById
}