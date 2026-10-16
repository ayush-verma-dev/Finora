const validateDescription = description => {
    if (description === undefined || description === null) {
        return {
            valid: true,
            description: undefined
        }
    }

    if (typeof description !== "string") {
        return {
            valid: false,
            message: "Description must be a string"
        }
    }

    if (description.length > 200) {
        return {
            valid: false,
            message: "Description cannot exceed 200 characters"
        }
    }

    return {
        valid: true,
        description
    }
}

module.exports = validateDescription