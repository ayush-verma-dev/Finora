const validateIdempotencyKey = (key) => {
    if (key === undefined || key === null) {
        return {
            valid: false,
            message: "Idempotency key is required"
        }
    }

    if (typeof key !== "string") {
        return {
            valid: false,
            message: "Idempotency key must be a string"
        }
    }

    const trimmedKey = key.trim();

    if (trimmedKey.length === 0) {
        return {
            valid: false,
            message: "Idempotency key cannot be empty"
        }
    }

    if (trimmedKey.length < 8) {
        return {
            valid: false,
            message: "Idempotency key must be at least 8 characters"
        }
    }

    if (trimmedKey.length > 100) {
        return {
            valid: false,
            message: "Idempotency key cannot exceed 100 characters"
        }
    }

    return {
        valid: true,
        key: trimmedKey
    }
}

module.exports = validateIdempotencyKey