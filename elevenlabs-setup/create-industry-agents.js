// Run with: node --env-file=.env create-industry-agents.js
//
// Creates (or, if already known, PATCHes) one ElevenLabs agent per industry
// in ../industry-configs.js, applying the same platform_settings we already
// applied to the vet agent (agent_1401m0z366vwfbebvka3kbevhpn2):
//   - auth.enable_auth=false + hostname allowlist
//   - client_events already include user_transcript/agent_response by default
//   - overrides: first_message + tts.voice_id enabled, prompt override OFF,
//     conversation.text_only enabled
//   - trust_context = "low"
//
// Idempotent: elevenlabs-setup/industry-agents.json is the source of truth
// for which industry maps to which agent_id. It is pre-seeded with the
// existing vet agent so this script PATCHes it (reusing the workflow
// cleanup + hardening already done) instead of creating a duplicate.
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY must be set (run with --env-file=.env)');
  process.exit(1);
}

const MAP_FILE = path.join(__dirname, 'industry-agents.json');
const VET_AGENT_ID = 'agent_1401m0z366vwfbebvka3kbevhpn2';
const FEMALE_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // "Sarah" — picked and confirmed working for the vet agent
const LLM = 'claude-sonnet-4-5'; // confirmed accepted when the vet agent was configured

// Both port-qualified AND bare-hostname entries: live testing found the
// websocket (text-mode) connection's allowlist check matches against the
// bare host, while the WebRTC (voice-mode) check accepted the port-qualified
// form — "Host localhost is not allowed" fired for text mode even though
// voice worked fine on the identical http://localhost:3000 origin.
const ALLOWLIST = [
  { hostname: 'localhost:3000' },
  { hostname: 'localhost:5173' },
  { hostname: '127.0.0.1:5500' },
  { hostname: 'localhost' },
  { hostname: '127.0.0.1' }
  // TODO: add the real deployed demo hostname here once known
];

function loadMap() {
  if (fs.existsSync(MAP_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8') || '{}');
    } catch {
      return {};
    }
  }
  return {};
}

function saveMap(map) {
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
}

async function apiGet(urlPath) {
  const res = await fetch(`https://api.elevenlabs.io${urlPath}`, {
    headers: { 'xi-api-key': API_KEY }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${urlPath} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}

async function apiPost(urlPath, body) {
  const res = await fetch(`https://api.elevenlabs.io${urlPath}`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${urlPath} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}

async function apiPatch(urlPath, body) {
  const res = await fetch(`https://api.elevenlabs.io${urlPath}`, {
    method: 'PATCH',
    headers: { 'xi-api-key': API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PATCH ${urlPath} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}

function dataCollectionPayload(fields) {
  const out = {};
  fields.forEach((f) => {
    out[f.name] = { type: f.type, description: f.instruction };
  });
  return out;
}

function conversationConfigFor(cfg) {
  return {
    agent: {
      prompt: {
        prompt: cfg.systemPrompt,
        llm: LLM
      },
      first_message: cfg.greeting,
      language: 'en',
      dynamic_variables: {
        dynamic_variable_placeholders: {
          company_name: cfg.label,
          agent_name: cfg.defaultAgentName,
          use_cases: cfg.useCases.map((u) => u.label).join(', '),
          personality: 'warm and reassuring',
          contact_name: '',
          website: ''
        }
      }
    },
    tts: {
      voice_id: FEMALE_VOICE_ID
    }
  };
}

function platformSettingsFor(cfg) {
  return {
    auth: {
      enable_auth: false,
      allowlist: ALLOWLIST
    },
    overrides: {
      conversation_config_override: {
        agent: {
          first_message: true
          // prompt override intentionally OFF — personalised via dynamic variables
        },
        tts: {
          voice_id: true
        },
        conversation: {
          text_only: true
        }
      }
    },
    data_collection: dataCollectionPayload(cfg.dataCollection),
    trust_context: 'low' // these serve untrusted external callers
  };
}

async function main() {
  const { INDUSTRIES, INDUSTRY_ORDER } = await import('../industry-configs.js');

  const map = loadMap();
  if (!map.vet) {
    map.vet = VET_AGENT_ID;
    saveMap(map);
    console.log('Seeded industry-agents.json with the existing vet agent id.');
  }

  for (const id of INDUSTRY_ORDER) {
    const cfg = INDUSTRIES[id];
    if (!cfg) continue;

    const body = {
      conversation_config: conversationConfigFor(cfg),
      platform_settings: platformSettingsFor(cfg)
    };

    try {
      if (map[id]) {
        console.log(`[${id}] existing agent ${map[id]} — patching...`);
        await apiPatch(`/v1/convai/agents/${map[id]}`, body);
        console.log(`[${id}] patched.`);
      } else {
        console.log(`[${id}] creating new agent "${cfg.label} — Demo"...`);
        const created = await apiPost('/v1/convai/agents/create', {
          name: `${cfg.label} — Demo`,
          ...body
        });
        const newId = created.agent_id;
        if (!newId) throw new Error('Create response had no agent_id: ' + JSON.stringify(created));
        map[id] = newId;
        saveMap(map);
        console.log(`[${id}] created ${newId}.`);
      }
    } catch (err) {
      console.error(`[${id}] FAILED: ${err.message}`);
    }
  }

  saveMap(map);
  console.log('\nFinal industry -> agent_id map:');
  console.log(JSON.stringify(map, null, 2));
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
