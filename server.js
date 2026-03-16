
import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

// dotenv.config({ path: "./config/.env" });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const SHOP = process.env.SHOP;
const TOKEN = process.env.ACCESS_TOKEN;

app.post("/register", async (req, res) => {

  try {

    const { name, email, phone, password } = req.body;
    console.log(req.body)

    const response = await axios.post(
      `https://${SHOP}/admin/api/2024-01/customers.json`,
      {
        customer: {
          first_name: name,
          email: email,
          phone: phone,
          verified_email: true,
          password: password,
          password_confirmation: password
        }
      },
      {
        headers: {
          "X-Shopify-Access-Token": TOKEN,
          "Content-Type": "application/json"
        }
      }
    );
        console.log(response)
    res.json({
      success: true,
      customer: response.data.customer
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });

  }

});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request received with email:', email);
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const response = await fetch(`https://${process.env.SHOP}/api/2026-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.STOREFRONT_TOKEN
      },
      body: JSON.stringify({
        query: `
          mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
            customerAccessTokenCreate(input: $input) {
              customerAccessToken {
                accessToken
                expiresAt
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: { input: { email, password } }
      })
    });

    const data = await response.json();



    if (!data.data || !data.data.customerAccessTokenCreate) {
      return res.status(500).json({
        error: 'Unexpected response from Shopify Storefront API',
        rawResponse: data
      });
    }

    const errors = data.data.customerAccessTokenCreate.userErrors;
    if (errors && errors.length > 0) {
      return res.status(401).json({ error: errors[0].message });
    }

    const token = data.data.customerAccessTokenCreate.customerAccessToken;

    return res.json({
      accessToken: token.accessToken,
      expiresAt: token.expiresAt
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on 3000`);
});
