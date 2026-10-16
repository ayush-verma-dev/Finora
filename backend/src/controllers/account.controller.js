const generateAccountNumber = require("../utils/accountNumber")
const Account = require("../models/Account")
const Transaction = require("../models/Transaction");


const createAccount = async (req, res) => {
    try {

        // Logged-in user comes from authMiddleware
        const userId = req.user._id

        // Check if account already exists
        const existingAccount = await Account.findOne({
            user: userId
        })

        if(existingAccount){
            return res.status(409).json({
                success: false,
                message: "User already has a bank account"
            })
        }

        // Generate Account Number
        const accountNumber = generateAccountNumber()

        // Create account
        const account = await Account.create({
            accountNumber,
            user: userId
        })
        return res.status(201).json({
            success: true,
            message: "Bank Account created successfully",
            account: {
                id:account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                balance: account.balance,
                currency: account.currency,
                status: account.status
            }
        })
    } catch (error){
        console.error("Create account errors:", error)

        return res.status(500).json({
            success: false,
            message: "Server error while creating account"
        })
    }
}

const getAccount = async (req, res) => {
    try {
        const account = await Account.findOne({
            user: req.user._id
        })

        if(!account){
            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            })
        }

        return res.status(200).json({
            success: true,
            account: {
                id:account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                balance: account.balance,
                currency: account.currency,
                status: account.status,
                createdAt: account.createdAt
            }
        })
    } catch (error){
        console.error("Get account error:", error)

        return res.status(500).json({
            success: false,
            message: "Server error while fetching account"
        })
    }
}

const getAccountDetails = async (req, res) => {
    try {
        const account = await Account.findOne({
            user: req.user._id
        }).select(
            "accountNumber accountType balance currency status createdAt updatedAt"
        )

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            })
        }

        return res.status(200).json({
            success: true,
            account: {
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                balance: account.balance,
                currency: account.currency,
                status: account.status,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt
            }
        })

    } catch (error) {
        console.error("Get account details error:", error)

        return res.status(500).json({
            success: false,
            message: "Server error while fetching account details"
        })
    }
}

const getAccountSummary = async (req, res) => {
    try {
        let { from, to } = req.query

        let startDate
        let endDate

        // Validate "from" date
        if (from) {
            startDate = new Date(from)

            if (isNaN(startDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid from date"
                })
            }

            startDate.setHours(0, 0, 0, 0)
        }

        // Validate "to" date
        if (to) {
            endDate = new Date(to)

            if (isNaN(endDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid to date"
                })
            }

            endDate.setHours(23, 59, 59, 999)
        }

        // Check date range
        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "From date cannot be greater than to date"
            })
        }

        const account = await Account.findOne({
            user: req.user._id
        }).select("_id accountNumber balance currency status")

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            })
        }

        // Base filter
        const transactionFilter = {
            account: account._id,
            status: "completed"
        }

        // Add date filter if provided
        if (startDate || endDate) {
            transactionFilter.createdAt = {};

            if (startDate) {
                transactionFilter.createdAt.$gte = startDate;
            }

            if (endDate) {
                transactionFilter.createdAt.$lte = endDate;
            }
        }

        // Calculate credits
        const creditSummary = await Transaction.aggregate([
            {
                $match: {
                    ...transactionFilter,
                    type: "credit"
                }
            },
            {
                $group: {
                    _id: null,
                    totalCredits: {
                        $sum: "$amount"
                    }
                }
            }
        ])

        // Calculate debits
        const debitSummary = await Transaction.aggregate([
            {
                $match: {
                    ...transactionFilter,
                    type: "debit"
                }
            },
            {
                $group: {
                    _id: null,
                    totalDebits: {
                        $sum: "$amount"
                    }
                }
            }
        ])

        // Count transactions
        const totalTransactions = await Transaction.countDocuments(
            transactionFilter
        );

        const totalCredits =
            creditSummary.length > 0
                ? creditSummary[0].totalCredits
                : 0

        const totalDebits =
            debitSummary.length > 0
                ? debitSummary[0].totalDebits
                : 0

        return res.status(200).json({
            success: true,

            account: {
                accountNumber: account.accountNumber,
                balance: account.balance,
                currency: account.currency,
                status: account.status
            },

            summary: {
                totalCredits,
                totalDebits,
                totalTransactions
            },

            filters: {
                from: from || null,
                to: to || null
            }
        })

    } catch (error) {
        console.error("Account summary error:", error)

        return res.status(500).json({
            success: false,
            message: "Server error while fetching account summary"
        });
    }
}

const getAccountDashboard = async (req, res) => {
    try {
        const account = await Account.findOne({
            user: req.user._id
        }).select(
            "_id accountNumber accountType balance currency status"
        )

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            })
        }

        // Calculate total credits
        const creditSummary = await Transaction.aggregate([
            {
                $match: {
                    account: account._id,
                    type: "credit",
                    status: "completed"
                }
            },
            {
                $group: {
                    _id: null,
                    totalCredits: {
                        $sum: "$amount"
                    }
                }
            }
        ])

        // Calculate total debits
        const debitSummary = await Transaction.aggregate([
            {
                $match: {
                    account: account._id,
                    type: "debit",
                    status: "completed"
                }
            },
            {
                $group: {
                    _id: null,
                    totalDebits: {
                        $sum: "$amount"
                    }
                }
            }
        ])

        // Count completed transactions
        const totalTransactions = await Transaction.countDocuments({
            account: account._id,
            status: "completed"
        })

        // Get latest 5 transactions
        const recentTransactions = await Transaction.find({
            account: account._id,
            status: "completed"
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select(
                "transactionId type amount status description createdAt"
            )

        const totalCredits =
            creditSummary.length > 0
                ? creditSummary[0].totalCredits
                : 0

        const totalDebits =
            debitSummary.length > 0
                ? debitSummary[0].totalDebits
                : 0

        return res.status(200).json({
            success: true,

            account: {
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                balance: account.balance,
                currency: account.currency,
                status: account.status
            },

            summary: {
                totalCredits,
                totalDebits,
                totalTransactions
            },

            recentTransactions
        })

    } catch (error) {
        console.error("Account dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching account dashboard"
        })
    }
}

module.exports = {
    createAccount,
    getAccount,
    getAccountDetails,
    getAccountSummary,
    getAccountDashboard
}