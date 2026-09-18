# HealthFit24x7 — wellbeing chatbot (local frontend + backend)

A small wellbeing/self-care chatbot. It works fully offline out of the box
(rule-based replies), and can optionally use a Groq-hosted LLM for richer,
more natural replies once you add your own Groq API key to the backend.

## Project structure

```
even-keel-app/
├── server.js          Express backend — serves the frontend and proxies
│                       chat requests to Groq (keeps your API key private)
├── package.json
├── .env.example        Copy to .env and add your Groq key
└── public/
    └── index.html      The entire frontend (HTML/CSS/JS, no build step)
```

## Requirements

- [Node.js](https://nodejs.org) 18 or newer (for the built-in `fetch`)
- A free [Groq API key](https://console.groq.com/keys) — optional, only
  needed if you want AI-generated replies instead of the offline ones

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Then open `.env` and paste your Groq API key:

   ```
   GROQ_API_KEY=gsk_your_real_key_here
   ```

   You can leave `GROQ_MODEL` and `PORT` as-is, or change them.

3. Start the server:

   ```bash
   npm start
   ```

4. Open the app in your browser:

   ```
   http://localhost:3000
   ```

That's it — the frontend talks to `http://localhost:3000/api/chat`, which
is your own server, which talks to Groq using the key in `.env`.

## How it decides between AI and offline replies

- Every normal chat message is sent to the local backend first.
- If `GROQ_API_KEY` is set and Groq responds successfully, you get an
  AI-generated reply.
- If the server isn't running, has no key configured, or Groq returns an
  error, the app automatically falls back to its built-in rule-based
  replies — the chat never breaks, it just gets less nuanced.
- You can check this status anytime from the gear icon in the app (**AI
  settings → Check server status**).

## Safety behavior (always local, never sent to the AI)

Messages that match patterns associated with suicidal thoughts or
self-harm are detected **directly in the browser**, before anything is
sent to the backend or to Groq. In that case the app immediately shows a
crisis-support message (with hotline numbers) instead of calling the AI.
This is intentional — it keeps the safety response deterministic and not
dependent on model behavior. The same instruction is also included as a
backup in the AI's system prompt, in case wording slips past the local
pattern match.

## Notes

- This is a local dev setup, not a production deployment. There's no
  authentication, HTTPS, or rate limiting — don't expose `server.js`
  directly to the public internet as-is.
- Chat history, mood log, and journal entries are stored in the
  browser's `localStorage`, same as before — the backend doesn't store
  anything.
- To change the AI's persona/instructions, edit the `buildSystemPrompt()`
  function in `public/index.html`.
