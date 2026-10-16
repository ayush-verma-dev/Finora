const request = require("supertest")
const mongoose = require("mongoose")
const dns = require("node:dns")
const app = require("../src/app")
const User = require("../src/models/User")
const Account = require("../src/models/Account")

dns.setServers(["10.69.92.49"])

const testEmail = `jest-account-${Date.now()}@example.com`
const testPassword = "JestAccountPassword123"

let loginCookie
let createdAccountId

describe("Account API integration tests", () => {
    beforeAll(async () => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Tests must run with NODE_ENV=test")
        }

        if (!process.env.MONGO_TEST_URI) {
            throw new Error("MONGO_TEST_URI is required")
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is required")
        }

        await mongoose.connect(process.env.MONGO_TEST_URI, {
            serverSelectionTimeoutMS: 10000
        })

        if (mongoose.connection.name !== "bank_transaction_test") {
            await mongoose.disconnect()
            throw new Error(
                "Refusing to run tests against a non-test database"
            )
        }

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Jest Account User",
                email: testEmail,
                password: testPassword,
                phone: "9000000001"
            })
            .then(response => {
                expect(response.status).toBe(201)
            })

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email: testEmail,
                password: testPassword
            })

        expect(loginResponse.status).toBe(200)
        expect(loginResponse.headers["set-cookie"]).toBeDefined()

        loginCookie = loginResponse.headers["set-cookie"]
            .map(cookie => cookie.split(";")[0])
            .join("; ")
    })

    afterAll(async () => {
        if (mongoose.connection.name === "bank_transaction_test") {
            await Account.deleteMany({
                user: await User.findOne({ email: testEmail }).distinct("_id")
            })

            await User.deleteOne({ email: testEmail })
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect()
        }
    })

    test.each([
        ["post", "/api/account"],
        ["get", "/api/account"],
        ["get", "/api/account/details"],
        ["get", "/api/account/summary"],
        ["get", "/api/account/dashboard"]
    ])("%s %s rejects unauthenticated requests", async (method, path) => {
        const response = await request(app)[method](path)

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe("Authentication required")
    })

    test("creates a bank account for the authenticated user", async () => {
        const response = await request(app)
            .post("/api/account")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe("Bank Account created successfully")
        expect(response.body.account.accountNumber).toBeDefined()
        expect(response.body.account.accountType).toBe("savings")
        expect(response.body.account.balance).toBe(0)
        expect(response.body.account.currency).toBe("INR")
        expect(response.body.account.status).toBe("active")

        createdAccountId = response.body.account.id
    })

    test("rejects creating a second account for the same user", async () => {
        const response = await request(app)
            .post("/api/account")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(409)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe("User already has a bank account")
    })

    test("returns the authenticated user's account", async () => {
        const response = await request(app)
            .get("/api/account")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.account.accountNumber).toBeDefined()
        expect(response.body.account.balance).toBe(0)
    })

    test("returns account details without exposing internal fields", async () => {
        const response = await request(app)
            .get("/api/account/details")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.account.accountNumber).toBeDefined()
        expect(response.body.account.createdAt).toBeDefined()
        expect(response.body.account.updatedAt).toBeDefined()
        expect(response.body.account).not.toHaveProperty("user")
        expect(response.body.account).not.toHaveProperty("dailyOutgoingTotal")
    })

    test("returns account summary", async () => {
        const response = await request(app)
            .get("/api/account/summary")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.summary).toEqual({
            totalCredits: 0,
            totalDebits: 0,
            totalTransactions: 0
        })
    })

    test("rejects an invalid from date", async () => {
        const response = await request(app)
            .get("/api/account/summary?from=not-a-date")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("Invalid from date")
    })

    test("rejects an invalid to date", async () => {
        const response = await request(app)
            .get("/api/account/summary?to=not-a-date")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("Invalid to date")
    })

    test("rejects a date range where from is later than to", async () => {
        const response = await request(app)
            .get("/api/account/summary?from=2026-10-15&to=2026-10-01")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(400)
        expect(response.body.message).toBe(
            "From date cannot be greater than to date"
        )
    })

    test("returns the account dashboard", async () => {
        const response = await request(app)
            .get("/api/account/dashboard")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.account.accountNumber).toBeDefined()
        expect(response.body.summary).toEqual({
            totalCredits: 0,
            totalDebits: 0,
            totalTransactions: 0
        })
        expect(response.body.recentTransactions).toEqual([])
    })
})