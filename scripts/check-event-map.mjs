import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, files);
    else if (/\.(tsx?)$/.test(e.name)) files.push(p);
  }
  return files;
}

const used = new Set();
const usageRe = /eventBus\.(?:emit|on|off)\(\s*['"]([^'"]+)['"]/g;
for (const file of walk('src')) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = usageRe.exec(text))) used.add(m[1]);
}

const defined = new Set();
const keyRe = /['"]([^'"]+)['"]\s*:/g;
for (const f of fs.readdirSync('src/engine/events').filter((x) => x.endsWith('Events.ts'))) {
  const text = fs.readFileSync(path.join('src/engine/events', f), 'utf8');
  let m;
  while ((m = keyRe.exec(text))) defined.add(m[1]);
}

const missing = [...used].filter((e) => !defined.has(e)).sort();
console.log(`Used: ${used.size}, Defined: ${defined.size}`);
console.log('Used but NOT defined:', missing.length ? missing : '(none)');
if (missing.length > 0) process.exit(1);
