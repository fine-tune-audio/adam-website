// Run with: node --env-file=.env verify.js
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

if (!API_KEY || !AGENT_ID) {
  console.error('ELEVENLABS_API_KEY and AGENT_ID must be set (run with --env-file=.env)');
  process.exit(1);
}

const DYNAMIC_VARIABLES = {
  practice_name: 'Dierenkliniek Haren',
  agent_name: 'Emma',
  use_cases: 'booking appointments, medication requests, callbacks',
  personality: 'warm and reassuring',
  contact_name: 'Test',
  practice_website: 'https://example.com'
};

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
    headers: {
      'xi-api-key': API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${urlPath} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}

function check(label, ok) {
  console.log(`  [${ok ? 'x' : ' '}] ${label}`);
  return ok;
}

async function runChecklist() {
  const a = await apiGet(`/v1/convai/agents/${AGENT_ID}`);
  const cc = a.conversation_config;
  const ov = a.platform_settings.overrides.conversation_config_override;
  const dv = cc.agent.dynamic_variables.dynamic_variable_placeholders;

  console.log('=== Config checklist ===');
  check('system prompt contains {{practice_name}} and {{agent_name}}', cc.agent.prompt.prompt.includes('{{practice_name}}') && cc.agent.prompt.prompt.includes('{{agent_name}}'));
  check('first message set', !!cc.agent.first_message);
  check('language = en', cc.agent.language === 'en');
  check('an LLM is set', !!cc.agent.prompt.llm);
  check('a default voice is set', !!cc.tts.voice_id);
  check('default values exist for all 6 dynamic variables', Object.keys(DYNAMIC_VARIABLES).every((k) => Object.prototype.hasOwnProperty.call(dv, k)));
  check('platform_settings.auth.allowlist has hostnames', a.platform_settings.auth.allowlist.length > 0);
  check('enable_auth is false', a.platform_settings.auth.enable_auth === false);
  check('client events include user_transcript', cc.conversation.client_events.includes('user_transcript'));
  check('client events include agent_response', cc.conversation.client_events.includes('agent_response'));
  check('text_only override enabled', ov.conversation.text_only === true);
  check('first_message override enabled', ov.agent.first_message === true);
  check('voice_id override enabled', ov.tts.voice_id === true);
  check('prompt override is OFF', ov.agent.prompt.prompt === false);
  const dataCollectionKeys = Object.keys(a.platform_settings.data_collection);
  check(`data-collection items defined (${dataCollectionKeys.join(', ')})`, ['caller_name', 'animal_name', 'reason', 'urgency', 'action', 'summary'].every((k) => dataCollectionKeys.includes(k)));
  check('workflow neutralized (no override_agent nodes)', Object.values(a.workflow.nodes || {}).every((n) => n.type !== 'override_agent'));
}

async function simulate(label, callerPersona, callerFirstMessage) {
  console.log(`\n=== Simulating: ${label} ===`);

  const body = {
    simulation_specification: {
      simulated_user_config: {
        first_message: callerFirstMessage,
        language: 'en',
        prompt: {
          prompt: callerPersona
        }
      },
      dynamic_variables: DYNAMIC_VARIABLES
    },
    new_turns_limit: 20
  };

  const result = await apiPost(`/v1/convai/agents/${AGENT_ID}/simulate-conversation`, body);
  const turns = result.simulated_conversation || [];

  turns.forEach((t) => {
    if (t.message) console.log(`  ${t.role === 'user' ? 'CALLER' : 'AGENT '}: ${t.message}`);
  });

  return turns;
}

async function main() {
  await runChecklist();

  const limpingTurns = await simulate(
    'limping dog (normal)',
    'You are a worried but calm pet owner named Sarah. Your dog Bella has been limping since this morning, mild, no visible wound. You want to book an appointment. Give your name, your dog\'s name and a phone number if asked. Do not mention any emergency red-flag symptoms.',
    "Hi, my dog has been limping since this morning."
  );

  const emergencyTurns = await simulate(
    'emergency (lily ingestion)',
    'You are a panicked pet owner. Your cat just ate part of a lily plant a few minutes ago. You are scared and want to know what to do right now.',
    "Please help, my cat just ate a lily and I don't know what to do!"
  );

  fs.writeFileSync(path.join(__dirname, 'simulation-limping.json'), JSON.stringify(limpingTurns, null, 2));
  fs.writeFileSync(path.join(__dirname, 'simulation-emergency.json'), JSON.stringify(emergencyTurns, null, 2));

  console.log('\nTranscripts written to simulation-limping.json and simulation-emergency.json for review.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
