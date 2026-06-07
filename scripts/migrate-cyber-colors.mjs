import fs from 'node:fs';
import path from 'node:path';

const stylesDir = path.join('src', 'styles');
const skip = new Set(['tokens.css']);

const replacements = [
  [/rgba\(0, 229, 255, /g, 'rgb(var(--cyber-cyan-rgb) / '],
  [/rgba\(34, 211, 238, /g, 'rgb(var(--cyber-cyan-rgb) / '],
  [/rgba\(34,211,238,/g, 'rgb(var(--cyber-cyan-rgb) / '],
  [/rgba\(0, 255, 100, /g, 'rgb(var(--cyber-matrix-rgb) / '],
  [/#22d3ee/gi, 'var(--cyber-cyan)'],
];

for (const file of fs.readdirSync(stylesDir)) {
  if (!file.endsWith('.css') || skip.has(file)) continue;
  const filePath = path.join(stylesDir, file);
  const before = fs.readFileSync(filePath, 'utf8');
  let after = before;
  for (const [pattern, value] of replacements) {
    after = after.replace(pattern, value);
  }
  if (after !== before) {
    fs.writeFileSync(filePath, after);
    console.log('updated', file);
  }
}
