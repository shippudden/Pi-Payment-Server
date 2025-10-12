import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 5000;

const PI_API_KEY = process.env.PI_API_KEY;

const PI_API_BASE = "https://api.minepi.com/v2/payments";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("🚀 Pi Payment Server is running!"));

// ✅ Approve payment
app.post("/approve-payment", async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

    console.log("🔹 Approving payment:", paymentId);

    const { data: payment } = await axios.get(`${PI_API_BASE}/${paymentId}`, {
      headers: { Authorization: `Key ${PI_API_KEY}` },
    });

    console.log("Payment status:", payment.status);

    if (["approved", "completed"].includes(payment.status)) {
      return res.json({ status: `Already ${payment.status}` });
    }

    const { data: approved } = await axios.post(
      `${PI_API_BASE}/${paymentId}/approve`,
      {},
      { headers: { Authorization: `Key ${PI_API_KEY}` } }
    );

    console.log("✅ Approved payment:", approved);
    res.json({ status: "Payment approved" });
  } catch (err) {
    console.error("❌ Approve error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

// ✅ Complete payment
app.post("/complete-payment", async (req, res) => {
  try {
    const { paymentId, txid } = req.body;
    if (!paymentId || !txid)
      return res.status(400).json({ error: "Missing paymentId or txid" });

    console.log("🔹 Completing payment:", paymentId);

    const { data } = await axios.post(
      `${PI_API_BASE}/${paymentId}/complete`,
      { txid },
      { headers: { Authorization: `Key ${PI_API_KEY}` } }
    );

    console.log("✅ Completed payment:", data);
    res.json({ status: "Payment completed" });
  } catch (err) {
    console.error("❌ Complete error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to complete payment" });
  }
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);
