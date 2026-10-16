
require("dotenv").config()

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "")
const AUTH_TOKEN = process.env.CONCURRENCY_TEST_TOKEN

const testCases = [
    {
        name: "Non-numeric page",
        query: "?page=abc",
        expectedStatus: 400,
        expectedMessage: "Page must be a positive integer"
    },
    {
        name: "Decimal page",
        query: "?page=1.5",
        expectedStatus: 400,
        expectedMessage: "Page must be a positive integer"
    },
    {
        name: "Zero page",
        query: "?page=0",
        expectedStatus: 400,
        expectedMessage: "Page must be a positive integer"
    },
    {
        name: "Non-numeric limit",
        query: "?limit=abc",
        expectedStatus: 400,
        expectedMessage: "Limit must be an integer between 1 and 100"
    },
    {
        name: "Decimal limit",
        query: "?limit=2.5",
        expectedStatus: 400,
        expectedMessage: "Limit must be an integer between 1 and 100"
    },
    {
        name: "Limit above 100",
        query: "?limit=101",
        expectedStatus: 400,
        expectedMessage: "Limit must be an integer between 1 and 100"
    },
    {
        name: "Valid pagination",
        query: "?page=2&limit=10",
        expectedStatus: 200
    },
    {
        name: "Minimum limit of 1",
        query: "?page=1&limit=1",
        expectedStatus: 200
    },
    {
        name: "Maximum limit of 100",
        query: "?page=1&limit=100",
        expectedStatus: 200
    },
    {
        name: "Page beyond available results",
        query: "?page=999999&limit=10",
        expectedStatus: 200
    }
]

const runTest = async testCase => {
    const response = await fetch(
        `${API_BASE_URL}/api/transactions${testCase.query}`,
        {
            method: "GET",
            headers: {
                Cookie: `token=${AUTH_TOKEN}`
            }
        }
    )

    let data

    try {
        data = await response.json()
    } catch {
        throw new Error(
            `Non-JSON response received (HTTP ${response.status})`
        )
    }

    const statusMatches = response.status === testCase.expectedStatus

    const messageMatches = testCase.expectedMessage
        ? data.message === testCase.expectedMessage
        : true

    const passed = statusMatches && messageMatches

    console.log(
        `${passed ? "PASS" : "FAIL"}: ${testCase.name} | ` +
        `HTTP ${response.status} | ${data.message || ""}`
    )

    if (!passed) {
        console.dir(data, { depth: null })
    }

    return passed
}

const main = async () => {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL is missing from .env")
    }

    if (!AUTH_TOKEN) {
        throw new Error("CONCURRENCY_TEST_TOKEN is missing from .env")
    }

    let apiUrl

    try {
        apiUrl = new URL(API_BASE_URL)
    } catch {
        throw new Error("API_BASE_URL is not a valid URL")
    }

    if (!["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname)) {
        throw new Error(
            "Safety check failed: API_BASE_URL must point to localhost"
        )
    }

    console.log("\nRunning pagination validation tests...")
    console.log(`Local API: ${API_BASE_URL}\n`)

    let passed = 0

    for (const testCase of testCases) {
        try {
            if (await runTest(testCase)) {
                passed++
            }
        } catch (error) {
            console.log(`FAIL: ${testCase.name} | ${error.message}`)
        }
    }

    console.log(`\nResults: ${passed}/${testCases.length} tests passed`)

    if (passed !== testCases.length) {
        process.exitCode = 1
    }
}

main().catch(error => {
    console.error("Pagination test suite failed:", error.message)
    process.exitCode = 1
})
