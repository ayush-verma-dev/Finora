const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: true
        },

        relatedAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null
        },

        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01
        },

        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending"
        },

        idempotencyKey: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: 200
        }
    },
    {
        timestamps: true
    }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;