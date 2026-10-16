
require("dotenv").config()

process.env.NODE_ENV = "test"

const mongoose = require("mongoose")

beforeAll(() => {
    if (!process.env.MONGO_TEST_URI) {
        throw new Error("MONGO_TEST_URI is required for Jest tests")
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is required for Jest tests")
    }
})

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
    }
})
