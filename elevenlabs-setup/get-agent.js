// Run with: node --env-file=.env get-agent.js
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

if (!API_KEY || !AGENT_ID) {
  console.error('ELEVENLABS_API_KEY and AGENT_ID must be set (run with --env-file=.env)');
  process.exit(1);
}

async function main() {
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    headers: { 'xi-api-key': API_KEY }
  });

  const text = await res.text();

  if (!res.ok) {
    console.error(`GET failed (${res.status}):`, text);
    process.exit(1);
  }

  const data = JSON.parse(text);
  const outPath = path.join(__dirname, 'current-agent.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error('Request failed:', err.message);
  process.exit(1);
});
