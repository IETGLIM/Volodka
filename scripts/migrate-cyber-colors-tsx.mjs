import fs from 'node:fs';
import path from 'node:path';

const replacements = [
  [/rgba\(0, 229, 255, /g, 'rgb(var(--cyber-cyan-rgb) / '],
  [/rgba\(34, 211, 238, /g, 'rgb(var(--cyber-cyan-rgb) / '],
  [/rgba\(34,211,238,/g, 'rgb(var(--cyber-cyan-rgb) / '],
  [/'#22d3ee'/g, "'var(--cyber-cyan)'"],
  [/"#22d3ee"/g, '"var(--cyber-cyan)"'],
  [/#22d3ee/g, 'var(--cyber-cyan)'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(full, files);
    } else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

const skipFiles = new Set([
  path.normalize('src/shared/constants/cyberPalette.ts'),
]);

for (const filePath of walk('src')) {
  if (skipFiles.has(path.normalize(filePath))) continue;
  const before = fs.readFileSync(filePath, 'utf8');
  if (!before.includes('22d3ee') && !before.includes('34, 211, 238') && !before.includes('34,211,238') && !before.includes('0, 229, 255')) {
    continue;
  }
  let after = before;
  for (const [pattern, value] of replacements) {
    after = after.replace(pattern, value);
  }
  if (after !== before) {
    fs.writeFileSync(filePath, after);
    console.log('updated', filePath);
  }
}
