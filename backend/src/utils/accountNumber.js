const generateAccountNumber = () => {
    const timestamp = Date.now().toString()
    
    const random = Math.floor(
        1000+Math.random()*9000
    ).toString()

    return timestamp.slice(-6)+random

}



module.exports = generateAccountNumber