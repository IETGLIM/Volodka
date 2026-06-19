#!/usr/bin/env node
/**
 * Quaternius Ultimate Modular Men/Women packs → Volodka NPC pipeline.
 *
 * Source (CC0): https://quaternius.com/packs/ultimatemodularcharacters.html
 *               https://quaternius.com/packs/ultimatemodularwomen.html
 *
 * Workflow:
 *   npm run assets:quaternius-import -- --download
 *   npm run assets:quaternius-import -- --extract
 *   npm run assets:quaternius-import -- --import
 *   npm run assets:quaternius-import -- --all
 *   npm run assets:quaternius-import -- --status
 */

import { copyFileSync, createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { get as httpsGet } from 'node:https';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_NPCS = path.join(ROOT, 'assets-source/ai3dgen/npcs');
const PUBLIC = path.join(ROOT, 'public');

const QUATERNIUS = 'Quaternius Ultimate Modular Character Packs';
const QUATERNIUS_URL = 'https://quaternius.com/packs/ultimatemodularcharacters.html';

/** Google Drive glTF file IDs — Individual Characters/glTF folders. */
const MEN_GLTF = [
  { name: 'Adventurer', id: '1fzSq1Rr037f7QkfXPWEAzmbLMNx-FpPA' },
  { name: 'Beach', id: '1IL1YJPJvNkuGnKI69-W-VMBIDCo-u49N' },
  { name: 'Casual_2', id: '1Jn7kULNmrtqP8BUUL19h8MhbdOnwPFhv' },
  { name: 'Casual_Hoodie', id: '1em1So1xwwQNfHJYMvzKcXkZllvtxpKP5' },
  { name: 'Farmer', id: '1B9Dln-oR5Yk6sdsDR3yHCw86LobAN3Zd' },
  { name: 'King', id: '1LmjkaT-i9zOKYiQ0zyYsf9zXGTJ9edXr' },
  { name: 'Punk', id: '1yHWu5ezXq4dYBcn4sWiNd16YN9fMtXo0' },
  { name: 'Spacesuit', id: '1B6zZMmjGYzk38bIgv8a0hEodH2sgbKnw' },
  { name: 'Suit', id: '1NhXHnGU0zK9hBrT5FoZp8nTz_EmvTPg5' },
  { name: 'Swat', id: '1VGmU5f8a43NBT22JWB507NDSLbmNxzF9' },
  { name: 'Worker', id: '14d8n7IDnnlnGt_uiATnNg3uvi_4dyd9V' },
];

/** First 9 women (pack has 10; Worker omitted from normalized set). */
const WOMEN_GLTF = [
  { name: 'Adventurer', id: '1uxAFnDp73NO1c16LvHHjAYh1-deMNk5I' },
  { name: 'Casual', id: '18b3WwlrwrFYWAM7BcnjWeIxKJyxAQiGh' },
  { name: 'Formal', id: '1iayBzVv_zLjuPtaNPouw_auwKlQLLmes' },
  { name: 'Medieval', id: '17xT8FvSs2oGKVg28vRFf_8nwsM5nF2bG' },
  { name: 'Punk', id: '1ITb_iFiroAsmjQI38z_p6nNXinwliVLA' },
  { name: 'SciFi', id: '1xFu_hDnGu-U7HE3mfT0HbmPb-s2OuJGQ' },
  { name: 'Soldier', id: '13dP4UB24dlrzrOkCL2xQ2mlNO1T31bWP' },
  { name: 'Suit', id: '1GjWtofxjmPku25cXJxHrzLLeUbXw7A_s' },
  { name: 'Witch', id: '1fGbeo6SdjB9EWVSNKKOxoNKdmnK8hy3d' },
];

/**
 * Normalized source name → public GLB destination(s).
 * `npcId` wires npcModelRegistry + definition modelPath checks.
 */
export const NPC_QUATERNIUS_MAP = [
  {
    source: 'male_01.glb',
    npcId: 'volodka',
    publicPaths: [
      'models/characters/volodka/volodka_lod0.glb',
      'models/characters/volodka/volodka_lod1.glb',
      'models/characters/volodka/volodka_lod2.glb',
      'models/characters/volodka/volodka_lod0.draco.glb',
      'models/characters/volodka/volodka_lod0.meshopt.glb',
    ],
  },
  { source: 'male_02.glb', npcId: 'albert', publicPaths: ['models/npcs/albert.glb'] },
  { source: 'male_03.glb', npcId: 'office_dmitry', publicPaths: ['models/npcs/office_dmitry.glb'] },
  { source: 'male_04.glb', npcId: 'cafe_barista', publicPaths: ['models/npcs/cafe_barista.glb'] },
  { source: 'male_05.glb', npcId: 'office_alexander', publicPaths: ['models/npcs/office_alexander.glb'] },
  { source: 'male_06.glb', npcId: 'chk_ru', publicPaths: ['models/npcs/chk_ru.glb'] },
  { source: 'male_07.glb', npcId: 'chk_based', publicPaths: ['models/npcs/chk_based.glb'] },
  { source: 'male_08.glb', npcId: 'chk_stalker', publicPaths: ['models/npcs/chk_stalker.glb'] },
  { source: 'male_09.glb', npcId: 'maxim', publicPaths: ['models/npcs/maxim.glb'] },
  { source: 'male_10.glb', npcId: 'zeka', publicPaths: ['models/npcs/zeka.glb'] },
  { source: 'male_11.glb', npcId: 'fisherman_trofim', publicPaths: ['models/npcs/trofim.glb'] },
  { source: 'female_01.glb', npcId: 'zarema', publicPaths: ['models/npcs/zarema.glb'] },
  { source: 'female_02.glb', npcId: 'solnysh', publicPaths: ['models/npcs/solnysh.glb'] },
  { source: 'female_03.glb', npcId: 'maria', publicPaths: ['models/npcs/maria.glb'] },
  { source: 'female_04.glb', npcId: 'chk_smert', publicPaths: ['models/npcs/chk_smert.glb'] },
  { source: 'female_05.glb', npcId: 'chk_elis', publicPaths: ['models/npcs/chk_elis.glb'] },
  { source: 'female_06.glb', npcId: 'chk_ritka', publicPaths: ['models/npcs/chk_ritka.glb'] },
  { source: 'female_07.glb', npcId: 'anya', publicPaths: ['models/npcs/anya.glb'] },
  { source: 'female_08.glb', npcId: 'baba_zina', publicPaths: ['models/npcs/baba_zina.glb'] },
  { source: 'female_09.glb', npcId: 'kate', publicPaths: ['models/npcs/kate.glb'] },
  { source: 'male_10.glb', npcId: 'boris', publicPaths: ['models/npcs/boris.glb'] },
  { source: 'female_06.glb', npcId: 'kira', publicPaths: ['models/npcs/kira.glb'] },
  { source: 'female_07.glb', npcId: 'tamara', publicPaths: ['models/npcs/tamara.glb'] },
  { source: 'male_07.glb', npcId: 'office_colleague', publicPaths: ['models/npcs/office_colleague.glb'] },
];

function parseArgs(argv) {
  const args = { download: false, extract: false, import: false, all: false, status: false, help: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--download') args.download = true;
    else if (token === '--extract') args.extract = true;
    else if (token === '--import') args.import = true;
    else if (token === '--all') args.all = true;
    else if (token === '--status') args.status = true;
    else if (token === '--help' || token === '-h') args.help = true;
  }
  return args;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    mkdirSync(path.dirname(dest), { recursive: true });
    const file = createWriteStream(dest);
    httpsGet(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
        const redirect = response.headers.location;
        if (!redirect) {
          reject(new Error(`Redirect without location: ${url}`));
          return;
        }
        file.close();
        download(redirect, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

function driveUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function run(cmd, cmdArgs, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: true, cwd: ROOT });
  if (result.status !== 0) {
    throw new Error(`Failed: ${label}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadPack() {
  const rawDir = path.join(SOURCE_NPCS, '_quaternius_raw');
  mkdirSync(rawDir, { recursive: true });

  console.log('Downloading Quaternius men glTF…');
  for (let i = 0; i < MEN_GLTF.length; i += 1) {
    const entry = MEN_GLTF[i];
    const dest = path.join(rawDir, 'men', `${entry.name}.gltf`);
    if (existsSync(dest) && statSync(dest).size > 10_000) {
      console.log(`  ✓ exists men/${entry.name}.gltf`);
    } else {
      console.log(`  ↓ men/${entry.name}.gltf`);
      await download(driveUrl(entry.id), dest);
      await sleep(800);
    }
  }

  console.log('\nDownloading Quaternius women glTF…');
  for (let i = 0; i < WOMEN_GLTF.length; i += 1) {
    const entry = WOMEN_GLTF[i];
    const dest = path.join(rawDir, 'women', `${entry.name}.gltf`);
    if (existsSync(dest) && statSync(dest).size > 10_000) {
      console.log(`  ✓ exists women/${entry.name}.gltf`);
    } else {
      console.log(`  ↓ women/${entry.name}.gltf`);
      await download(driveUrl(entry.id), dest);
      await sleep(800);
    }
  }

  console.log('\n✓ Download complete → assets-source/ai3dgen/npcs/_quaternius_raw/');
}

function extractNormalizedGlbs() {
  const rawDir = path.join(SOURCE_NPCS, '_quaternius_raw');
  mkdirSync(SOURCE_NPCS, { recursive: true });

  for (let i = 0; i < MEN_GLTF.length; i += 1) {
    const entry = MEN_GLTF[i];
    const src = path.join(rawDir, 'men', `${entry.name}.gltf`);
    const dest = path.join(SOURCE_NPCS, `male_${String(i + 1).padStart(2, '0')}.glb`);
    if (!existsSync(src)) {
      throw new Error(`Missing raw glTF: ${path.relative(ROOT, src)} — run --download first`);
    }
    run('npx', ['-y', '@gltf-transform/cli', 'copy', src, dest], `male_${String(i + 1).padStart(2, '0')}.glb`);
  }

  for (let i = 0; i < WOMEN_GLTF.length; i += 1) {
    const entry = WOMEN_GLTF[i];
    const src = path.join(rawDir, 'women', `${entry.name}.gltf`);
    const dest = path.join(SOURCE_NPCS, `female_${String(i + 1).padStart(2, '0')}.glb`);
    if (!existsSync(src)) {
      throw new Error(`Missing raw glTF: ${path.relative(ROOT, src)} — run --download first`);
    }
    run('npx', ['-y', '@gltf-transform/cli', 'copy', src, dest], `female_${String(i + 1).padStart(2, '0')}.glb`);
  }

  console.log('\n✓ Normalized GLBs → assets-source/ai3dgen/npcs/male_*.glb, female_*.glb');
}

function importToPublic() {
  let copied = 0;
  for (const entry of NPC_QUATERNIUS_MAP) {
    const src = path.join(SOURCE_NPCS, entry.source);
    if (!existsSync(src)) {
      console.warn(`⚠ Skip ${entry.source} — not on disk`);
      continue;
    }
    for (const rel of entry.publicPaths) {
      const dest = path.join(PUBLIC, rel);
      mkdirSync(path.dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      copied += 1;
      console.log(`  ✓ ${entry.source} → public/${rel}`);
    }
  }
  console.log(`\n✓ Staged ${copied} public GLB path(s) from Quaternius sources`);
}

function printStatus() {
  console.log('Quaternius NPC pipeline status:\n');
  let sourceMb = 0;
  let publicMb = 0;
  let wired = 0;

  for (const entry of NPC_QUATERNIUS_MAP) {
    const src = path.join(SOURCE_NPCS, entry.source);
    const hasSource = existsSync(src);
    if (hasSource) sourceMb += statSync(src).size;
    const primary = entry.publicPaths[0];
    const pub = path.join(PUBLIC, primary);
    const hasPublic = existsSync(pub);
    if (hasPublic) publicMb += statSync(pub).size;
    if (hasSource && hasPublic) wired += 1;
    console.log(
      `${hasPublic ? '✓' : '·'} public  ${hasSource ? '✓' : '·'} source  ${entry.source.padEnd(14)} → ${entry.npcId ?? 'hero'}`,
    );
  }

  console.log(`\nWired: ${wired}/${NPC_QUATERNIUS_MAP.length}`);
  console.log(`Source total: ${(sourceMb / (1024 * 1024)).toFixed(1)} MB`);
  console.log(`Public primary paths: ${(publicMb / (1024 * 1024)).toFixed(1)} MB`);
}

function printHelp() {
  console.log(`
Quaternius import — Volodka RPG (CC0)

  npm run assets:quaternius-import -- --download
  npm run assets:quaternius-import -- --extract
  npm run assets:quaternius-import -- --import
  npm run assets:quaternius-import -- --all
  npm run assets:quaternius-import -- --status

Pack pages:
  ${QUATERNIUS_URL}
  https://quaternius.com/packs/ultimatemodularwomen.html

Manual fallback: see assets-source/ai3dgen/npcs/README.md
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (args.status) {
    printStatus();
    return;
  }
  if (!args.download && !args.extract && !args.import && !args.all) {
    printHelp();
    process.exit(1);
  }

  if (args.all || args.download) await downloadPack();
  if (args.all || args.extract) extractNormalizedGlbs();
  if (args.all || args.import) importToPublic();

  if (args.all || args.import) {
    console.log('\nNext: npm run assets:validate && npm run check');
  }
}

const isCliEntry =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCliEntry) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
