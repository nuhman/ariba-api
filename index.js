const express = require("express");
const xmlparser = require("express-xml-bodyparser");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const app = express();
const axios = require("axios");
const port = 3000;

// Configure the express-xml-bodyparser middleware
app.use(xmlparser());
app.use(express.json());

// Set up EJS as the template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Set up express-ejs-layouts
app.use(expressLayouts);
app.set("layout", "layouts/layout");

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Sample product data (in a real application, this would come from a database)
const products = [
  {
    id: 1,
    name: "Threded Fittings",
    price: 19.99,
    image: "threaded_fittings.png",
  },
  {
    id: 2,
    name: "Hydraulic Spares",
    price: 29.99,
    image: "Hydraulic-cylinder-spares.png",
  },
  { id: 3, name: "Diary Pipe", price: 39.99, image: "dairy-pipe.png" },
];

// In-memory cart (in a real application, this would be stored in a database or session)
let cart = [];

let poomUrl = ""; // Store the POOM URL

let buyerCookie = "";

// Home route
app.get("/", (req, res) => {
  res.render("home", {
    title: "Global Intl Online Shopping Site",
    products: products,
  });
});

// About route
app.get("/about", (req, res) => {
  res.render("about", { title: "About Us" });
});

// Cart route
app.get("/cart", (req, res) => {
  res.render("cart", { title: "Shopping Cart", cart: cart });
});

app.post("/getdata", (req, res) => {
  res.json({ success: true, message: "Product added to cart" });
});

// Add to cart route
app.post("/addtocart", (req, res) => {
  console.log(req.body); // Log the entire body to see what's being received
  const productId = parseInt(req.body.productId);

  if (isNaN(productId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product ID" });
  }

  const product = products.find((p) => p.id === productId);

  if (product) {
    const cartItem = cart.find((item) => item.id === productId);
    if (cartItem) {
      cartItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    res.json({ success: true, message: "Product added to cart" });
  } else {
    res.status(404).json({ success: false, message: "Product not found" });
  }
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

  // Extract and store the POOM URL and buyer cookie
  if (
    req.body &&
    req.body.cxml &&
    req.body.cxml.request &&
    req.body.cxml.request[0] &&
    req.body.cxml.request[0].punchoutsetuprequest &&
    req.body.cxml.request[0].punchoutsetuprequest[0]
  ) {
    const punchoutSetupRequest =
      req.body.cxml.request[0].punchoutsetuprequest[0];

    if (
      punchoutSetupRequest.browserformpost &&
      punchoutSetupRequest.browserformpost[0] &&
      punchoutSetupRequest.browserformpost[0].url
    ) {
      poomUrl = punchoutSetupRequest.browserformpost[0].url[0];
    }

    if (punchoutSetupRequest.buyercookie) {
      buyerCookie = punchoutSetupRequest.buyercookie[0];
    }
  }

  console.log("Stored POOM URL:", poomUrl);
  console.log("Stored Buyer Cookie:", buyerCookie);

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

app.post("/checkout", async (req, res) => {
  if (!poomUrl) {
    return res
      .status(400)
      .json({ success: false, message: "POOM URL not available" });
  }

  // Generate cXML for cart items
  const cxml = generatePOOMcXML(cart);

  try {
    // Send the cXML to the POOM URL
    const response = await axios.post(poomUrl, cxml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });

    // Check the response from the POOM URL
    if (response.status === 200) {
      // Clear the cart after successful checkout
      cart = [];
      res.json({ success: true, message: "Checkout successful" });
    } else {
      res
        .status(response.status)
        .json({ success: false, message: "Checkout failed" });
    }
  } catch (error) {
    console.error("Error during checkout:", error);
    res
      .status(500)
      .json({ success: false, message: "An error occurred during checkout" });
  }
});

function generatePOOMcXML(cart) {
  let itemsXml = cart
    .map(
      (item) => `
    <ItemIn quantity="${item.quantity}">
      <ItemID>
        <SupplierPartID>${item.id}</SupplierPartID>
      </ItemID>
      <ItemDetail>
        <UnitPrice>
          <Money currency="USD">${item.price.toFixed(2)}</Money>
        </UnitPrice>
        <Description xml:lang="en">${item.name}</Description>
        <UnitOfMeasure>EA</UnitOfMeasure>
      </ItemDetail>
    </ItemIn>
  `
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd">
<cXML xml:lang="en-US" payloadID="${generatePayloadID()}" timestamp="${getCurrentTimestamp()}">
  <Header>
    <From>
      <Credential domain="NetworkID">
        <Identity>AN01000002779-T</Identity>
      </Credential>
    </From>
    <To>
      <Credential domain="NetworkID">
        <Identity>AN11032106721-T</Identity>
      </Credential>
    </To>
    <Sender>
      <Credential domain="AribaNetworkUserId">
        <Identity>sysadmin@ariba.com</Identity>
        <SharedSecret>p9LJ&lt;109c$</SharedSecret>
      </Credential>
      <UserAgent>CatalogTester</UserAgent>
    </Sender>
  </Header>
  <Message>
    <PunchOutOrderMessage>
      <BuyerCookie>${buyerCookie}</BuyerCookie>
      <PunchOutOrderMessageHeader operationAllowed="create">
        <Total>
          <Money currency="USD">${cart
            .reduce((total, item) => total + item.price * item.quantity, 0)
            .toFixed(2)}</Money>
        </Total>
      </PunchOutOrderMessageHeader>
      ${itemsXml}
    </PunchOutOrderMessage>
  </Message>
</cXML>`;
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
