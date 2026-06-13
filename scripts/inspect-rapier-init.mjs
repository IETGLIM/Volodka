import { readFileSync } from 'fs';

const code = readFileSync('node_modules/@dimforge/rapier3d-compat/rapier.mjs', 'utf8');
const marker = 'yield xA(Lg.toByteArray("';
const i = code.indexOf(marker);
const start = i + marker.length;
let j = start;
while (j < code.length && /[A-Za-z0-9+/=]/.test(code[j])) j++;
console.log('after b64 60 chars:', JSON.stringify(code.slice(j, j + 60)));
console.log('before init 30:', JSON.stringify(code.slice(Math.max(0, i - 30), i)));
console.log('full tail 120:', JSON.stringify(code.slice(j, j + 120)));
