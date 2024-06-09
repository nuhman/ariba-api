const express = require("express");
const xmlparser = require('express-xml-bodyparser');
const app = express();
const port = 3000;

// Configure the express-xml-bodyparser middleware
app.use(xmlparser());

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to the home page!");
});

// About route
app.get("/about", (req, res) => {
  res.send("This is the about page.");
});

// Contact route
app.post("/contact", (req, res) => {
  console.log("Hit");
  // Access the parsed XML data from req.body
  const cxml = req.body;
  // Process the cXML data
  console.log('Received cXML:', JSON.stringify(cxml, null, 2));
  res.send("Contact us at info@example.com");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
