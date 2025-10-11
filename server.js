import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Pi API base URL (use Testnet for now)
const PI_API_BASE = "https://api.minepi.com/v2/payments";

// ✅ Approve Payment
app.post("/approve_payment", async (req, res) => {
  try {
    const { paymentId } = req.body;
    const response = await fetch(`${PI_API_BASE}/${paymentId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Approval failed" });
  }
});

// ✅ Complete Payment
app.post("/complete_payment", async (req, res) => {
  try {
    const { paymentId } = req.body;
    const response = await fetch(`${PI_API_BASE}/${paymentId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Completion failed" });
  }
});

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("Pi TestNet backend is running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
