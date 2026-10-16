const mongoose = require("mongoose")

const accountSchema = new mongoose.Schema(
    {
        accountNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        accountType: {
            type: String,
            enum: ["savings", "current"],
            default: "savings"
        },
        balance: {
            type: Number,
            default: 0,
            min: 0
        },
        currency: {
            type: String,
            default: "INR"
        },
        status: {
            type: String,
            enum: ["active", "blocked", "closed"],
            default: "active"
        },
        dailyOutgoingDate: {
            type: String,
            default: ""
        },
        dailyOutgoingTotal: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
)

const Account = mongoose.model("Account", accountSchema)



module.exports = Account
