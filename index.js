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
    // throw new Error(error)
  }
  console.log(body)
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
app.get('/', async (req, res) => {
  res.send('Hello world!')
})
app.listen(443)
console.log('Listening on port 443...')
