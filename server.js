// HealthFit24x7 — local backend
// Serves the frontend and proxies chat requests to the Groq API so the
// Groq API key never has to live in the browser.

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Simple health check the frontend uses to show whether the AI layer is
// configured, and to confirm the local server is actually reachable.
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.GROQ_API_KEY),
    defaultModel: DEFAULT_MODEL
  });
});

// Proxies a chat-completions request to Groq. The frontend sends the full
// `messages` array (system prompt + recent history + latest user message);
// this server just attaches the API key and forwards it.
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not set on the server. Add it to your .env file and restart the server.'
    });
  }

  const { messages, model } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'A non-empty "messages" array is required.' });
  }

  try {
    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      const message = (data && data.error && data.error.message) || `Groq API error (${groqRes.status})`;
      return res.status(groqRes.status).json({ error: message });
    }

    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!reply) {
      return res.status(502).json({ error: 'Groq returned an empty response.' });
    }

    res.json({ reply });
  } catch (err) {
    console.error('[HealthFit24x7] Groq request failed:', err);
    res.status(502).json({ error: 'Failed to reach the Groq API.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HealthFit24x7 is running at http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.log('Note: GROQ_API_KEY is not set — the app will use its built-in offline replies until you add one to .env.');
  }
});
