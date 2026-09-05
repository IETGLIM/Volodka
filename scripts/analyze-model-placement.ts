/* ─── CLI wrapper: static model-placement audit (see placementAudit.ts) ───
 * Exit code: 0 = clean (MEDIUM warnings allowed), 1 = HIGH violations found.
 * Run: npx tsx --tsconfig tsconfig.json scripts/analyze-model-placement.ts
 */

import { runPlacementAudit } from '@/engine/scene/placementAudit';

const { checked, problems } = runPlacementAudit();
const HIGH = problems.filter((p) => p.severity === 'HIGH');
const MEDIUM = problems.filter((p) => p.severity === 'MEDIUM');
const LOW = problems.filter((p) => p.severity === 'LOW');

console.log(`Проверено размещений: ${checked}`);
console.log(`Нарушения: HIGH=${HIGH.length} MEDIUM=${MEDIUM.length} LOW=${LOW.length}`);

if (HIGH.length > 0) {
  console.log('\n── HIGH ──');
  for (const p of HIGH) console.log(`  [${p.scene}] ${p.text}`);
}
if (MEDIUM.length > 0) {
  console.log('\n── MEDIUM (допустимо: «вплотную к мебели») ──');
  for (const p of MEDIUM) console.log(`  [${p.scene}] ${p.text}`);
}
if (LOW.length > 0) {
  console.log('\n── LOW ──');
  for (const p of LOW) console.log(`  [${p.scene}] ${p.text}`);
}

process.exit(HIGH.length > 0 ? 1 : 0);
