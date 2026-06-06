#!/usr/bin/env npx tsx
/**
 * Content pipeline validator — run before build/PR to catch broken cross-refs.
 * Usage: npm run validate
 */
import {
  validateContentPipeline,
  type ValidationIssue,
} from '../src/shared/validation/contentPipelineValidator.ts';

const report = validateContentPipeline();

if (report.issues.length === 0) {
  console.log('Content pipeline: OK (0 issues)');
  process.exit(0);
}

const byCategory = new Map<string, ValidationIssue[]>();
for (const i of report.issues) {
  const list = byCategory.get(i.category) ?? [];
  list.push(i);
  byCategory.set(i.category, list);
}

console.log('\nContent Pipeline Validation');
console.log('===========================');
console.log(`Errors:   ${report.errorCount}`);
console.log(`Warnings: ${report.warningCount}\n`);

for (const [category, issues] of [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`── ${category} (${issues.length}) ──`);
  for (const i of issues) {
    const tag = i.severity === 'error' ? 'ERROR' : 'WARN ';
    console.log(`  [${tag}] ${i.path}`);
    console.log(`         ${i.message}`);
  }
  console.log('');
}

process.exit(report.errorCount > 0 ? 1 : 0);
