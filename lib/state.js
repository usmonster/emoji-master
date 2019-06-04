const redis = require('redis')
const { promisify } = require('util')

const client = redis.createClient(process.env.REDIS_URL)

// Unsorted list queries
const getAsync = promisify(client.get).bind(client)
const setAsync = promisify(client.set).bind(client)

// Sorted list queries
const zaddAsync = promisify(client.zadd).bind(client)
const zrevrangeAsync = promisify(client.zrevrange).bind(client)
const zrevrangebyscoreAsync = promisify(client.zrevrangebyscore).bind(client)

// Other queries
const flushallAsync = promisify(client.flushall).bind(client)

client.on('error', (err) => {
  console.error(`Error: ${err}`)
})

function userEarnPoints(user, points) {
  return zaddAsync('leaderboard', 'INCR', parseInt(points, 10), user)
    .then((total) => {
      console.log(`User points successfully set - ${total}`) // DEBUG
      return total
    }).catch(console.error)
}

function updateUser(userId, username) {
  return setAsync(userId, username)
    .then(console.log)
    .catch(console.error)
}

async function getLeaderBoard(limit) {
  return zrevrangeAsync('leaderboard', 0, limit, 'WITHSCORES')
    .then(async (res) => {
      const leaderboard = []
      for (let i = 0; i < res.length; i += 2) {
        const [id, score] = [res[i], res[i + 1]]
        const name = await getAsync(id) // eslint-disable-line no-await-in-loop
        leaderboard.push({ id, score, name })
      }
      return leaderboard
    })
}

async function setLastUpdate(timestamp) {
  await setAsync('last_update', timestamp)
  return 'ok'
}
async function getLastUpdate() {
  const lastUpdate = await getAsync('last_update')
  return lastUpdate
}

function displayDatabase() {
  return zrevrangebyscoreAsync('leaderboard', '+inf', -1).then((res) => {
    console.log(res) // DEBUG
    return res
  }).catch(console.error)
}

function clearDatabase() {
  return flushallAsync().then((res) => {
    console.log('Database successfully flushed')
    return res
  }).catch(console.error)
}

module.exports = {
  userEarnPoints,
  displayDatabase,
  getLeaderBoard,
  updateUser,
  clearDatabase,
  setLastUpdate,
  getLastUpdate,
}
