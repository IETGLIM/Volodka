/**
 * One-time splitter: extracts src/app/globals.css into ordered modules under src/styles/.
 * Preserves line order exactly (no reordering). Run: node scripts/split-globals-css.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const globalsPath = join(root, 'src/app/globals.css');
const stylesDir = join(root, 'src/styles');

/** [filename, startLine, endLine] — 1-indexed, inclusive */
const MODULES = [
  ['tokens.css', 4, 87],
  ['base.css', 89, 120],
  ['game-keyframes.css', 122, 429],
  ['panel-animations.css', 430, 670],
  ['panel-cyberpunk.css', 671, 857],
  ['visual-polish.css', 858, 1075],
  ['inventory.css', 1076, 1234],
  ['photo-mode.css', 1235, 1375],
  ['menu-polish.css', 1376, 1686],
  ['menu-screen.css', 1687, 1760],
  ['skill-tree.css', 1761, 1881],
  ['hud-combat.css', 1882, 2100],
  ['hud-extensions.css', 2101, 2376],
  ['menu-cinematic.css', 2377, 2781],
  ['level-up.css', 2782, 2902],
  ['inventory-crafting.css', 2903, 3241],
  ['player-stats.css', 3242, 3322],
  ['compass-dialogue.css', 3323, 3444],
  ['combat-ui.css', 3445, 3523],
  ['micro-animations.css', 3524, 3782],
  ['menu-session8.css', 3783, 3952],
  ['weather-alerts.css', 3953, 4005],
  ['enhancements.css', 4006, 4233],
  ['toasts-loading.css', 4234, 4269],
  ['reduced-motion.css', 4270, 4316],
];

const lines = readFileSync(globalsPath, 'utf8').split(/\r?\n/);
mkdirSync(stylesDir, { recursive: true });

const importLines = ['@import "tailwindcss";', '@import "tw-animate-css";', ''];

for (const [file, start, end] of MODULES) {
  const slice = lines.slice(start - 1, end).join('\n').trimEnd();
  if (!slice) {
    console.warn(`skip empty ${file} (${start}-${end})`);
    continue;
  }
  writeFileSync(join(stylesDir, file), `${slice}\n`, 'utf8');
  importLines.push(`@import "../styles/${file}";`);
  console.log(`wrote ${file} (${end - start + 1} lines)`);
}

writeFileSync(
  globalsPath,
  `${importLines.join('\n')}\n`,
  'utf8',
);

console.log('\nUpdated src/app/globals.css with @import chain');
