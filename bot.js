const { IncomingWebhook } = require('@slack/client')
const { getLeaderBoard } = require('./redis')

const url = process.env.SLACK_WEBHOOK_URL
const webhook = new IncomingWebhook(url)

async function emojiMasterCommand() {
  let res = await getLeaderBoard(3)
  let messageObj = getMessageObj(res)
  
  webhook.send(messageObj, (err, res) => {
      if (err) {
          console.log('Error:', err)
      } else {
          console.log('Message sent: ', res)
      }
  });

  // getLeaderBoard(3).then((res) => {
  //   let messageObj = getMessageObj(res)
    
  //   webhook.send(messageObj, (err, res) => {
  //       if (err) {
  //           console.log('Error:', err)
  //       } else {
  //           console.log('Message sent: ', res)
  //       }
  //   });
  // })
}

function getMessageObj(res) {
	const message = `#LEADERBOARD
  :hamburger: *${res[0].name}* with a score of ${res[0].score}
  :fries: *${res[1].name}* with a score of ${res[1].score}
  :cup_with_straw: *${res[2].name}* with a score of ${res[2].score}
  `

	const messageObj = {
		'text': message,
		'mrkdwn': true
	}

	return messageObj;
}

module.exports = { emojiMasterCommand }
