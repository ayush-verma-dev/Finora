
const dns = require("node:dns")
const mongoose = require("mongoose")
require("dotenv").config()

dns.setServers(["10.69.92.49"])

async function main() {
    await mongoose.connect(process.env.MONGO_TEST_URI)

    console.log("Connected database:", mongoose.connection.name)

    if (mongoose.connection.name !== "bank_transaction_test") {
        throw new Error("Safety check failed: connected to the wrong database")
    }
}

main()
    .catch(error => {
        console.error("Connection test failed:", error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
