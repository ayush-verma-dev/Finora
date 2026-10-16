const MAX_TRANSACTION_AMOUNT = 100000

const validateAmount = (amount) => {

    if (amount === undefined || amount === null || amount === "") {
        return {
            valid: false,
            message: "Amount is required"
        }
    }

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount)) {
        return {
            valid: false,
            message: "Amount must be a valid number"
        }
    }

    if (numericAmount <= 0) {
        return {
            valid: false,
            message: "Amount must be greater than 0"
        }
    }

    if (numericAmount > MAX_TRANSACTION_AMOUNT) {
        return {
            valid: false,
            message: "Maximum transaction amount is INR 100,000"
        }
    }

    return {
        valid: true,
        amount: numericAmount
    }
}


module.exports = validateAmount;