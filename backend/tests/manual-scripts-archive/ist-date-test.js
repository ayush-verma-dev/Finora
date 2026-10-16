
const parseISTDate = (value, isEndDate = false) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null
    }

    const [year, month, day] = value.split("-").map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null
    }

    const IST_OFFSET_MS = 330 * 60 * 1000

    if (isEndDate) {
        date.setUTCDate(date.getUTCDate() + 1)
        return new Date(date.getTime() - IST_OFFSET_MS - 1)
    }

    return new Date(date.getTime() - IST_OFFSET_MS)
}

const start = parseISTDate("2026-10-14")
const end = parseISTDate("2026-10-14", true)

console.log("IST day start:", start.toISOString())
console.log("IST day end:", end.toISOString())

if (start.toISOString() !== "2026-10-13T18:30:00.000Z") {
    throw new Error("IST start boundary is incorrect")
}

if (end.toISOString() !== "2026-10-14T18:29:59.999Z") {
    throw new Error("IST end boundary is incorrect")
}

if (parseISTDate("2026-02-30") !== null) {
    throw new Error("Invalid calendar date was not rejected")
}

if (parseISTDate("14-10-2026") !== null) {
    throw new Error("Invalid date format was not rejected")
}

console.log("PASSED: IST day boundaries are correct")
console.log("PASSED: Invalid dates and formats are rejected")
