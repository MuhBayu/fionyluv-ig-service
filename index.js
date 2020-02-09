const cron = require('node-cron');
require('dotenv').config()
const redis = require("./util/Redis")
const {promisify} = require('util');
const redisExist = promisify(redis.client.exists).bind(redis.client);
const {
    getFeed,
	getMedia
 } = require('./service/insta')
const {sendPush} = require('./service/fionyluv')
const fs = require('fs')

const OSHI_USERNAME = process.env.OSHI_USERNAME

const datesAreOnSameDay = (first, second) => {
    return first.getDate() == second.getDate() &&
    first.getMonth() === second.getMonth() &&
    first.getYear() === second.getYear()
}

const objectNotEmpty = (obj) => {
	return Object.keys(obj).length !== 0 && obj.constructor === Object
}


cron.schedule('* * * * *', async () => {
	fs.appendFileSync('log.txt', "TASK [" + new Date().toLocaleString() + "]\n")
	// (async() => {
		let Feed = await getFeed(OSHI_USERNAME)
		let edges = Feed.graphql.user.edge_owner_to_timeline_media.edges
		edges.forEach(async(element) => {
			let shortcode = element.node.shortcode
			let current_timestamp = Math.round(new Date().getTime() / 1000)
			let taken_at_timestamp = new Date(element.node.taken_at_timestamp * 1000)
			try {
				var caption = element.node.edge_media_to_caption.edges[0].node['text']
			} catch (error) {
				var caption = ""
			}
			current_timestamp = new Date(current_timestamp * 1000)
			var data_to_send = {}
			if (datesAreOnSameDay(taken_at_timestamp, current_timestamp)) {
				var checkExist = await redisExist(`${OSHI_USERNAME}:${shortcode}`)
				if(!checkExist) {
					var get_medias = await getMedia(shortcode)
					var medias = []
					if ("edge_sidecar_to_children" in get_medias.graphql.shortcode_media) {
						var shortcode_media_children = get_medias.graphql.shortcode_media.edge_sidecar_to_children.edges
						shortcode_media_children.forEach(mediachil => {
							let media_child_node = mediachil.node
							if (media_child_node.is_video) {
								medias.push({
									"url": media_child_node.video_url,
									"display_url": media_child_node.display_url,
									"type": "video"
								})
							} else {
								medias.push({
									"url": media_child_node.display_url,
									"display_url": media_child_node.display_url,
									"type": "photo"
								})
							}
						});
					} else {
						var shortcode_media = get_medias.graphql.shortcode_media
						if (shortcode_media.is_video) {
							medias.push({
								"url": shortcode_media.video_url,
								"display_url": shortcode_media.display_url,
								"type": "video"
							})
						} else {
							medias.push({
								"url": shortcode_media.display_url,
								"display_url": shortcode_media.display_url,
								"type": "photo"
							})
						}
					}
					data_to_send = {
						"text": caption,
						"url": `https://instagram.com/p/${shortcode}`,
						"medias": medias
					}
				}
				if (objectNotEmpty(data_to_send)) {
					send_push = await sendPush(data_to_send)
					if(send_push) {
						redis.client.setex(`${OSHI_USERNAME}:${shortcode}`, 86400, "OK")
						fs.appendFileSync('log.txt', shortcode + " SENT\n")
					} else {
						fs.appendFileSync('log.txt', shortcode + " FAILED SEND\n")
					}
				}
			} else {
				fs.appendFileSync('log.txt', shortcode + " SKIPED\n")
			}
		})
	// })()
});

console.log("Service running, CTRL+C to stop")