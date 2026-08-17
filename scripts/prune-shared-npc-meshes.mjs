#!/usr/bin/env node
/**
 * Delete redundant NPC GLB copies that share a canonical mesh (npcMeshShare).
 * Only deletes when the alias file is byte-identical to the canonical (or missing).
 *
 * Usage: node scripts/prune-shared-npc-meshes.mjs [--dry-run]
 */
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NPCS = path.join(ROOT, 'public', 'models', 'npcs');
const dryRun = process.argv.includes('--dry-run');

/** Keep in sync with src/config/npcMeshShare.ts */
const NPC_MESH_FILE_SHARE = {
  office_colleague: 'chk_based',
  viktor: 'chk_based',
  boris: 'zeka',
  tamara: 'anya',
  grisha: 'office_alexander',
  kira: 'chk_ritka',
};

const SUFFIXES = ['.glb', '_lod1.glb', '_lod2.glb', '.draco.glb', '.meshopt.glb'];

function md5File(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('md5');
    const stream = createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

let removed = 0;
let bytes = 0;
let skipped = 0;

for (const [alias, canonical] of Object.entries(NPC_MESH_FILE_SHARE)) {
  for (const suffix of SUFFIXES) {
    const aliasPath = path.join(NPCS, `${alias}${suffix}`);
    const canonPath = path.join(NPCS, `${canonical}${suffix}`);
    if (!existsSync(aliasPath)) continue;

    if (!existsSync(canonPath)) {
      console.warn(`⚠ keep ${alias}${suffix} — canonical ${canonical}${suffix} missing`);
      skipped += 1;
      continue;
    }

    const [aHash, cHash] = await Promise.all([md5File(aliasPath), md5File(canonPath)]);
    if (aHash !== cHash) {
      console.warn(`⚠ keep ${alias}${suffix} — MD5 differs from ${canonical}${suffix}`);
      skipped += 1;
      continue;
    }

    const size = statSync(aliasPath).size;
    console.log(`${dryRun ? '○ would remove' : '⊘ remove'} models/npcs/${alias}${suffix} (${(size / 1024).toFixed(0)} KB)`);
    if (!dryRun) rmSync(aliasPath, { force: true });
    removed += 1;
    bytes += size;
  }
}

// Also sweep any leftover alias-named files not in SUFFIXES list
if (existsSync(NPCS)) {
  for (const alias of Object.keys(NPC_MESH_FILE_SHARE)) {
    for (const name of readdirSync(NPCS)) {
      if (!name.startsWith(alias)) continue;
      if (SUFFIXES.some((s) => name === `${alias}${s}`)) continue;
      // unexpected variant — leave it
    }
  }
}

console.log(
  `\n${dryRun ? 'Dry-run: ' : ''}removed ${removed} files (${(bytes / (1024 * 1024)).toFixed(2)} MB)` +
    (skipped ? `, skipped ${skipped}` : ''),
);
