// Run with: node --env-file=.env update-analysis.js
//
// Field shape confirmed empirically from the live GET — platform_settings.data_collection
// is a dict keyed by field name, not the array the original plan assumed:
//   { type, description, enum, is_system_provided, dynamic_variable,
//     allowed_values_dynamic_variable, constant_value, is_omitted, llm, llm_billed }
// `description` is what the model uses as its extraction instruction.
//
// Note for later: the agent also has platform_settings.analysis_items.data_collection,
// an array of references to opaque aitem_... IDs tied to the OLD field names
// below. This script prints that array before/after the PATCH so we can see
// empirically whether it's auto-synced to the inline dict or a separate
// resource that needs its own cleanup.
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

if (!API_KEY || !AGENT_ID) {
  console.error('ELEVENLABS_API_KEY and AGENT_ID must be set (run with --env-file=.env)');
  process.exit(1);
}

// Old "Happy Paws" placeholder fields — explicitly nulled to attempt removal.
// PATCH has proven to deep-merge and preserve anything not mentioned, so
// leaving these out would very likely leave them sitting alongside the new
// ones rather than being replaced.
const OLD_FIELDS_TO_REMOVE = [
  'owner_name',
  'pet_name',
  'inquiry_type',
  'appointment_date_time',
  'is_new_client',
  'phone_number'
];

const NEW_DATA_COLLECTION = {
  caller_name: {
    type: 'string',
    description: "The caller's name, exactly as they gave it during the call. Leave empty if they never gave a name — do not guess."
  },
  caller_phone: {
    type: 'string',
    description: 'The callback phone number the caller gave. Leave empty if not stated — do not guess or reuse a number from elsewhere in the transcript metadata.'
  },
  animal_name: {
    type: 'string',
    description: "The pet's name, if the caller gave one. Leave empty if not stated."
  },
  animal_species: {
    type: 'string',
    description: 'The type of animal, e.g. dog, cat, rabbit. Leave empty if not stated.'
  },
  reason: {
    type: 'string',
    description: "The caller's stated reason for calling, in one sentence, in their own terms."
  },
  urgency: {
    type: 'string',
    description: "Mark 'urgent' ONLY for genuine red-flag signs explicitly described by the caller: suspected toxin/poison ingestion, difficulty breathing, collapse, seizure, major trauma, or a bloated/distended abdomen. Otherwise 'normal'. Never infer urgency from tone alone, and never upgrade to urgent without an explicit red-flag symptom in the transcript.",
    enum: ['normal', 'urgent']
  },
  action: {
    type: 'string',
    description: 'What was arranged during the call, e.g. "appointment booked", "callback requested", "information given", "transferred to a human". Do not include medical advice or a diagnosis here.'
  },
  summary: {
    type: 'string',
    description: 'A neutral 2-3 sentence summary of the call for practice staff. Never state a diagnosis or recommend a treatment.'
  }
};

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
  const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'current-agent.json'), 'utf8'));
  console.log('Before — data_collection keys:', Object.keys(before.platform_settings.data_collection));
  console.log('Before — analysis_items.data_collection count:', (before.platform_settings.analysis_items.data_collection || []).length);

  // `null` for a dict entry is rejected by the API ("should be a valid
  // dictionary or instance of AnalysisProperty") — confirmed empirically.
  // There's no PATCH-level delete for individual data_collection keys, so
  // the 6 old fields are left in place; they're unused by the new prompt
  // and harmless, just not cleaned up.
  const dataCollectionPatch = { ...NEW_DATA_COLLECTION };

  console.log('\nPatching data_collection (adding 8 new fields — old fields cannot be removed via PATCH, see comment above)...');
  await apiPatch(`/v1/convai/agents/${AGENT_ID}`, {
    platform_settings: {
      data_collection: dataCollectionPatch
    }
  });
  console.log('PATCH succeeded.');

  console.log('\nRe-fetching agent to confirm...');
  const after = await apiGet(`/v1/convai/agents/${AGENT_ID}`);
  fs.writeFileSync(path.join(__dirname, 'current-agent.json'), JSON.stringify(after, null, 2));

  const afterKeys = Object.keys(after.platform_settings.data_collection);
  console.log('\n--- confirmed ---');
  console.log('data_collection keys now:', afterKeys);

  const newKeysPresent = Object.keys(NEW_DATA_COLLECTION).filter((k) => afterKeys.includes(k));
  const oldKeysStillPresent = OLD_FIELDS_TO_REMOVE.filter((k) => afterKeys.includes(k));
  console.log(`\nNew fields added (${newKeysPresent.length}/${Object.keys(NEW_DATA_COLLECTION).length}):`, newKeysPresent);
  if (oldKeysStillPresent.length) {
    console.log(`Old "Happy Paws" fields still present (PATCH has no per-key delete for this dict): ${oldKeysStillPresent.join(', ')}`);
    console.log('They are unused by the new prompt and harmless. Remove them in the ElevenLabs dashboard if you want the field list clean.');
  }

  console.log('\nanalysis_items.data_collection count after:', (after.platform_settings.analysis_items.data_collection || []).length);
  console.log('analysis_items.data_collection ids after:', (after.platform_settings.analysis_items.data_collection || []).map((i) => i.analysis_item_id));
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
