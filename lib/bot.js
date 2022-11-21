const postResponse = require('bent')('POST', 'string', 200)
const { getLeaderBoard } = require('./state')

const channel = '#general' // TODO: parameterize this

function getMessage(leaders) {
  const [first, second, third] = leaders
  const text = `#LEADERBOARD for ${channel}
  :hamburger: *${first.name}* with a score of ${first.score}
  :fries: *${second.name}* with a score of ${second.score}
  :cup_with_straw: *${third.name}* with a score of ${third.score}
  _<${process.env.APP_DISPLAY_URL || 'http://localhost:8080'}|Show all scores>_
  `
  return {
    text,
    response_type: 'ephemeral',
  }
}

async function postLeaderboard(responseUrl, boast = false) {
  const top3 = await getLeaderBoard(3)
  const message = getMessage(top3)
  if (boast) delete message.response_type
  return postResponse(responseUrl, message)
}

module.exports = { postLeaderboard }
