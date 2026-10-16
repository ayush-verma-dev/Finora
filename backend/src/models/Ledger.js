const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
    {
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            required: true,
            unique: true
        },

        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: true
        },

        entryType: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01
        },

        balanceBefore: {
            type: Number,
            required: true,
            min: 0
        },

        balanceAfter: {
            type: Number,
            required: true,
            min: 0
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

const Ledger = mongoose.model("Ledger", ledgerSchema);

module.exports = Ledger;