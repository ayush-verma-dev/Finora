
const request = require("supertest")
const mongoose = require("mongoose")
const app = require("../src/app")
const User = require("../src/models/User")
const dns = require("node:dns")

dns.setServers(["10.69.92.49"])

const testEmail = `jest-auth-${Date.now()}@example.com`
const testPassword = "JestTestPassword123"

let loginCookie

describe("Authentication API integration tests", () => {
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
    })

    afterAll(async () => {
        if (mongoose.connection.name === "bank_transaction_test") {
            await User.deleteOne({ email: testEmail })
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect()
        }
    })

    test("should register a new user", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Jest Auth User",
                email: testEmail,
                password: testPassword,
                phone: "9000000000"
            })

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.user.email).toBe(testEmail)
        expect(response.body.user).not.toHaveProperty("password")
    })

    test("should reject registering the same email twice", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Jest Auth User",
                email: testEmail,
                password: testPassword,
                phone: "9000000000"
            })

        expect(response.status).toBe(409)
        expect(response.body.success).toBe(false)
    })

    test("should log in with valid credentials", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testEmail,
                password: testPassword
            })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.headers["set-cookie"]).toBeDefined()

        loginCookie = response.headers["set-cookie"]
            .map(cookie => cookie.split(";")[0])
            .join("; ")
    })

    test("should return the authenticated user's details", async () => {
        const response = await request(app)
            .get("/api/auth/me")
            .set("Cookie", loginCookie)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.user.email).toBe(testEmail)
        expect(response.body.user).not.toHaveProperty("password")
    })

    test("should reject an incorrect password", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testEmail,
                password: "WrongPassword123"
            })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    test("should log out and clear the authentication cookie", async () => {
        const response = await request(app)
            .post("/api/auth/logout")

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe("Logged out successfully")

        const cookies = response.headers["set-cookie"]

        expect(cookies).toBeDefined()
        expect(cookies.join(";")).toMatch(/token=;/)
        expect(cookies.join(";")).toMatch(/expires=/i)
    })
})
