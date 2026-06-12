import { readFileSync } from 'fs';
import { fixRapierInit } from '../vite/rapierInitFix.ts';

const raw = readFileSync('node_modules/@dimforge/rapier3d-compat/rapier.mjs', 'utf8');
const fixed = fixRapierInit(raw);
if (!fixed) {
  console.error('rapier init patch did not apply');
  process.exit(1);
}

const idx = fixed.indexOf('yield xA({module_or_path:Lg.toByteArray("');
if (idx < 0) {
  console.error('fixed prefix missing');
  process.exit(1);
}

const start = idx + 'yield xA({module_or_path:Lg.toByteArray("'.length;
let end = start;
while (end < fixed.length && /[A-Za-z0-9+/=]/.test(fixed[end])) end++;
const after = fixed.slice(end, end + 30);
console.log('after b64:', JSON.stringify(after));
if (!after.startsWith('")}).buffer)}))}')) {
  console.error('bad suffix');
  process.exit(1);
}
console.log('rapier init fix OK');
