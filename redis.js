const redis = require('redis')
const { promisify } = require('util')

const client = redis.createClient(process.env.REDIS_URL)
const zscoreAsync = promisify(client.zscore).bind(client)
const zaddAsync = promisify(client.zadd).bind(client)
const zrevrangeAsync = promisify(client.zrevrange).bind(client)
const zrevrangebyscoreAsync = promisify(client.zrevrangebyscore).bind(client)

client.on('error', (err) => {
  console.error(`Error: ${err}`)
})

function userEarnPoints(user, points) {
  return zscoreAsync('leaderboard', user)
    .then((score) => {
      let newScore = points
      if (score !== null) {
        newScore = +score + points
      }
      return zaddAsync('leaderboard', 'INCR', newScore, user)
    }).then((total) => {
      console.log(`User points successfully set - ${total}`) // DEBUG
      return total
    }).catch(console.error)
}

function getLeaderBoard(numberOfUsers) {
  return zrevrangeAsync('leaderboard', 0, numberOfUsers, 'WITHSCORES')
    .then((res) => {
      console.log('getleaderboardstart') // DEBUG
      console.log(JSON.stringify(res)) // DEBUG
      console.log('getleaderboardend') // DEBUG
    })
}

function displayDatabase() {
  return zrevrangebyscoreAsync('leaderboard', '+inf', -1).then((res) => {
    console.log(JSON.stringify(res))
    return res
  }).catch(console.error)
}

getLeaderBoard(3)
// displayDatabase()
module.exports = { userEarnPoints, displayDatabase }
