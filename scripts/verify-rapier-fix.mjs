import { readFileSync } from 'fs';
import { rapierInitFix } from '../vite/rapierInitFix.ts';

const code = readFileSync('node_modules/@dimforge/rapier3d-compat/rapier.mjs', 'utf8');
const plugin = rapierInitFix();
const result = plugin.transform(code, 'node_modules/@dimforge/rapier3d-compat/rapier.mjs');
if (!result?.code) {
  console.error('transform returned nothing');
  process.exit(1);
}

const idx = result.code.indexOf('yield xA({module_or_path:Lg.toByteArray("');
if (idx < 0) {
  console.error('fixed prefix missing');
  process.exit(1);
}

const start = idx + 'yield xA({module_or_path:Lg.toByteArray("'.length;
let end = start;
while (end < result.code.length && /[A-Za-z0-9+/=]/.test(result.code[end])) end++;
const after = result.code.slice(end, end + 30);
console.log('after b64:', JSON.stringify(after));
if (!after.startsWith('")}).buffer)}))}')) {
  console.error('bad suffix');
  process.exit(1);
}
console.log('rapier init fix OK');
