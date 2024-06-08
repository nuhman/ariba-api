const express = require('express');
const app = express();
const port = 3000;

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to the home page!');
});

// About route
app.get('/about', (req, res) => {
  res.send('This is the about page.');
});

// Contact route
app.get('/contact', (req, res) => {
  res.send('Contact us at info@example.com');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});