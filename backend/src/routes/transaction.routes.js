const express = require("express")

const {
    creditTransaction,
    debitTransaction,
    getTransactionHistory,
    getAccountStatement,
    transferTransaction,
    getTransactionById
} = require("../controllers/transaction.controller")

const authMiddleware = require("../middleware/auth.middleware")

const router = express.Router()

// Credit money
router.post("/credit", authMiddleware, creditTransaction)

// Debit money
router.post("/debit", authMiddleware, debitTransaction)

// Transaction History
router.get("/", authMiddleware, getTransactionHistory)

// Account statement
router.get("/statement", authMiddleware, getAccountStatement)

// Transfer 
router.post("/transfer", authMiddleware, transferTransaction)

// Transaction Id
router.get("/:transactionId", authMiddleware, getTransactionById)


module.exports = router