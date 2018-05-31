#!/usr/bin/env node
const redis = require('redis').createClient(process.env.REDIS_URL);

const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);
const port = process.env.PORT || 3000;

slackEvents.on('reaction_added', (event) => {
  console.log(`Received a reaction_added event: ${JSON.stringify(event)}`);
});

slackEvents.on('reaction_removed', (event) => {
  console.log(`Received a reaction_removed event: ${JSON.stringify(event)}`);
});

slackEvents.on('error', console.error);

// Start a basic HTTP server
slackEvents.start(port).then(() => {
  console.log(`server listening on port ${port}`);
});

const app = require('express');
app.get('/', async (req, res) => {
  res.send('Hello world!');
});
app.listen(80);
console.log(`Listening on port 80...`);
