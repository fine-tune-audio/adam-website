import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export async function readDict(file) {
  try {
    const url = pathToFileURL(resolve(file)).href + `?t=${Date.now()}`;
    const m = await import(url);
    return { nl: m.default.nl || {}, en: m.default.en || {}, de: m.default.de || {} };
  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND') return { nl: {}, en: {}, de: {} };
    throw e;
  }
}

export function writeDict(file, dict) {
  const body = { nl: dict.nl, en: dict.en, de: dict.de };
  writeFileSync(file, `export default ${JSON.stringify(body, null, 2)};\n`);
}
