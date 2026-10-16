const mongoose = require("mongoose")
const dns = require("node:dns")

dns.setServers(["8.8.8.8", "8.8.4.4"])

describe("Test database safety", () => {
    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect()
        }
    })

    test("should connect only to bank_transaction_test", async () => {
        const uri = process.env.MONGO_TEST_URI

        expect(process.env.NODE_ENV).toBe("test")
        expect(uri).toBeTruthy()

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        })

        expect(mongoose.connection.name).toBe("bank_transaction_test")
    })
})
