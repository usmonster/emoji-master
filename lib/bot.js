const { IncomingWebhook } = require('@slack/client')
const { getLeaderBoard } = require('./state')

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL)
const channel = '#general' // TODO: parameterize this

function getMessageObj(res) {
  const [first, second, third] = res
  const message = `#LEADERBOARD for ${channel}
  :hamburger: *${first.name}* with a score of ${first.score}
  :fries: *${second.name}* with a score of ${second.score}
  :cup_with_straw: *${third.name}* with a score of ${third.score}
  _<https://emoji-master.herokuapp.com/|Show all scores>_
  `

  const messageObj = {
    text: message,
    mrkdwn: true,
    // TODO: test this, or just use `chat.postEphemeral` (see gh-1)
    // response_type: 'ephemeral',
  }

  return messageObj
}

async function emojiMasterCommand() {
  const top3 = await getLeaderBoard(3)
  const messageObj = getMessageObj(top3)

  webhook.send(messageObj, (err, res) => {
    if (err) {
      console.error('Error:', err)
    } else {
      console.log('Message sent: ', res)
    }
  })
}

module.exports = { emojiMasterCommand }
