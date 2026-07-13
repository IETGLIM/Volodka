#!/usr/bin/env node
/**
 * tsc7 — Wrapper that invokes TypeScript 7 (native Go port) via @typescript/native.
 *
 * In package.json we alias `typescript` → @typescript/typescript6 so that
 * typescript-eslint keeps working (it needs the TS6 Compiler API absent in TS7).
 * This script provides the fast TS7 tsc for type-checking and building.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsc7Bin = resolve(__dirname, '..', 'node_modules', '@typescript', 'native', 'bin', 'tsc');

try {
  execFileSync(tsc7Bin, process.argv.slice(2), {
    stdio: 'inherit',
    env: process.env,
  });
} catch (e) {
  // execFileSync throws on non-zero exit — just forward the exit code
  process.exitCode = e.status ?? 1;
}
