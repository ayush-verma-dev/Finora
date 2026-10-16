const generateTransactionId = () => {
    const timestamp = Date.now()

    const random = Math.floor(
        1000+Math.random()*9000
    )

    return `TXN-${timestamp}-${random}`
}


module.exports = generateTransactionId