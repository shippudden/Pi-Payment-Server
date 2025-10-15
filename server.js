// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
const PiNetwork = require('pi-backend').default;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ✅ Initialize Pi SDK with your API key and wallet seed
const pi = new PiNetwork(process.env.PI_API_KEY, process.env.PI_WALLET_SEED);

app.get("/", (_req, res) => res.send("🚀 Pi Payment Server is running!"));

// ✅ USER TO APP payment approval (U2A)
app.post("/approve-payment", async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

    console.log("🔹 Approving payment:", paymentId);
    const approved = await pi.approvePayment(paymentId);
    console.log("✅ Payment approved:", approved);

    res.json({ success: true, status: "approved", paymentId });
  } catch (err) {
    console.error("❌ Approve error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

// ✅ USER TO APP payment completion (U2A)
app.post("/complete-payment", async (req, res) => {
  try {
    const { paymentId, txid } = req.body;
    if (!paymentId || !txid)
      return res.status(400).json({ error: "Missing paymentId or txid" });

    console.log("🔹 Completing payment:", paymentId);
    const completed = await pi.completePayment(paymentId, txid);

    console.log("✅ Completed payment:", completed);
    res.json({ success: true, status: "completed", data: completed });
  } catch (err) {
    console.error("❌ Complete error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to complete payment" });
  }
});

// ✅ APP TO USER reward transfer (A2U)
app.post("/send-pi", async (req, res) => {
  try {
    const { uid, username, amount, memo } = req.body;
    const recipient = uid || username;
    if (!recipient || !amount)
      return res.status(400).json({ error: "Missing uid/username or amount" });

    console.log(`💸 Sending ${amount} Pi to user ${recipient}`);

    // Cancel any previous incomplete payments
    const incomplete = (await pi.getIncompleteServerPayments())
      ?.incomplete_server_payments || [];
    if (incomplete.length) {
      console.log(`⚠ Found ${incomplete.length} incomplete payments, canceling...`);
      for (const p of incomplete) await pi.cancelPayment(p.identifier);
    }

    // Create, submit and complete payment
    const paymentData = {
      amount,
      memo: memo || "Reward from Orbit",
      metadata: { type: "reward" },
      uid: recipient,
    };

    const paymentId = await pi.createPayment(paymentData);
    const txid = await pi.submitPayment(paymentId);
    const completed = await pi.completePayment(paymentId, txid);

    console.log("✅ Reward sent successfully:", completed);
    res.json({ success: true, data: completed });
  } catch (err) {
    console.error("❌ A2U error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to send Pi" });
  }
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);