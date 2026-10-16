const express = require("express")

const {
    createAccount,
    getAccount,
    getAccountDetails,
    getAccountSummary,
    getAccountDashboard
} = require("../controllers/account.controller")

const authMiddleware = require("../middleware/auth.middleware")

const router = express.Router()

// Create bank account
router.post("/", authMiddleware, createAccount)

// Get bank account
router.get("/", authMiddleware, getAccount)

// Account details
router.get("/details", authMiddleware, getAccountDetails)

// Account summary
router.get("/summary", authMiddleware, getAccountSummary)

// Account dashboard
router.get("/dashboard", authMiddleware, getAccountDashboard)

module.exports = router
