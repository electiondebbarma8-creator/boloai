const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const LIMIT = 5;
const DB = "./users.json";
const OWNER_KEY = process.env.OWNER_KEY;
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

function today() {
  return new Date().toISOString().split("T")[0];
}

// Home route
app.get("/", (req, res) => {
  res.send("🔥 BoloAI Server Running Successfully!");
});

// Voice generation route (dummy response)
app.post("/voice", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const { text, ownerKey } = req.body;

  const isOwner = ownerKey === OWNER_KEY;

  let users = JSON.parse(fs.readFileSync(DB));

  if (!users[ip]) {
    users[ip] = { count: 0, date: today() };
  }

  if (users[ip].date !== today()) {
    users[ip].count = 0;
    users[ip].date = today();
  }

  if (!isOwner && users[ip].count >= LIMIT) {
    return res.status(403).json({ error: "Daily limit finished 🚫" });
  }

  // Fake voice response (replace with ElevenLabs API call)
  const voiceFile = "voice.mp3";
  fs.writeFileSync(voiceFile, "Fake audio content");

  if (!isOwner) users[ip].count++;
  fs.writeFileSync(DB, JSON.stringify(users, null, 2));

  res.json({
    success: true,
    remaining: isOwner ? "Unlimited (OWNER)" : LIMIT - users[ip].count,
    voiceFile
  });
});

// Chat route
app.post("/chat", (req, res) => {
  const message = req.body.message;
  res.json({ reply: `🔥 BOT BOLA: ${message} — samajh gaya!` });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
