const unirest = require('unirest')

const LINE_BOT_URL = process.env.LINE_BOT_URL

const sendPush = (data) => {
    return unirest
        .post(LINE_BOT_URL + '/api/send-push')
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
        .send(data)
        .then(result => {
            if (result.status == 200) {
                return true
            } return false
        })
        .catch(result => false)
}

module.exports = {
    sendPush
}