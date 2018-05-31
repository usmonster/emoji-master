#!/usr/bin/env node
const { WebClient } = require('@slack/client')
const { userEarnPoints, displayDatabase } = require('./redis')

const slackClient = new WebClient(process.env.SLACK_TOKEN)

async function getUsername(id) {
  return slackClient.users.profile.get({ user: id }).then(({ profile }) => profile.display_name)
}

function getMessageHistory(from = 0, to = Date.now()) {
  return slackClient.channels.history({
    channel: 'C027VGR1H',
    count: 100,
    oldest: from,
    latest: to,
  }).then((res) => {
    // console.log(res)
    if (res.ok) {
      const users = {} // simulate DB
      res.messages.forEach((message) => {
        if (message.reactions) {
          let bestReactionCount = 0
          message.reactions.forEach((reaction) => {
            if (reaction.count >= bestReactionCount) {
              bestReactionCount = reaction.count
              const user = reaction.users[0]
              // score = redis.get(user) || 0
              const previousScore = users[user] || 0
              // redis.set(user, score + bestReactionCount)
              users[user] = previousScore + bestReactionCount
              // console.log(`${user} wins ${users[user]} points`)
              userEarnPoints(user, bestReactionCount).then((res) => {
                console.log(`User points added - ${res}`)
              })
            }
          })
        }
      })

      // DEBUG: remove this later, since we have redis now
      // Establish the (local, ephemeral) leaderboard
      const leaderboard = Object.entries(users).map(async ([userId, score]) => ({
        userId,
        score,
        username: await getUsername(userId),
      }))
      console.log(leaderboard)
    }
  })
}

async function getPreviousHourMessages() {
  return getMessageHistory((Date.now() / 1000) - 7200, (Date.now() / 1000) - 3600)
    .then(() => displayDatabase())
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
    // await getMessageHistory()
    await getPreviousHourMessages()
    res.render('pages/index.pug')
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}...`))
