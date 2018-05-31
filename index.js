#!/usr/bin/env node
const redis = require('redis').createClient(process.env.REDIS_URL)
const request = require('request')

var options = { method: 'GET',
  url: 'https://slack.com/api/channels.history',
  qs:
   { token: process.env.SLACK_TOKEN,
     channel: 'C027VGR1H' },
  headers:
   { 'cache-control': 'no-cache',
     'content-type': 'application/x-www-form-urlencoded' } }

request(options, (error, response, body) => {
  if (error) {
      throw new Error(error)
  }

  console.log(body)
})

const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter
const slackEvents = createSlackEventAdapter(process.env.SLACK_TOKEN)
const port = process.env.PORT || 3000

slackEvents.on('reaction_added', (event) => {
  console.log(`Received a reaction_added event: ${JSON.stringify(event)}`);
})

slackEvents.on('reaction_removed', (event) => {
  console.log(`Received a reaction_removed event: ${JSON.stringify(event)}`)
})

slackEvents.on('error', console.error)

// Start a basic HTTP server
slackEvents.start(port).then(() => {
  console.log(`server listening on port ${port}`)
})

const express = require('express')
const app = express()
app.get('/', async (req, res) => {
  res.send('Hello world!')
})
app.listen(80)
console.log(`Listening on port 80...`)
