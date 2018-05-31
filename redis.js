const redis = require('redis')
const { promisify } = require('util')

const client = redis.createClient(process.env.REDIS_URL)
const zscoreAsync = promisify(client.zscore).bind(client)
const zaddAsync = promisify(client.zadd).bind(client)
const zrevrangeAsync = promisify(client.zrevrange).bind(client)
const zrevrangebyscoreAsync = promisify(client.zrevrangebyscore).bind(client)

client.on('error', (err) => {
  console.log(`Error: ${err}`)
})

function userEarnPoints(user, points) {
  return zscoreAsync('leaderboard', user)
    .then((res) => {
      const parsedRes = JSON.parse(res)
      let score = 0
      if (parsedRes !== null) {
        score = parsedRes.score + points
      }
      return (zaddAsync('leaderboard', score, user))
    }).then((res) => {
      console.log(`User points successfully set - ${res}`)
    }).catch((err) => {
      console.error(err)
    })
}

function getLeaderBoard(numberOfUsers) {
  return zrevrangeAsync('leaderboard', 0, numberOfUsers)
    .then((res) => {
      console.log(JSON.stringify(res))
    })
}

function displayDatabase() {
  return zrevrangebyscoreAsync('leaderboard', '+inf', -1).then((res) => {
    console.log(JSON.stringify(res))
  }).catch((err) => {
    console.error(err)
  })
}

// getLeaderBoard(3)
displayDatabase()
module.exports = { userEarnPoints, displayDatabase }
