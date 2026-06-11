/* ============================================================
   STADSSTEMMEN — AUDIO-GENERATOR (losse plekken + horeca)

   Leest stadsstemmen-content.js en maakt per plek per taal een
   mp3 via de ElevenLabs Text-to-Speech API.
   Bestanden komen in: audio/spots/{id}_{taal}.mp3

   Gebruik:
     node genereer-audio.js                  alles (alleen wat nieuw of gewijzigd is)
     node genereer-audio.js --dry-run        toon wat er gegenereerd zou worden, zonder te genereren
     node genereer-audio.js --langs=nl,en    alleen deze talen
     node genereer-audio.js --spots=akerk    alleen deze plek(ken)
     node genereer-audio.js --force          alles opnieuw, ook ongewijzigde

   Vereist: Node.js 18 of hoger (vanwege ingebouwde fetch).
   ============================================================ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* ===== INSTELLINGEN: vul deze twee in ===== */
const API_KEY  = 'sk_94b084da0c59b0309442bf56a6a2c33d6e8e212498d1c8dc';
const VOICE_ID = '7S3KNdLDL7aRgBVRQb1z';

/* Model: 'eleven_multilingual_v2' = beste kwaliteit (±1 credit per teken)
          'eleven_flash_v2_5'      = sneller en ±de helft goedkoper        */
const MODEL  = 'eleven_multilingual_v2';
const FORMAT = 'mp3_44100_128';
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true };

const CONTENT_FILE = path.join(__dirname, 'stadsstemmen-content.js');
const OUT_DIR      = path.join(__dirname, 'audio', 'spots');
const MANIFEST     = path.join(__dirname, '.audio-manifest.json');

/* ===== CLI-opties ===== */
const args = process.argv.slice(2);
const has  = f => args.includes(f);
const opt  = n => { const a = args.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=')[1].split(',').map(s => s.trim()).filter(Boolean) : null; };
const DRY = has('--dry-run'), FORCE = has('--force');
const onlyLangs = opt('langs'), onlySpots = opt('spots');

/* ===== content.js inladen (browser-bestand, dus we geven het een nep-window mee) ===== */
const code = fs.readFileSync(CONTENT_FILE, 'utf8');
const w = {};
new Function('window', code)(w);
const C = w.STADSSTEMMEN_CONTENT;
if (!C) { console.error('Kon STADSSTEMMEN_CONTENT niet lezen uit stadsstemmen-content.js'); process.exit(1); }
const SPOTS = [...(C.sights || []), ...(C.horeca || [])];

/* ===== manifest: onthoudt wat al gegenereerd is (hash van tekst + stem + model) ===== */
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (_) {}
const hashOf = t => crypto.createHash('sha1').update([VOICE_ID, MODEL, t].join('|')).digest('hex');

/* ===== takenlijst opbouwen ===== */
const jobs = [];
for (const s of SPOTS) {
  if (onlySpots && !onlySpots.includes(s.id)) continue;
  for (const [lng, text] of Object.entries(s.desc || {})) {
    if (!text || !text.trim()) continue;
    if (onlyLangs && !onlyLangs.includes(lng)) continue;
    const key = s.id + '_' + lng;
    const file = path.join(OUT_DIR, key + '.mp3');
    const h = hashOf(text);
    if (!FORCE && manifest[key] === h && fs.existsSync(file)) continue; // ongewijzigd: overslaan
    jobs.push({ key, file, text, h });
  }
}

const chars = jobs.reduce((n, j) => n + j.text.length, 0);
console.log(`${jobs.length} fragment(en) te genereren, samen ~${chars} tekens.`);
console.log(`Model: ${MODEL} (let op: dit kost ongeveer evenveel credits als tekens bij multilingual_v2, de helft bij flash_v2_5).\n`);

if (DRY) { jobs.forEach(j => console.log('  ·', j.key, `(${j.text.length} tekens)`)); process.exit(0); }
if (!jobs.length) { console.log('Niets te doen: alles is al up-to-date.'); process.exit(0); }
if (!API_KEY || API_KEY.startsWith('PLAK')) { console.error('Vul eerst je API key in bovenin dit bestand.'); process.exit(1); }

fs.mkdirSync(OUT_DIR, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let ok = 0, fail = 0;
  for (const j of jobs) {
    process.stdout.write(`→ ${j.key} ... `);
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${FORMAT}`, {
        method: 'POST',
        headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: j.text, model_id: MODEL, voice_settings: VOICE_SETTINGS })
      });
      if (!res.ok) throw new Error(res.status + ' ' + (await res.text()).slice(0, 180));
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(j.file, buf);
      manifest[j.key] = j.h;
      fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
      ok++;
      console.log(`klaar (${Math.round(buf.length / 1024)} kB)`);
    } catch (e) {
      fail++;
      console.log('MISLUKT:', e.message);
    }
    await sleep(400); // rustig aan voor de rate limit
  }
  console.log(`\nKlaar: ${ok} gelukt, ${fail} mislukt. Bestanden staan in ${OUT_DIR}`);
  if (fail) console.log('Mislukte fragmenten worden bij de volgende run automatisch opnieuw geprobeerd.');
})();
