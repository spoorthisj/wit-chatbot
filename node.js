import fetch from 'node-fetch';
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env file if available
dotenv.config({ path: 'witt.env' });

const WIT_AI_TOKEN = process.env.WIT_AI_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/`;
const PORT = process.env.PORT || 3000;

// Ensure the necessary environment variables are loaded
if (!WIT_AI_TOKEN || !TELEGRAM_BOT_TOKEN || !BASE_URL) {
  console.error("Missing required environment variables. Please set WIT_AI_TOKEN, TELEGRAM_BOT_TOKEN, and BASE_URL.");
  process.exit(1);  // Exit if environment variables are missing
}

const app = express();
app.use(express.json());

// Function to interact with Wit.ai API
async function getWitResponse(message) {
  try {
    const response = await fetch(`https://api.wit.ai/message?v=20210626&q=${encodeURIComponent(message)}`, {
      headers: {
        Authorization: `Bearer ${WIT_AI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Log the full response from Wit.ai
    console.log('Wit.ai Response:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error("Error fetching Wit.ai response:", error.message);
    return { error: "Failed to get response from Wit.ai." };
  }
}

// Function to send messages to Telegram
async function sendMessage(chatId, text) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error sending message: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending message:", error.message);
  }
}

// Updated webhook handler for Telegram updates
app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const update = req.body;
  if (!update.message) {
    return res.sendStatus(400); // Bad request if no message is found
  }

  const chatId = update.message.chat.id;
  const userInput = update.message.text;

  console.log(`Received message: ${userInput}`); // Log the incoming message

  // Fetch the response from Wit.ai
  const witResponse = await getWitResponse(userInput);

  if (witResponse.error) {
    await sendMessage(chatId, 'Sorry, something went wrong.');
  } else {
    // Check if the entities are present and process them
    const entities = witResponse.entities;

    if (entities && entities['hi:exams']) {
      const responseMessage = entities['hi:exams'][0]?.value || "Hello!";
      await sendMessage(chatId, responseMessage);
    } else {
      await sendMessage(chatId, "I couldn't understand that.");
    }
  }

  res.sendStatus(200); // Send acknowledgment to Telegram that the request was processed
});

// General webhook route
app.post('/webhook', (req, res) => {
  console.log('General webhook received:', req.body);  // Log incoming request for debugging
  res.sendStatus(200); // Respond with 200 OK to confirm receipt
});

// Set webhook for Telegram
async function setWebhook() {
  try {
    const url = `${BASE_URL}/webhook/${TELEGRAM_BOT_TOKEN}`;
    const response = await fetch(`${TELEGRAM_API_URL}setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    if (data.ok) {
      console.log("Webhook set successfully.");
    } else {
      console.error("Failed to set webhook:", data.description);
    }
  } catch (error) {
    console.error("Error setting webhook:", error.message);
  }
}

// Start the server and set the webhook
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await setWebhook(); // Set webhook when the server starts
});








