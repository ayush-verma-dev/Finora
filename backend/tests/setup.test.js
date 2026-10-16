
const request = require("supertest")
const app = require("../src/app")

describe("Bank Transaction System API", () => {
    test("GET / should return the API running message", async () => {
        const response = await request(app).get("/")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            success: true,
            message: "Bank Transaction System API is running"
        })
    })

    test("GET /api/auth/test should work without authentication", async () => {
        const response = await request(app).get("/api/auth/test")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            success: true,
            message: "Auth route is working"
        })
    })

    test("GET /api/auth/me should reject a missing cookie", async () => {
        const response = await request(app).get("/api/auth/me")

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
            success: false,
            message: "Authentication required"
        })
    })

    test("GET /api/auth/me should reject an invalid token", async () => {
        const response = await request(app)
            .get("/api/auth/me")
            .set("Cookie", ["token=invalid-test-token"])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
            success: false,
            message: "Invalid or expired authentication token"
        })
    })

    test("POST /api/auth/register should reject missing fields", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Jest Test User"
            })

        expect(response.status).toBe(400)
        expect(response.body).toEqual({
            success: false,
            message: "All fields are required"
        })
    })

    test("POST /api/auth/login should reject missing credentials", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({})

        expect(response.status).toBe(400)
        expect(response.body).toEqual({
            success: false,
            message: "Email and Password are required"
        })
    })
})
