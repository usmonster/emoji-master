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
    	let parsedRes = JSON.parse(res);
      let totalScore = 0
      if (parsedRes !== null) {
        totalScore = parsedRes.score + points
      }
      return (setAsync(user, JSON.stringify({ score: totalScore })))
    }).then((res) => {
      console.log(`User points successfully set - ${res}`)
    }).catch((err) => {
      console.error(err)
    })
}

function displayDatabase() {
  return getKeysAsync('*').then((keys) => {
    for (let i = 0; i < keys.length; i += 1) {
      getAsync(keys[i]).then((values) => {
        console.log(`${keys[i]} have ${values} points`)
      }).catch((err) => {
        console.error(err)
      })
    }
  }).catch((err) => {
    console.error(err)
  })
}

module.exports = { userEarnPoints, displayDatabase }
