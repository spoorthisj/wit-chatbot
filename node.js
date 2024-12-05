import fetch from 'node-fetch';
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: 'witt.env' });

const WIT_AI_TOKEN = process.env.WIT_AI_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/`;
const PORT = process.env.PORT || 3000;

if (!WIT_AI_TOKEN || !TELEGRAM_BOT_TOKEN || !WEBHOOK_URL) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const app = express();
app.use(express.json());

// Function to interact with Wit.ai
async function getWitResponse(message) {
  try {
    const response = await fetch(`https://api.wit.ai/message?v=20210626&q=${encodeURIComponent(message)}`, {
      headers: {
        Authorization: `Bearer ${WIT_AI_TOKEN}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching Wit.ai response:", error);
    return { error: "Failed to connect to Wit.ai" };
  }
}

// Function to send messages to Telegram
async function sendMessage(chatId, text) {
  try {
    await fetch(`${TELEGRAM_API_URL}sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const update = req.body;

  if (!update.message) return res.sendStatus(400);

  const chatId = update.message.chat.id;
  const userInput = update.message.text;

  const witData = await getWitResponse(userInput);
  const intent = witData.intents[0];

  if (intent && intent.confidence > 0.7) {
    await sendMessage(chatId, `Intent: ${intent.name} with confidence ${intent.confidence}`);
  } else {
    await sendMessage(chatId, "I'm not sure about that. Could you clarify?");
  }

  res.sendStatus(200);
});

async function setWebhook() {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `${WEBHOOK_URL}/webhook/${TELEGRAM_BOT_TOKEN}` }),
    });

    const data = await response.json();
    console.log(data.ok ? "Webhook set successfully." : `Failed to set webhook: ${data.description}`);
  } catch (error) {
    console.error("Error setting webhook:", error);
  }
}

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await setWebhook();
});









