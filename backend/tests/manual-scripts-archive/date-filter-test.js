require("dotenv").config()

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "")
const AUTH_TOKEN = process.env.CONCURRENCY_TEST_TOKEN

const testCases = [
    {
        name: "Invalid from date",
        query: "?from=not-a-date",
        expectedStatus: 400,
        expectedMessage: "Invalid from date. Use YYYY-MM-DD format"
    },
    {
        name: "Invalid to date",
        query: "?to=not-a-date",
        expectedStatus: 400,
        expectedMessage: "Invalid to date. Use YYYY-MM-DD format"
    },
    {
        name: "From date later than to date",
        query: "?from=2026-10-10&to=2026-10-01",
        expectedStatus: 400,
        expectedMessage: "From date cannot be greater than to date"
    },
    {
        name: "Valid date range",
        query: "?from=2026-01-01&to=2026-12-31",
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
            `Server returned a non-JSON response (HTTP ${response.status})`
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

    if (
        !["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname)
    ) {
        throw new Error(
            "Safety check failed: API_BASE_URL must point to localhost"
        )
    }

    console.log("\nRunning date-filter validation tests...")
    console.log(`Local API: ${API_BASE_URL}`)
    console.log("These tests use GET requests only.\n")

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
    console.error("Date-filter test suite failed:", error.message)
    process.exitCode = 1
})
