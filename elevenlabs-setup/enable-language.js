// Lets the demo's voice agents follow the visitor's language (Dutch, English or German).
//
//   node --env-file=.env enable-language.js            DRY RUN: shows what would change, writes nothing
//   node --env-file=.env enable-language.js --apply    patches the live agents
//
// What it changes on each industry agent (ids from industry-agents.json):
//   1. platform_settings.overrides.conversation_config_override.agent.language -> true
//      (the demo then sends the visitor's language when the call starts)
//   2. the prompt's fixed "reply in Dutch" paragraph -> "reply in {{language_name}}"
//   3. dynamic variable placeholder language_name = "Dutch" (what a call without the variable gets)
//
// The agents' default language stays Dutch, so a call that sends nothing behaves exactly as before.
// After --apply, set VOICE_LANGUAGE_OVERRIDES = true in demo.html so the page starts sending the language.
// Voices: Sarah and Eric on a multilingual ElevenLabs model cover Dutch, English and German; listen to one call
// per language after applying.
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const APPLY = process.argv.includes('--apply');
if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY must be set (run with --env-file=.env)');
  process.exit(1);
}

const AGENTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'industry-agents.json'), 'utf8'));

const NEW_DIRECTIVE = `

LANGUAGE: Conduct this entire conversation in {{language_name}}. The caller speaks {{language_name}} — always reply in {{language_name}}, regardless of the language these instructions are written in. Keep names, addresses and phone numbers exactly as the caller says them.`;

// The Dutch directive appended to every systemPrompt in industry-configs.js (always the last paragraph).
const OLD_DIRECTIVE = /\n\nLANGUAGE: Conduct this entire conversation in Dutch[\s\S]*$/;

async function api(method, urlPath, body) {
  const res = await fetch(`https://api.elevenlabs.io${urlPath}`, {
    method,
    headers: { 'xi-api-key': API_KEY, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${urlPath} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}

async function main() {
  console.log(APPLY ? 'APPLY: patching live agents\n' : 'DRY RUN: nothing is written (add --apply to patch)\n');
  for (const [industry, agentId] of Object.entries(AGENTS)) {
    const agent = await api('GET', `/v1/convai/agents/${agentId}`);
    const cc = agent.conversation_config;
    const prompt = cc.agent.prompt.prompt || '';
    const overrides = agent.platform_settings.overrides.conversation_config_override;
    const placeholders = (cc.agent.dynamic_variables && cc.agent.dynamic_variables.dynamic_variable_placeholders) || {};

    const hasOld = OLD_DIRECTIVE.test(prompt);
    const alreadyNew = prompt.includes('{{language_name}}');
    const newPrompt = hasOld ? prompt.replace(OLD_DIRECTIVE, NEW_DIRECTIVE) : prompt;

    console.log(`== ${industry} (${agentId}) — agent language: ${cc.agent.language}, tts model: ${cc.tts.model_id}`);
    console.log(`   language override enabled: ${overrides.agent.language}  -> true`);
    console.log(`   prompt: ${hasOld ? 'Dutch directive found, will be replaced' : alreadyNew ? 'already uses {{language_name}}' : 'WARNING: Dutch directive not found, prompt left untouched'}`);
    console.log(`   placeholder language_name: ${placeholders.language_name || '(none)'}  -> Dutch`);
    if (hasOld) console.log(`   prompt tail now: ...${JSON.stringify(newPrompt.slice(-220))}`);

    if (!APPLY) continue;
    const body = {
      conversation_config: {
        agent: {
          dynamic_variables: { dynamic_variable_placeholders: { ...placeholders, language_name: 'Dutch' } },
          ...(hasOld ? { prompt: { prompt: newPrompt } } : {})
        }
      },
      platform_settings: {
        overrides: { conversation_config_override: { agent: { language: true } } }
      }
    };
    await api('PATCH', `/v1/convai/agents/${agentId}`, body);
    const after = await api('GET', `/v1/convai/agents/${agentId}`);
    console.log(`   confirmed: language override = ${after.platform_settings.overrides.conversation_config_override.agent.language}, prompt has {{language_name}} = ${after.conversation_config.agent.prompt.prompt.includes('{{language_name}}')}`);
  }
  console.log(APPLY ? '\nDone. Now set VOICE_LANGUAGE_OVERRIDES = true in demo.html.' : '\nDry run finished. Re-run with --apply to patch.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
