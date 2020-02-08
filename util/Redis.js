const redis = require('redis')
var config = {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    db: process.env.REDIS_INDEX,
}
if(process.env.REDIS_AUTH) config['password'] = process.env.REDIS_AUTH

const client = redis.createClient(config);

module.exports = {
    config,
    client
}