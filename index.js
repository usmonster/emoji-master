#!/usr/bin/env node
/* eslint-disable no-console */
const request = require('request')

const options = {
  method: 'GET',
  url: 'https://slack.com/api/channels.history',
  qs:
   {
     token: process.env.SLACK_TOKEN,
     channel: 'C027VGR1H',
     count: 10
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

  parsedBody = JSON.parse(body)
  console.log(parsedBody)

  if (parsedBody.ok) {
      users = [] // simulate DB
      parsedBody.messages.forEach(message => {
        if (message.reactions) {
            bestReactionCount = 0
            message.reactions.forEach(reaction => {
                if (reactions.count > bestReactionCount) {
                    bestReactionCount = reactions.count
                    user = reaction.users[0]
                    //score = redis.get(user) || 0
                    previousScore = users[user] || 0
                    //redis.set(user, score + bestReactionCount)
                    users[user] = previousScore + bestReactionCount
                    console.log(`${user} wins ${users[user]} points`)
                }
            })
          }
      })

      console.log(users)
  }
})

/* SLACK STUFF */

const { createSlackEventAdapter } = require('@slack/events-api')

const slackEvents = createSlackEventAdapter(process.env.SLACK_TOKEN)
const port = process.env.PORT || 3000

slackEvents.on('reaction_added', (event) => {
  console.log(`Received a reaction_added event: ${JSON.stringify(event)}`)
})

slackEvents.on('reaction_removed', (event) => {
  console.log(`Received a reaction_removed event: ${JSON.stringify(event)}`)
})

slackEvents.on('error', console.error)

// Start a basic HTTP server
slackEvents.start(port).then(() => {
  console.log(`server listening on port ${port}`)
})

/* REDIS STUFF */

// const redis = require('redis').createClient(process.env.REDIS_URL)
// TODO: Use redis

/* EXPRESS STUFF (temporary) */

const express = require('express')

const app = express()
app.get('/', (req, res) => {
  res.send('Hello world!')
})
app.listen(8080)
console.log('Listening on port 8080...')
