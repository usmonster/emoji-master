const redis = require('redis')
const { promisify } = require('util')

const client = redis.createClient(process.env.REDIS_URL)

// Unsorted list queries
const getAsync = promisify(client.get).bind(client)
const setAsync = promisify(client.set).bind(client)

// Sorted list queries
const zscoreAsync = promisify(client.zscore).bind(client)
const zaddAsync = promisify(client.zadd).bind(client)
const zrevrangeAsync = promisify(client.zrevrange).bind(client)
const zrevrangebyscoreAsync = promisify(client.zrevrangebyscore).bind(client)

client.on('error', (err) => {
  console.error(`Error: ${err}`)
})

function userEarnPoints(user, points) {
  return zscoreAsync('leaderboard', user).then((score) => {
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

function updateUser(userId, username) {
  return setAsync(userId, username)
    .then(console.log)
    .catch(console.error)
}

function getLeaderBoard(limit) {
  return zrevrangeAsync('leaderboard', 0, limit, 'WITHSCORES')
    .then(async(res) => {
      let leaderboard = []
      for (let i = 0; i < res.length; i += 2) {
        let name = await getAsync(res[i])
        leaderboard.push({
          id: res[i],
          score: res[i + 1],
          name: name
        })
      }
      return (leaderboard)
    })
}

function displayDatabase() {
  return zrevrangebyscoreAsync('leaderboard', '+inf', -1).then((res) => {
    console.log(res) // DEBUG
    return res
  }).catch(console.error)
}

// getLeaderBoard(3)
// displayDatabase()
module.exports = { userEarnPoints, displayDatabase, getLeaderBoard, updateUser }
