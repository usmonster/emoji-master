const redis = require('redis')
const { promisify } = require('util')

const client = redis.createClient(process.env.REDIS_URL)
const getAsync = promisify(client.get).bind(client)
const setAsync = promisify(client.set).bind(client)
const getKeysAsync = promisify(client.keys).bind(client)

client.on('error', (err) => {
  console.log(`Error: ${err}`)
})

function userEarnPoints(user, points) {
  return getAsync(user)
    .then((res) => {
      let score = 0
      if (res !== null) {
        score = res.score + points
      }
      return (setAsync(user, score))
    }).then((res) => {
      console.log(`User points successfully set - ${res}`)
    }).catch((err) => {
      console.error(err)
    })
}

function displayDatabase() {
  return getKeysAsync('*').then((keys) => {
    for (let i = 0; i < keys.length; i = i + 1) {
      console.log(`${keys} have ${keys[i]} points`)
    }
  }).catch((err) => {
    console.error(err)
  })
}

module.exports = { userEarnPoints, displayDatabase }
