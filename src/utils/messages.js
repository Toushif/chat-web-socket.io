const GenerateMessages = (username, text) => {
    return {
        username,
        text,
        time: new Date().getTime()
    }
}

const GenerateLocation = (username, url) => {
    return {
        username,
        url,
        time: new Date().getTime()
    }
}

module.exports = {
    GenerateMessages,
    GenerateLocation
}