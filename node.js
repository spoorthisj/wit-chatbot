import fetch from "node-fetch";
import express from "express";

const WIT_AI_TOKEN = 'HCYM3HMI4A54QLUO6R6CLE5TXWQQQCEX'; // Wit.ai Token
const TELEGRAM_BOT_TOKEN = '7610856277:AAFDCEdVDUlXeAPB4hH9ZD9m9SOaEksZZbg'; // Telegram Bot Token
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/`;
const PORT = process.env.PORT || 3000;

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

    return await response.json();
  } catch (error) {
    console.error("Error fetching Wit.ai response:", error.message);
    return { error: "Failed to get response from Wit.ai." };
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
    console.error("Error sending message:", error.message);
  }
}

// Webhook handler for Telegram updates
app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const update = req.body;
  const chatId = update.message.chat.id;
  const userInput = update.message.text;

  if (userInput.toLowerCase() === 'exit') {
    await sendMessage(chatId, 'Goodbye!');
    return res.sendStatus(200);
  }

  const witResponse = await getWitResponse(userInput);

  if (witResponse.error) {
    await sendMessage(chatId, 'Sorry, something went wrong.');
  } else if (witResponse.entities) {
    await sendMessage(chatId, `Response: ${JSON.stringify(witResponse.entities, null, 2)}`);
  } else {
    await sendMessage(chatId, "I couldn't understand that.");
  }

  res.sendStatus(200);
});

// Set webhook for Telegram
async function setWebhook() {
  try {
    const url = `${process.env.BASE_URL}/webhook/${TELEGRAM_BOT_TOKEN}`;
    const response = await fetch(`${TELEGRAM_API_URL}setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    console.log("Webhook setup response:", data);
  } catch (error) {
    console.error("Error setting webhook:", error.message);
  }
}

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await setWebhook();
});


