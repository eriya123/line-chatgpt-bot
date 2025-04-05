const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const app = express();
app.use(middleware(config));

const client = new Client(config);

app.post('/webhook', async (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then(result => res.json(result));
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const prompt = process.env.DEFAULT_PROMPT || "You are a helpful assistant.";
  const userInput = event.message.text;

  const messages = [
    { role: "system", content: prompt },
    { role: "user", content: userInput }
  ];

  try {
    const completion = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: messages
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const replyText = completion.data.choices[0].message.content.trim();

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyText
    });

  } catch (err) {
    console.error(err);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: "ごめん、少し考える時間が必要みたい。もう一度送ってくれる？"
    });
  }
}

app.get('/', (req, res) => res.send('Shogo Bot is running.'));
const port = process.env.PORT || 3000;
app.listen(port);
