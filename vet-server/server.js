require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '1mb' }));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST']
}));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const LEADS_FILE = path.join(__dirname, 'leads.json');

const SYSTEM_PROMPT = `You are a veterinary front-desk assistant summarising a phone call transcript for the practice's staff.

Read the transcript and return ONLY valid JSON — no markdown code fence, no commentary — in exactly this shape:
{
  "caller_name": string|null,
  "caller_phone": string|null,
  "animal_name": string|null,
  "animal_species": string|null,
  "reason": string|null,
  "urgency": "normal"|"urgent",
  "action": string|null,
  "summary": string|null,
  "email_subject": string|null,
  "email_body": string|null
}

Rules:
- Never invent a diagnosis. You are not a vet and must not speculate about what is medically wrong with the animal.
- Never give treatment advice.
- Only mark "urgency" as "urgent" for genuine red flags explicitly present in the transcript: toxin/poison ingestion, difficulty breathing, collapse, major trauma, seizure, or bloat (distended abdomen). Otherwise use "normal".
- Use null for any field the caller did not actually state. Do not fabricate names, phone numbers, or any other detail not present in the transcript.
- "action" describes what the assistant did or arranged (e.g. "Booked next available appointment"), not medical guidance.
- "summary" is 1-3 sentences for practice staff.
- "email_subject" and "email_body" together form a short internal handoff email from the AI assistant to the practice team, written in a plain professional tone, based only on what's in the transcript.`;

function stripJsonFence(text) {
  return text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/summarise', async (req, res) => {
  const { transcript, practiceName, useCases } = req.body || {};

  if (!Array.isArray(transcript) || transcript.length === 0) {
    return res.status(400).json({ error: 'transcript (non-empty array) is required' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(200).json({ ok: false, fallback: true, error: 'Server is not configured with ANTHROPIC_API_KEY' });
  }

  const transcriptText = transcript
    .map((turn) => `${turn.role === 'user' ? 'Caller' : 'Agent'}: ${turn.text}`)
    .join('\n');

  const userContent = [
    practiceName ? `Practice: ${practiceName}` : null,
    Array.isArray(useCases) && useCases.length ? `Use cases this assistant handles: ${useCases.join(', ')}` : null,
    '',
    'Transcript:',
    transcriptText
  ].filter((line) => line !== null).join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }]
        }),
        signal: controller.signal
      });
    } catch (err) {
      return res.status(200).json({ ok: false, fallback: true, error: 'Failed to reach Anthropic API', detail: err.message });
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return res.status(200).json({ ok: false, fallback: true, error: `Anthropic API error (${response.status})`, detail });
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      return res.status(200).json({ ok: false, fallback: true, error: 'Anthropic API returned an unreadable response' });
    }

    const rawText = (data.content || []).map((block) => block.text || '').join('');
    const cleaned = stripJsonFence(rawText);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return res.status(200).json({ ok: false, fallback: true, error: 'Model did not return valid JSON', raw: rawText });
    }

    return res.status(200).json({ ok: true, result: parsed });
  } catch (err) {
    return res.status(200).json({ ok: false, fallback: true, error: 'Unexpected error while summarising', detail: err.message });
  } finally {
    clearTimeout(timer);
  }
});

app.post('/api/lead', (req, res) => {
  const entry = { ...(req.body || {}), receivedAt: new Date().toISOString() };

  let leads = [];
  try {
    if (fs.existsSync(LEADS_FILE)) {
      leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8') || '[]');
    }
  } catch {
    leads = [];
  }

  leads.push(entry);

  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save lead', detail: err.message });
  }

  res.json({ ok: true });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Catches malformed JSON bodies (from express.json()) and anything else that
// throws or calls next(err) — always responds, never lets an error escape
// as a raw stack trace or crash the process.
app.use((err, req, res, next) => {
  console.error('Unhandled request error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: 'Something went wrong. Please try again.' });
});

// A crashed server is worse than a logged error during a live demo — log
// and keep serving rather than letting the process go down.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Vet demo server listening on http://localhost:${PORT}`);
});
