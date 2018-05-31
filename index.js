#!/usr/bin/env node
const request = require('request')
const { userEarnPoints, displayDatabase } = require('./redis')

const options = {
  method: 'GET',
  url: 'https://slack.com/api/channels.history',
  qs:
   {
     token: process.env.SLACK_TOKEN,
     channel: 'C027VGR1H',
     count: 100,
   },
  headers:
   {
     'cache-control': 'no-cache',
     'content-type': 'application/x-www-form-urlencoded',
   },
}

request(options, (error, response, body) => {
  if (error) {
    console.error(error)
  }

  const parsedBody = JSON.parse(body)
  console.log(parsedBody)

  if (parsedBody.ok) {
    const users = [] // simulate DB
    parsedBody.messages.forEach((message) => {
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
            console.log(`${user} wins ${users[user]} points`)
            userEarnPoints(user, users[user])
          }
        })
      }
    })

    displayDatabase()

    // Establish the leaderboard
    leaderboard = {}
    users.map((score, userId) => {
        leaderboard[userId] = {username: getUsername(userId), score}
    })
    leaderboard.sort((u1, u2) => u2.score -u1.score)
    console.log(leaderboard)
  }
})

const getUsername = async (id) => {
  const options = {
    method: 'GET',
    url: 'https://slack.com/api/users.profile.get',
    qs:
     {
       token: process.env.SLACK_TOKEN,
       user: id,
     },
     headers:
      {
        'cache-control': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded',
      },
    }

    let username = id
    await request(options, (error, response, body) => {
      if (error) return

      const parsedBody = JSON.parse(body)
      if (parsedBody.ok) {
        username = parsedBody.profile.display_name
      }
    })

    return username
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

const app = express()
app.get('/', (req, res) => {
  res.send('Hello world!')
})
app.listen(8080)
console.log('Listening on port 8080...')
