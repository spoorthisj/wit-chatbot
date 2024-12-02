import fetch from "node-fetch";

const WIT_AI_TOKEN = 'HCYM3HMI4A54QLUO6R6CLE5TXWQQQCEX'; // Wit.ai Token
const TELEGRAM_BOT_TOKEN = '7610856277:AAFDCEdVDUlXeAPB4hH9ZD9m9SOaEksZZbg'; // Replace with your Telegram bot token
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/`;

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

// Function to handle incoming updates from Telegram
async function handleUpdate(update) {
  const chatId = update.message.chat.id;
  const userInput = update.message.text;

  if (userInput.toLowerCase() === 'exit') {
    await sendMessage(chatId, 'Goodbye!');
    return;
  }

  const witResponse = await getWitResponse(userInput);

  if (witResponse.error) {
    await sendMessage(chatId, 'Sorry, something went wrong.');
  } else if (witResponse.entities) {
    await sendMessage(chatId, `Response: ${JSON.stringify(witResponse.entities, null, 2)}`);
  } else {
    await sendMessage(chatId, "I couldn't understand that.");
  }
}

// Function to set up webhook or polling (simplified polling for now)
async function main() {
  console.log("Bot is running...");

  // Poll for updates every 3 seconds
  setInterval(async () => {
    try {
      const response = await fetch(`${TELEGRAM_API_URL}getUpdates`);
      const data = await response.json();
      if (data.result && data.result.length) {
        for (const update of data.result) {
          await handleUpdate(update);
        }
        // Acknowledge updates by sending the last update ID
        const lastUpdateId = data.result[data.result.length - 1].update_id;
        await fetch(`${TELEGRAM_API_URL}getUpdates?offset=${lastUpdateId + 1}`);
      }
    } catch (error) {
      console.error("Error fetching updates:", error.message);
    }
  }, 3000);
}

main().catch(console.error);


