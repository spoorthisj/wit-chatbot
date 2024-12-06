const express = require('express');
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Webhook route - Handle POST requests to /webhook
app.post('/webhook', (req, res) => {
  // Log the received payload to the console
  console.log('Webhook received:', req.body);
  
  // Respond to acknowledge the request
  res.status(200).send('Webhook received');
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});