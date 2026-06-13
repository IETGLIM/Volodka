import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const root = join('src', 'store');
const w = (rel, content) => { writeFileSync(join(root, rel), content, 'utf8'); console.log('wrote', rel); };
const patch = (rel, pairs) => {
  let s = readFileSync(join(root, rel), 'utf8');
  for (const [from, to] of pairs) s = s.split(from).join(to);
  writeFileSync(join(root, rel), s, 'utf8');
  console.log('patched', rel);
};

w('reduceGameState.ts', readFileSync('scripts/reduceGameState.ts.template', 'utf8').catch?.() ?? '');

NODEEOF
