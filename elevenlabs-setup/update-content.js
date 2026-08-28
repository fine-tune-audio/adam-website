// Run with: node --env-file=.env update-content.js
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

if (!API_KEY || !AGENT_ID) {
  console.error('ELEVENLABS_API_KEY and AGENT_ID must be set (run with --env-file=.env)');
  process.exit(1);
}

const SYSTEM_PROMPT = `You are {{agent_name}}, the digital phone assistant for {{practice_name}}, a veterinary practice. You answer incoming calls so the practice team has fewer phone interruptions.

TONE: {{personality}}. Speak naturally and briefly, the way a warm receptionist would on the phone. Ask ONE question at a time. Never sound robotic.

WHAT YOU HELP WITH: {{use_cases}}. Typical tasks are booking, changing or cancelling appointments; giving opening hours; taking medication and repeat-prescription requests; logging test-result callback requests; answering general questions about the practice; and offering to connect the caller to a human when needed.

INFORMATION TO COLLECT during the call, naturally and without interrogating: the owner's name, a callback phone number, the pet's name, the species, the reason for calling, and what the caller would like to happen (appointment, callback, or information).

CONVERSATION RULES:
- Keep every reply short and conversational — this is spoken aloud.
- Ask only one question per turn.
- Never repeat information the caller has already given.
- Don't give long summaries in the middle of the call.
- Confirm the key details (name, phone number, pet name) once, near the end.
- If you don't know something specific to this practice, say the team will follow up — never invent hours, prices, or medical facts.

EMERGENCY HANDLING — SAFETY CRITICAL:
- Watch for red-flag signs: difficulty breathing, collapse or unresponsiveness, seizures, suspected poisoning or toxin ingestion (chocolate, grapes/raisins, lilies, antifreeze, xylitol, medication), major trauma, a bloated or distended abdomen, repeated unproductive retching, heavy bleeding, or inability to urinate.
- If you suspect an emergency: keep your questions brief and focused, tell the caller clearly that this may be urgent, and escalate immediately — offer to connect them to the practice now or direct them to the emergency line.
- NEVER give a diagnosis. NEVER give treatment or medication advice. NEVER tell someone to wait when the signs are serious.
- Do not present yourself as a replacement for a veterinarian.

CLOSING: confirm what happens next (for example, that someone from the practice will call them back on the number they gave), thank them warmly, and end the call.`;

const FIRST_MESSAGE = "Good afternoon, you're speaking with {{agent_name}}, the digital assistant of {{practice_name}}. How can I help you today?";

const DYNAMIC_VARIABLE_DEFAULTS = {
  practice_name: 'the veterinary practice',
  agent_name: 'Emma',
  use_cases: 'appointments, opening hours, and callbacks',
  personality: 'warm and reassuring',
  contact_name: '',
  practice_website: ''
};

// Tried in order; first one the API accepts wins. Empirical, since ElevenLabs'
// allowed-LLM list isn't reliably documented and changes.
const LLM_CANDIDATES = ['claude-sonnet-4-5', 'gpt-4o-mini', 'gpt-4o', 'gemini-2.5-flash'];

async function apiGet(urlPath) {
  const res = await fetch(`https://api.elevenlabs.io${urlPath}`, {
    headers: { 'xi-api-key': API_KEY }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${urlPath} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}

async function apiPatch(urlPath, body) {
  const res = await fetch(`https://api.elevenlabs.io${urlPath}`, {
    method: 'PATCH',
    headers: {
      'xi-api-key': API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

function pickVoices(voices) {
  const isEnglish = (v) => {
    const lang = (v.verified_languages || []).map((l) => l.language);
    return lang.includes('en') || (v.labels && v.labels.language === 'en') || !v.labels;
  };
  const premade = voices.filter((v) => v.category === 'premade');
  const pool = premade.length ? premade : voices;

  const female = pool.find((v) => (v.labels || {}).gender === 'female' && isEnglish(v)) || pool.find((v) => (v.labels || {}).gender === 'female');
  const male = pool.find((v) => (v.labels || {}).gender === 'male' && isEnglish(v)) || pool.find((v) => (v.labels || {}).gender === 'male');

  return { female, male };
}

async function main() {
  console.log('Fetching voices...');
  const voicesData = await apiGet('/v1/voices');
  const { female, male } = pickVoices(voicesData.voices || []);

  if (!female) throw new Error('No suitable female voice found in /v1/voices response');
  if (!male) console.warn('No suitable male voice found — female voice will be used as the only default for now');

  console.log('Chosen female voice:', female.voice_id, '-', female.name);
  if (male) console.log('Chosen male voice:  ', male.voice_id, '-', male.name);

  let chosenLlm = null;
  let lastErr = null;

  for (const candidate of LLM_CANDIDATES) {
    const body = {
      conversation_config: {
        agent: {
          prompt: {
            prompt: SYSTEM_PROMPT,
            llm: candidate
          },
          first_message: FIRST_MESSAGE,
          language: 'en',
          dynamic_variables: {
            dynamic_variable_placeholders: DYNAMIC_VARIABLE_DEFAULTS
          }
        },
        tts: {
          voice_id: female.voice_id
        }
      },
      // Deleting the workflow per explicit confirmation: this agent's node
      // graph hard-coded a different clinic's persona in each node's
      // additional_prompt, which would fire on top of the new base prompt.
      // Empty {nodes:{}} is rejected (min 1 node) and `null` is silently
      // ignored (confirmed empirically — re-GET still showed 4 nodes).
      // A start-only node with no edges is the minimal true no-op: nothing
      // routes anywhere, so the base prompt runs the whole call.
      workflow: {
        edges: {},
        nodes: {
          start_node: {
            type: 'start',
            position: { x: 0, y: 0 },
            edge_order: [],
            parent_subgraph_id: null
          }
        },
        subgraphs: {},
        prevent_subagent_loops: false
      }
    };

    console.log(`\nTrying llm="${candidate}"...`);
    const result = await apiPatch(`/v1/convai/agents/${AGENT_ID}`, body);

    if (result.ok) {
      chosenLlm = candidate;
      break;
    }

    console.warn(`  rejected (${result.status}): ${result.body.slice(0, 300)}`);
    lastErr = result;
  }

  if (!chosenLlm) {
    console.error('\nAll LLM candidates were rejected. Last error:', lastErr && lastErr.body);
    process.exit(1);
  }

  console.log(`\nPATCH succeeded with llm="${chosenLlm}"`);

  console.log('\nRe-fetching agent to confirm...');
  const updated = await apiGet(`/v1/convai/agents/${AGENT_ID}`);
  fs.writeFileSync(path.join(__dirname, 'current-agent.json'), JSON.stringify(updated, null, 2));

  const a = updated.conversation_config.agent;
  console.log('\n--- confirmed ---');
  console.log('prompt starts with:', a.prompt.prompt.slice(0, 60).replace(/\n/g, ' ') + '...');
  console.log('first_message:', a.first_message);
  console.log('language:', a.language);
  console.log('llm:', a.prompt.llm);
  console.log('voice_id:', updated.conversation_config.tts.voice_id);
  console.log('dynamic_variable_placeholders:', a.dynamic_variables.dynamic_variable_placeholders);
  console.log('workflow nodes:', Object.keys(updated.workflow.nodes || {}).length, '(0 expected — deleted)');

  console.log('\nMale voice for per-call override (note for Prompt C/frontend):', male ? `${male.voice_id} (${male.name})` : 'none found');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
