
require("dotenv").config()

const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

async function run() {
    if (!process.env.MONGO_TEST_URI) {
        throw new Error("MONGO_TEST_URI is missing from .env")
    }

    const connection = mongoose.createConnection(
        process.env.MONGO_TEST_URI,
        { serverSelectionTimeoutMS: 10000 }
    )

    try {
        await connection.asPromise()

        if (connection.name !== "bank_transaction_test") {
            throw new Error(
                `Safety check failed: connected to ${connection.name}`
            )
        }

        const User = connection.model(
            "User",
            new mongoose.Schema({}, {
                strict: false,
                collection: "users"
            })
        )

        const users = await User.find({})
            .select("name email role")
            .lean()

        console.log("Test users:")

        for (const user of users) {
            console.log({
                name: user.name,
                email: user.email,
                role: user.role
            })
        }
    } finally {
        await connection.close()
    }
}

run().catch(error => {
    console.error(error.message)
    process.exitCode = 1
})
