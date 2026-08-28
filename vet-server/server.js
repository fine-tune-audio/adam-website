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

// industry-configs.js is an ES module living one directory up (repo root).
// require() can't load ESM directly, so it's loaded once via dynamic
// import() and cached — cheap since the file rarely changes at runtime.
let industriesCache = null;
async function loadIndustries() {
  if (!industriesCache) {
    const mod = await import('../industry-configs.js');
    industriesCache = mod.INDUSTRIES;
  }
  return industriesCache;
}

function stripJsonFence(text) {
  return text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
}

// Builds a per-industry system prompt from that industry's own dataCollection
// schema and red-flag list, so the JSON shape the model is asked for always
// matches the fields the frontend actually renders for the selected industry.
function buildSystemPrompt(industryCfg) {
  const fieldLines = industryCfg.dataCollection
    .map((f) => `  "${f.name}": string|null  // ${f.instruction}`)
    .join('\n');

  const redFlagRule = industryCfg.redFlags && industryCfg.redFlags.length
    ? `- Only escalate to an urgent/emergency status for genuine red flags explicitly present in the transcript: ${industryCfg.redFlags.join('; ')}. Do not escalate for anything else, and never infer urgency from tone alone.`
    : '- Only mark elevated urgency for a clearly stated emergency in the transcript, never from tone alone.';

  return `You are a front-desk assistant for a ${industryCfg.label.toLowerCase()} business, summarising a phone call transcript for staff.

Read the transcript and return ONLY valid JSON — no markdown code fence, no commentary — in exactly this shape:
{
${fieldLines}
}

Rules:
- Never invent a diagnosis, professional/technical assessment, or advice beyond what's appropriate for this industry.
${redFlagRule}
- Use null for any field the caller did not actually state. Do not fabricate names, numbers, addresses, or any other detail not present in the transcript.
- Any "summary"-type field is 2-3 neutral sentences for staff, describing what happened, not offering advice.
- Any "action"-type field describes what the assistant did or arranged, not advice.`;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/summarise', async (req, res) => {
  const { transcript, companyName, practiceName, useCases, industry } = req.body || {};
  const companyLabel = companyName || practiceName; // practiceName kept for backward compatibility

  if (!Array.isArray(transcript) || transcript.length === 0) {
    return res.status(400).json({ error: 'transcript (non-empty array) is required' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(200).json({ ok: false, fallback: true, error: 'Server is not configured with ANTHROPIC_API_KEY' });
  }

  let industryCfg;
  try {
    const industries = await loadIndustries();
    industryCfg = industries[industry] || industries.vet;
  } catch (err) {
    return res.status(200).json({ ok: false, fallback: true, error: 'Failed to load industry configuration', detail: err.message });
  }

  const systemPrompt = buildSystemPrompt(industryCfg);

  const transcriptText = transcript
    .map((turn) => `${turn.role === 'user' ? 'Caller' : 'Agent'}: ${turn.text}`)
    .join('\n');

  const userContent = [
    companyLabel ? `Company: ${companyLabel}` : null,
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
          system: systemPrompt,
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
