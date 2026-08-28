// Run with: node --env-file=.env update-access.js
//
// Security posture summary:
//   Current: public-by-agent-ID + hostname allowlist. The frontend embeds the
//   bare agent ID (vet-demo.html ships it to the browser), so anyone who
//   copies that ID can start a session UNLESS the request's Origin/hostname
//   is on this allowlist. Fine for a controlled demo pointed at known hosts.
//   Stronger option for production: set enable_auth:true, remove the
//   allowlist, and mint a per-session signed URL from a tiny backend route
//   (GET /v1/convai/conversation/get-signed-url?agent_id=...) instead of
//   connecting with the bare agent ID. That needs a new backend endpoint
//   (vet-server already has the shape for this) and a frontend change to
//   fetch the signed URL before calling startSession. Not done here because
//   enable_auth:true + an allowlist cannot be combined on the same agent —
//   pick one path deliberately, don't flip enable_auth on without removing
//   the allowlist and wiring the signed-url fetch first.
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

if (!API_KEY || !AGENT_ID) {
  console.error('ELEVENLABS_API_KEY and AGENT_ID must be set (run with --env-file=.env)');
  process.exit(1);
}

// Local dev hosts only for now — a literal placeholder string isn't a valid
// hostname and would either get rejected by the API or sit in a live
// allowlist as garbage. Add the real deployed demo domain to this array and
// re-run this script once you have it (or tell me the hostname and I will).
const ALLOWLIST = [
  { hostname: 'localhost:3000' },
  { hostname: 'localhost:5173' },
  { hostname: '127.0.0.1:5500' }
  // TODO: add your real deployed demo hostname here, e.g. { hostname: 'demo.adam-agents.com' }
];

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
  if (!res.ok) throw new Error(`PATCH ${urlPath} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}

async function main() {
  console.log('Reading current-agent.json to confirm paths before patching...');
  const current = JSON.parse(fs.readFileSync(path.join(__dirname, 'current-agent.json'), 'utf8'));

  const currentOverrides = current.platform_settings.overrides.conversation_config_override;
  console.log('Current overrides — agent.first_message:', currentOverrides.agent.first_message, '| tts.voice_id:', currentOverrides.tts.voice_id, '| conversation.text_only:', currentOverrides.conversation.text_only);

  const clientEvents = current.conversation_config.conversation.client_events;
  const hasUserTranscript = clientEvents.includes('user_transcript');
  const hasAgentResponse = clientEvents.includes('agent_response');
  console.log('Client events already include user_transcript:', hasUserTranscript, '| agent_response:', hasAgentResponse);
  if (hasUserTranscript && hasAgentResponse) {
    console.log('  -> nothing to change here, skipping that PATCH.');
  }

  console.log('\nPatching auth allowlist + overrides (first_message, voice_id)...');
  console.log('IMPORTANT: enable_auth stays false — do not combine with the allowlist.');

  const body = {
    platform_settings: {
      auth: {
        enable_auth: false,
        allowlist: ALLOWLIST
      },
      overrides: {
        conversation_config_override: {
          agent: {
            first_message: true
            // prompt override intentionally left OFF — personalization is
            // via dynamic variables, not by replacing the prompt.
          },
          tts: {
            voice_id: true
          }
          // conversation.text_only is already true — not resent.
        }
      }
    }
  };

  await apiPatch(`/v1/convai/agents/${AGENT_ID}`, body);
  console.log('PATCH succeeded.');

  console.log('\nRe-fetching agent to confirm...');
  const updated = await apiGet(`/v1/convai/agents/${AGENT_ID}`);
  fs.writeFileSync(path.join(__dirname, 'current-agent.json'), JSON.stringify(updated, null, 2));

  const ov = updated.platform_settings.overrides.conversation_config_override;
  console.log('\n--- confirmed ---');
  console.log('auth:', updated.platform_settings.auth);
  console.log('client_events:', updated.conversation_config.conversation.client_events);
  console.log('text_only override enabled:', ov.conversation.text_only);
  console.log('first_message override enabled:', ov.agent.first_message);
  console.log('voice_id override enabled:', ov.tts.voice_id);
  console.log('prompt override enabled (should be false):', ov.agent.prompt.prompt);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
