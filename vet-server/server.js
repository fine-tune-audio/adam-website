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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-5.4-mini'; // verified against GET /v1/models with the live key before use
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
    .map((f) => `  "${f.name}": string  // ${f.instruction}`)
    .join('\n');

  const urgencyField = industryCfg.dataCollection.find((f) => /urgency|priority/i.test(f.name));
  const redFlagRule = industryCfg.redFlags && industryCfg.redFlags.length
    ? `Only raise ${urgencyField ? `"${urgencyField.name}"` : 'urgency'} above its calmest/default value for genuine red flags explicitly present in the transcript: ${industryCfg.redFlags.join('; ')}. Everything else — including a completely ordinary booking, question, or request — MUST get the calmest/default value for that field. Never infer urgency from tone, hesitation, or filler words alone; only from an explicitly stated red-flag situation.`
    : `Only raise urgency for a clearly and explicitly stated emergency in the transcript. An ordinary request MUST get the calmest/default value. Never infer urgency from tone alone.`;

  return `You are extracting a structured summary of a phone call for a ${industryCfg.label.toLowerCase()} front desk.

Return ONLY valid JSON — no markdown code fence, no commentary — with exactly these keys:
{
${fieldLines}
  "summary": string
}

HARD RULES:
- "summary" MUST be a clean 2-3 sentence paraphrase, in your own words, of what the caller wanted and what was agreed. NEVER copy or closely echo the transcript verbatim. Strip filler ("um", "yeah", "you know") and disfluencies.
- ${redFlagRule}
- For any field the caller did not actually provide, return the literal string "Not specified" — do not guess, infer, or invent a plausible-sounding value.
- Never invent names, phone numbers, addresses, room numbers, or any other identifying detail not explicitly stated.
- Never invent a diagnosis, professional/technical assessment, or advice beyond what's appropriate for this industry.
- Any "action"-type field describes what was arranged or logged, not advice.`;
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

  if (!OPENAI_API_KEY) {
    return res.status(200).json({ ok: false, fallback: true, error: 'Server is not configured with OPENAI_API_KEY' });
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
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ]
        }),
        signal: controller.signal
      });
    } catch (err) {
      return res.status(200).json({ ok: false, fallback: true, error: 'Failed to reach OpenAI API', detail: err.message });
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return res.status(200).json({ ok: false, fallback: true, error: `OpenAI API error (${response.status})`, detail });
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      return res.status(200).json({ ok: false, fallback: true, error: 'OpenAI API returned an unreadable response' });
    }

    const rawText = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content || '' : '';
    const cleaned = stripJsonFence(rawText);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return res.status(200).json({ ok: false, fallback: true, error: 'Model did not return valid JSON', raw: rawText });
    }

    // The model mostly follows the "Not specified" instruction, but not
    // always (e.g. an empty string instead) — normalise deterministically
    // rather than trust it every time.
    Object.keys(parsed).forEach((key) => {
      if (key === 'summary') return;
      if (parsed[key] === null || parsed[key] === undefined || parsed[key] === '') {
        parsed[key] = 'Not specified';
      }
    });

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
