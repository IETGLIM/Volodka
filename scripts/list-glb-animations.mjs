/**
 * Сканирует public/models-external/*.glb и печатает, у каких в JSON-чанке пустой массив `animations`.
 * Запуск: node scripts/list-glb-animations.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dir = path.join(root, 'public', 'models-external');

function parseGlbAnimations(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (buf.length < 20) return { error: 'too_small' };
  const magic = dv.getUint32(0, true);
  if (magic !== 0x46546c67) return { error: 'not_glb' };
  let o = 12;
  while (o + 8 <= buf.length) {
    const chunkLength = dv.getUint32(o, true);
    const chunkType = dv.getUint32(o + 4, true);
    const start = o + 8;
    const end = start + chunkLength;
    if (end > buf.length) return { error: 'truncated' };
    if (chunkType === 0x4e4f534a) {
      const jsonStr = buf.subarray(start, end).toString('utf8');
      try {
        const json = JSON.parse(jsonStr);
        const anims = json.animations;
        const count = Array.isArray(anims) ? anims.length : 0;
        const names = Array.isArray(anims)
          ? anims.map((a) => (a && a.name) || '(unnamed)')
          : [];
        return { count, names };
      } catch (e) {
        return { error: 'json_parse', detail: String(e) };
      }
    }
    o = end;
  }
  return { error: 'no_json_chunk' };
}

const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.glb')).sort();

const noAnim = [];
const withAnim = [];
const errors = [];

for (const f of files) {
  const p = path.join(dir, f);
  const buf = fs.readFileSync(p);
  const r = parseGlbAnimations(buf);
  if (r.error) {
    errors.push({ file: f, ...r });
    continue;
  }
  if (r.count === 0) noAnim.push(f);
  else withAnim.push({ file: f, count: r.count, names: r.names.slice(0, 12) });
}

console.log('=== GLB без клипов (animations пустой или отсутствует) ===');
console.log(noAnim.join('\n') || '(нет)');
console.log('\n=== С анимацией ===');
for (const x of withAnim) {
  const preview = x.names.length ? x.names.join(', ') : '(без имён у клипов)';
  console.log(`${x.file}  (${x.count}): ${preview}`);
}
if (errors.length) {
  console.log('\n=== Ошибки ===');
  console.log(JSON.stringify(errors, null, 2));
}
