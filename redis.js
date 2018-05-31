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
    .then((score) => {
      let newScore = points
      if (score !== null) {
        newScore = score + points
      }
      return (zaddAsync('leaderboard', newScore, user))
    }).then((res) => {
      console.log(`User points successfully set - ${res}`)
    }).catch((err) => {
      console.error(err)
    })
}

function getLeaderBoard(numberOfUsers) {
  return zrevrangeAsync('leaderboard', 0, numberOfUsers)
    .then((res) => {
    	console.log('getleaderboardstart')
      console.log(JSON.stringify(res))
    	console.log('getleaderboardend')
    })
}

function displayDatabase() {
  return zrevrangebyscoreAsync('leaderboard', '+inf', -1).then((res) => {
    console.log(JSON.stringify(res))
  }).catch((err) => {
    console.error(err)
  })
}

getLeaderBoard(3)
// displayDatabase()
module.exports = { userEarnPoints, displayDatabase }
