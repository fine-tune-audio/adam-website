import test from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRIES } from '../industry-configs.js';
import { OVERLAYS, localizeIndustry } from '../locales/demo-industries.js';
import demo from '../locales/demo.js';

const tokens = (s) => (s.match(/\{\{\w+\}\}/g) || []).sort().join();

for (const lang of ['en', 'de']) {
  for (const [id, base] of Object.entries(INDUSTRIES)) {
    test(`${lang}/${id}: overlay lines up with the Dutch config`, () => {
      const x = localizeIndustry(base, lang);
      for (const k of ['setupOptions', 'useCases', 'scenarios', 'redFlags', 'dataCollection', 'sampleConversation']) {
        assert.equal(x[k].length, base[k].length, `${k} length`);
      }
      assert.deepEqual(x.dataCollection.map((d) => d.name), base.dataCollection.map((d) => d.name));
      assert.deepEqual(x.sampleConversation.map((t) => t.who), base.sampleConversation.map((t) => t.who));
      assert.equal(tokens(x.greeting), tokens(base.greeting));
      assert.equal(tokens(x.emailSubject), tokens(base.emailSubject));
      assert.notEqual(x.headline, base.headline);
      assert.equal(x.systemPrompt, base.systemPrompt, 'agent prompt is not touched');
    });
  }
}

test('Dutch is returned untouched', () => {
  assert.equal(localizeIndustry(INDUSTRIES.vet, 'nl'), INDUSTRIES.vet);
  assert.ok(OVERLAYS.en.vet && OVERLAYS.de.vet);
});

test('every demo.* key exists in nl, en and de with the same {placeholders}', () => {
  const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const key of Object.keys(demo.nl)) {
    for (const lang of ['en', 'de']) {
      assert.ok(demo[lang][key], `${lang} missing ${key}`);
      assert.equal(ph(demo[lang][key]), ph(demo.nl[key]), `${lang} placeholders differ for ${key}`);
    }
  }
});
