import { applyRapierInitFix } from '../vite/rapierInitFix.ts';

const input = 'yield xA(Lg.toByteArray("AQID")").buffer);';
const output = applyRapierInitFix(input);
if (!output.includes('module_or_path')) {
  console.error('FAIL: patch missing module_or_path');
  process.exit(1);
}
console.log('applyRapierInitFix self-test OK');
