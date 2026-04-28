import { mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = process.cwd();
const artifactsDir = path.join(repoRoot, 'artifacts');
const outFile = path.join(artifactsDir, 'volodka-vercel-src.zip');

if (!existsSync(artifactsDir)) {
  mkdirSync(artifactsDir, { recursive: true });
}

const cmd = `git archive --format=zip --output="${outFile}" HEAD`;
execSync(cmd, { stdio: 'inherit' });

console.log(`\nCreated Vercel source archive: ${outFile}`);
