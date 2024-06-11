const express = require("express");
const xmlparser = require("express-xml-bodyparser");
const app = express();
const port = 3000;

// Configure the express-xml-bodyparser middleware
app.use(xmlparser());

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to Global Intl Online Shopping Site");
});

// About route
app.get("/about", (req, res) => {
  res.send("This is the about page.");
});

// Helper function to generate a unique payload ID
function generatePayloadID() {
  return Math.random().toString(36).substr(2, 9);
}

// Helper function to get the current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Contact route
app.post("/punchout", (req, res) => {
  console.log("Hit");
  // Access the parsed XML data from req.body
  const cxml = req.body;
  // Process the cXML data
  console.log("Received cXML:", JSON.stringify(cxml, null, 2));

  const response = `<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd">
    <cXML xml:lang="en-US" payloadID="${generatePayloadID()}" timestamp="${getCurrentTimestamp()}">
      <Response>
        <Status code="200" text="OK" />
        <PunchOutSetupResponse>
          <StartPage>
            <URL>https://ariba-api.onrender.com</URL>
          </StartPage>
        </PunchOutSetupResponse>
      </Response>
    </cXML>`;

  // Set the response headers
  res.set("Content-Type", "application/xml");

  // Send the response
  res.send(response);

  //res.send("Contact us at info@example.com");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
