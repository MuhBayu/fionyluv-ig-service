const unirest = require('unirest');

const getFeed = (username) => {
    return unirest.get(`https://www.instagram.com/${username}/?__a=1`).then(data => data.body).catch(data => null)
}

const getMedia = (shortcode) => {
    return unirest.get(`https://www.instagram.com/p/${shortcode}/?__a=1`).then(data => data.body).catch(data => null)
}
module.exports = {
    getMedia,
    getFeed
}