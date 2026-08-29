// Run with: node --env-file=.env optimize-latency.js
//
// Tunes every agent in industry-agents.json for low conversational latency:
//   - fast LLM (tried empirically against the account's real allowed list —
//     not guessed) instead of the heavier default
//   - reasoning effort set to the lowest accepted value, if the model exposes it
//   - TTS model -> eleven_flash_v2_5 (confirmed via GET /v1/models — the
//     fastest realtime TTS model on the account)
//   - voice confirmed premade (not an Instant Voice Clone)
//   - backup/cascade LLM config left untouched (still enabled)
//   - a short brevity instruction appended to the system prompt (not editing
//     industry-configs.js itself — layered on at patch time, same pattern as
//     the earlier vet-agent setup)
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY must be set (run with --env-file=.env)');
  process.exit(1);
}

const MAP_FILE = path.join(__dirname, 'industry-agents.json');
// eleven_flash_v2_5 is listed in GET /v1/models but this account's English
// agents reject it: "English Agents must use turbo or flash v2" (confirmed
// via the live 400 body). eleven_flash_v2 is the fastest one actually
// allowed here, and it's what new agents already default to.
const TTS_MODEL = 'eleven_flash_v2';

// Tried in order against the FIRST agent only; whichever the API accepts is
// reused for the rest (allowed-model list is account-level, not per-agent).
const LLM_CANDIDATES = ['claude-haiku-4-5', 'gemini-2.5-flash', 'gpt-5-nano', 'gpt-4o-mini'];
// Tried only once we know the LLM was accepted, in order, on that same agent.
const REASONING_EFFORT_CANDIDATES = ['low', 'minimal', 0];

const BREVITY_SUFFIX = `

SPEED — this is a live phone call, not a chat window. Keep every spoken reply to 1-2 short sentences. Ask only one question per turn. Do not repeat or summarise back everything the caller just said — acknowledge briefly and move straight to the next step.`;

async function apiGet(urlPath) {
  const res = await fetch(`https://api.elevenlabs.io${urlPath}`, { headers: { 'xi-api-key': API_KEY } });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${urlPath} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}

async function apiPatch(urlPath, body) {
  const res = await fetch(`https://api.elevenlabs.io${urlPath}`, {
    method: 'PATCH',
    headers: { 'xi-api-key': API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function main() {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  const { INDUSTRIES } = await import('../industry-configs.js');

  let chosenLlm = null;
  let chosenReasoningEffort = null; // null means "not supported / left as default"
  const report = [];

  const entries = Object.entries(map);

  for (let i = 0; i < entries.length; i++) {
    const [industryId, agentId] = entries[i];
    const cfg = INDUSTRIES[industryId];
    if (!cfg) {
      console.warn(`[${industryId}] no matching industry-configs.js entry, skipping`);
      continue;
    }

    console.log(`\n[${industryId}] (${agentId})`);

    if (!chosenLlm) {
      for (const candidate of LLM_CANDIDATES) {
        const result = await apiPatch(`/v1/convai/agents/${agentId}`, {
          conversation_config: { agent: { prompt: { llm: candidate } } }
        });
        if (result.ok) {
          chosenLlm = candidate;
          console.log(`  LLM accepted: ${candidate}`);
          break;
        }
        console.log(`  LLM "${candidate}" rejected (${result.status})`);
      }
      if (!chosenLlm) {
        console.error('  No LLM candidate was accepted — aborting.');
        process.exit(1);
      }

      for (const candidate of REASONING_EFFORT_CANDIDATES) {
        const result = await apiPatch(`/v1/convai/agents/${agentId}`, {
          conversation_config: { agent: { prompt: { reasoning_effort: candidate } } }
        });
        if (result.ok) {
          chosenReasoningEffort = candidate;
          console.log(`  reasoning_effort accepted: ${JSON.stringify(candidate)}`);
          break;
        }
        console.log(`  reasoning_effort ${JSON.stringify(candidate)} rejected (${result.status})`);
      }
      if (chosenReasoningEffort === null) {
        console.log('  reasoning_effort: not supported by this model/account — left as default');
      }
    } else {
      await apiPatch(`/v1/convai/agents/${agentId}`, {
        conversation_config: { agent: { prompt: { llm: chosenLlm } } }
      });
      if (chosenReasoningEffort !== null) {
        await apiPatch(`/v1/convai/agents/${agentId}`, {
          conversation_config: { agent: { prompt: { reasoning_effort: chosenReasoningEffort } } }
        });
      }
      console.log(`  LLM set: ${chosenLlm}${chosenReasoningEffort !== null ? `, reasoning_effort: ${chosenReasoningEffort}` : ''}`);
    }

    const ttsResult = await apiPatch(`/v1/convai/agents/${agentId}`, {
      conversation_config: { tts: { model_id: TTS_MODEL } }
    });
    console.log(`  TTS model_id -> ${TTS_MODEL}: ${ttsResult.ok ? 'ok' : 'FAILED (' + ttsResult.status + ')'}`);

    const promptResult = await apiPatch(`/v1/convai/agents/${agentId}`, {
      conversation_config: { agent: { prompt: { prompt: cfg.systemPrompt + BREVITY_SUFFIX } } }
    });
    console.log(`  brevity suffix appended to prompt: ${promptResult.ok ? 'ok' : 'FAILED (' + promptResult.status + ')'}`);

    const after = await apiGet(`/v1/convai/agents/${agentId}`);
    const voice = await apiGet(`/v1/voices/${after.conversation_config.tts.voice_id}`).catch(() => null);
    const isPremade = voice ? voice.category === 'premade' : 'unknown';

    report.push({
      industry: industryId,
      agentId,
      llm: after.conversation_config.agent.prompt.llm,
      reasoning_effort: after.conversation_config.agent.prompt.reasoning_effort,
      tts_model: after.conversation_config.tts.model_id,
      voice_category: isPremade,
      backup_llm: after.conversation_config.agent.prompt.backup_llm_config
    });
  }

  console.log('\n\n================ FINAL REPORT ================');
  console.table(report);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
