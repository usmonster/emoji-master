#!/usr/bin/env node
const { WebClient } = require('@slack/client')
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
const { emojiMasterCommand } = require('./lib/bot')

const slackClient = new WebClient(process.env.SLACK_TOKEN)

async function getUsername(id) {
  return slackClient.users.profile.get({ user: id }).then(({ profile }) => profile.real_name)
}

async function getMessageHistory(from = 0, to = Date.now() / 1e3) {
  return slackClient.channels.history({
    channel: 'C027VGR1H',
    count: 1000,
    oldest: from,
    latest: to,
  }).then(async (history) => {
    await setLastUpdate(Date.now() / 1000)
    // console.log('>>> message history:')
    // console.log(history)
    const userScoreMap = {} // simulate DB
    history.messages
      .filter(message => 'reactions' in message)
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

async function getPreviousHourMessages() {
  // Note: times are in seconds
  const oneHour = 60 * 60
  const now = Date.now() / 1e3
  return getMessageHistory(now - (oneHour * 2), now - oneHour)
}

/* SLACK STUFF */
// TODO: use listeners?
// const { createSlackEventAdapter } = require('@slack/events-api')
//
// const slackEvents = createSlackEventAdapter(process.env.SLACK_TOKEN)
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
schedule.scheduleJob('0 0 * * * *', getPreviousHourMessages)

/* EXPRESS STUFF (temporary) */

const express = require('express')

const PORT = process.env.PORT || 8080
express()
  .get('/', async (req, res) => {
    const data = {}
    try {
      const lastUpdate = await getLastUpdate()
      await getMessageHistory(lastUpdate)
      data.leaderboard = await getLeaderBoard(1000)
      // await getPreviousHourMessages()
      // displayDatabase() // DEBUG
    } catch (e) {
      data.error = e
    }
    res.render('pages/index.pug', data)
  })
  .post('/leaderboard', async (req, res) => {
    await emojiMasterCommand()
    return res
  })
  .get('/clear', async (req, res) => {
    await clearDatabase()
    return res.send('Database successfully flushed')
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}...`))
