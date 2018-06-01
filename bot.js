const { IncomingWebhook } = require('@slack/client')
const { getLeaderBoard } = require('./redis')

const url = process.env.SLACK_WEBHOOK_URL
const webhook = new IncomingWebhook(url)

getLeaderBoard(3).then((res) => {
  console.log(res)
  // let messageObj = getMessageObj(res)
  // console.log(messageObj);
  
  // webhook.send(messageObj, (err, res) => {
  //     if (err) {
  //         console.log('Error:', err)
  //     } else {
  //         console.log('Message sent: ', res)
  //     }
  // });
})

function getMessageObj(res) {
	const message = `#LEADERBOARD
  :first_place_medal: *<@${res[0].user}>* with a score of ${res[0].score}
  :second_place_medal: *<@${res[1].user}>* with a score of ${res[1].score}
  :third_place_medal: *<@${res[2].user}>* with a score of ${res[2].score}
  `

	const messageObj = {
		'text': message,
		'mrkdwn': true
	}

	return messageObj;
}
