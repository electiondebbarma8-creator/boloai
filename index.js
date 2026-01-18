require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const axios = require("axios");

const app = express();
const PORT = 3000;

const LIMIT = 5;
const DB = "./users.json";
const OWNER_KEY = process.env.OWNER_KEY;
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.VOICE_ID;

app.use(cors());
app.use(express.json());

function today() { return new Date().toISOString().split("T")[0]; }

// Home
app.get("/", (req, res) => {
  res.send("🔥 BoloAI Server Running Successfully!");
});

// Voice route
app.post("/voice", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const { text, ownerKey } = req.body;
  const isOwner = ownerKey === OWNER_KEY;

  if (!text) return res.status(400).json({ error: "Text missing" });

  let users = await fs.readJson(DB).catch(() => ({}));
  if (!users[ip]) users[ip] = { count: 0, date: today() };
  if (users[ip].date !== today()) { users[ip].count = 0; users[ip].date = today(); }

  if (!isOwner && users[ip].count >= LIMIT) {
    return res.status(403).json({ error: "Daily limit finished 🚫" });
  }

  // ElevenLabs API call
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      { text },
      { 
        responseType: "arraybuffer",
        headers: { "xi-api-key": ELEVEN_API_KEY, "Content-Type": "application/json" }
      }
    );

    const fileName = `voice_${Date.now()}.mp3`;
    await fs.writeFile(fileName, response.data);

    if (!isOwner) users[ip].count++;
    await fs.writeJson(DB, users, { spaces: 2 });

    res.json({
      success: true,
      remaining: isOwner ? "Unlimited (OWNER)" : LIMIT - users[ip].count,
      voiceFile: fileName
    });

  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Voice generation failed 😢" });
  }
});

// Chat route
app.post("/chat", (req, res) => {
  const message = req.body.message;
  if (!message) return res.status(400).json({ error: "Message missing" });

  res.json({ reply: `🔥 BOT BOLA: ${message} — samajh gaya!` });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
