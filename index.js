#!/usr/bin/env node
const express = require('express')
const { WebClient } = require('@slack/web-api')
const schedule = require('node-schedule')
const {
  // displayDatabase, // DEBUG
  getLastUpdate,
  setLastUpdate,
  getLeaderBoard,
  updateUser,
  userEarnPoints,
  clearDatabase,
} = require('./lib/state')
const { postLeaderboard } = require('./lib/bot')

const slackClient = new WebClient(process.env.SLACK_TOKEN)

async function getUsername(id) {
  const { profile } = await slackClient.users.profile.get({ user: id })
  return profile.real_name
}

const oneHour = 60 * 60 * 1e3 // in ms
const maxMessages = 1e3
async function getMessageHistory(from = 0, to = Date.now() - oneHour) {
  return slackClient.conversations.history({
    channel: 'C027VGR1H', // '#general'
    count: maxMessages,
    // Note: timestamps are in seconds
    oldest: from / 1e3,
    latest: to / 1e3,
  }).then(async (history) => {
    // console.log('>>> message history:')
    // console.log(history)
    await setLastUpdate(to)
    // TODO: don't use this?
    const userScoreMap = {} // simulate DB
    history.messages
      .filter((message) => 'reactions' in message)
      .forEach((message) => {
        let bestReactionCount = 0
        // TODO: use reduce
        message.reactions.forEach((reaction) => {
          if (reaction.count >= bestReactionCount) {
            bestReactionCount = reaction.count
            const userId = reaction.users[0]
            // score = redis.get(userId) || 0
            const previousScore = userScoreMap[userId] || 0
            // redis.set(userId, score + bestReactionCount)
            userScoreMap[userId] = previousScore + bestReactionCount
            // console.log(`${userId} wins ${users[userId]} points`)
            userEarnPoints(userId, bestReactionCount)
          }
        })
      })
    // console.log(`userScoreMap: ${JSON.stringify(userScoreMap)}`)

    // DEBUG: remove this later, since we have redis now
    // Establish the (local, ephemeral) leaderboard
    return Promise.all(Object.entries(userScoreMap).map(async ([userId, score]) => ({
      userId,
      score,
      username: await getUsername(userId),
    })))
  }).then((leaderboard) => {
    leaderboard.forEach(({ userId, username }) => {
      updateUser(userId, username)
    })
    return leaderboard
  }).catch(console.error)
}

async function updateMessages() {
  const lastUpdate = await getLastUpdate()
  return getMessageHistory(lastUpdate)
}

/* SLACK STUFF */
// TODO: use listeners?
// const { createEventAdapter } = require('@slack/events-api')
//
// const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET)
// const port = process.env.PORT || 3000
//
// slackEvents.on('reaction_added', (event) => {
//   console.log(`Received a reaction_added event: ${JSON.stringify(event)}`)
// })
//
// slackEvents.on('reaction_removed', (event) => {
//   console.log(`Received a reaction_removed event: ${JSON.stringify(event)}`)
// })
//
// slackEvents.on('error', console.error)
//
// // Start a basic HTTP server
// slackEvents.start(port).then(() => {
//   console.log(`server listening on port ${port}`)
// })

// Script to run every hour at 0min0sec that will check previousHourMessages
schedule.scheduleJob('0 0 * * * *', updateMessages)

/* EXPRESS STUFF */
const PORT = process.env.PORT || 8080
express()
  .use(express.urlencoded({ extended: false }))
  .get('/', async (req, res) => {
    const data = {}
    try {
      await updateMessages()
      data.leaderboard = await getLeaderBoard(1000)
      // displayDatabase() // DEBUG
    } catch (e) {
      data.error = e
    }
    res.render('pages/index.pug', data)
  })
  .get('/setup', async (req, res) => {
    res.send('Initializing database...')
    await clearDatabase()
    await getMessageHistory()
    console.info('Database successfully initialized!')
  })
  .post('/leaderboard', async ({ body }, res) => {
    res.send('Fetching the leaderboard...')
    try {
      await postLeaderboard(body.response_url)
      console.info(`Leaderboard sent to ${body.user_name}`)
    } catch (e) {
      console.error('Error posting leaderboard:', e)
      console.debug('Failed command with payload:', body)
    }
  })
  .get('/clear', async (req, res) => {
    res.send('Clearing the database...')
    await clearDatabase()
    console.info('Database successfully cleared!')
  })
  .get('/health', async (req, res) => {
    res.status(200).send({
      date: Date.now(),
      message: 'ok',
      uptime: process.uptime(),
    })
    console.debug('Health check sent!')
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}...`))
