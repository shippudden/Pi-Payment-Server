// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
const PiNetwork = require('pi-backend').default;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE = "https://api.minepi.com/v2/payments";

const pi = new PiNetwork(process.env.PI_API_KEY, process.env.PI_WALLET_SEED);

app.get("/", (_req, res) => res.send("🚀 Pi Payment Server is running!"));

app.post("/approve-payment", async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

    console.log("🔹 Approving U2A payment:", paymentId);

    const { data } = await axios.post(
      `${PI_API_BASE}/${paymentId}/approve`,
      {},
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Payment approved:", data);
    res.json({ success: true, status: "approved", paymentId });
  } catch (err) {
    console.error("❌ Approve error:", err?.response?.data || err.message);
    
    if (err.response?.status === 400 && err.response?.data?.message?.includes("already approved")) {
      console.log("✅ Payment was already approved");
      return res.json({ success: true, status: "already_approved", paymentId: req.body.paymentId });
    }

    res.status(500).json({ error: "Failed to approve payment", details: err.response?.data });
  }
});

app.post("/complete-payment", async (req, res) => {
  try {
    const { paymentId, txid } = req.body;
    if (!paymentId || !txid)
      return res.status(400).json({ error: "Missing paymentId or txid" });

    console.log("🔹 Completing U2A payment:", paymentId);

    const { data } = await axios.post(
      `${PI_API_BASE}/${paymentId}/complete`,
      { txid },
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Payment completed:", data);
    res.json({ success: true, status: "completed", data });
  } catch (err) {
    console.error("❌ Complete error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to complete payment" });
  }
});

app.post("/send-pi", async (req, res) => {
  try {
    let { uid, username, amount, memo } = req.body;
    const recipient = uid || username;
    
    if (!recipient || !amount)
      return res.status(400).json({ error: "Missing uid/username or amount" });

    amount = Number(amount);
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    console.log(`💸 Sending ${amount} Pi to user ${recipient}`);

    const incomplete = (await pi.getIncompleteServerPayments())?.incomplete_server_payments || [];
    if (incomplete.length) {
      console.log(`⚠ Found ${incomplete.length} incomplete payments, canceling...`);
      for (const p of incomplete) await pi.cancelPayment(p.identifier);
    }

    const paymentData = {
      amount,
      memo: memo || "Reward from Orbit",
      metadata: { type: "reward" },
      uid: recipient,
    };

    const paymentId = await pi.createPayment(paymentData);
    console.log("✅ Payment created:", paymentId);
    
    const txid = await pi.submitPayment(paymentId);
    console.log("✅ Payment submitted, txid:", txid);
    
    const completed = await pi.completePayment(paymentId, txid);
    console.log("✅ Payment completed:", completed);

    res.json({ success: true, data: completed });
  } catch (err) {
    console.error("❌ A2U error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to send Pi" });
  }
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);
