#!/usr/bin/env node
const { WebClient } = require('@slack/client')
const { userEarnPoints, displayDatabase } = require('./redis')

const slackClient = new WebClient(process.env.SLACK_TOKEN)

async function getUsername(id) {
  return slackClient.users.profile.get({ user: id }).then(({ profile }) => profile.display_name)
}

async function getMessageHistory(from = 0, to = Date.now() / 1e3) {
  return slackClient.channels.history({
    channel: 'C027VGR1H',
    count: 100,
    oldest: from,
    latest: to,
  }).then((history) => {
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
    console.log(`userScoreMap: ${JSON.stringify(userScoreMap)}`)

    // DEBUG: remove this later, since we have redis now
    // Establish the (local, ephemeral) leaderboard
    const fakeLeaderboard = Object.entries(userScoreMap).map(async ([userId, score]) => ({
      userId,
      score,
      username: await getUsername(userId),
    }))
    Promise.all(fakeLeaderboard).then(console.log)
    return fakeLeaderboard
  })
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

/* EXPRESS STUFF (temporary) */

const express = require('express')

const PORT = process.env.PORT || 8080
express()
  .get('/', async (req, res) => {
    const data = {}
    data.history = await getMessageHistory()
    // await getPreviousHourMessages()
    displayDatabase() // DEBUG
    res.render('pages/index.pug', data)
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}...`))
