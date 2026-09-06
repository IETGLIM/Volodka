#!/usr/bin/env node
/**
 * Генерация файловых ambient-лупов истории → public/sounds/ambient/*.ogg
 *
 * v4.15: story-ноды ссылаются на `ambientSound: 'sounds/ambient/<name>.ogg'`,
 * но ни файлов, ни папки не существовало — тотальный 404 («звук не работает,
 * слышно только эффекты нажатий» — репорт игрока). Кроме того /sounds/* не был
 * исключён в vercel.json rewrite → отдавался index.html даже при наличии файлов.
 *
 * Это ДЕТЕРМИНИРОВАННЫЙ синтез (ffmpeg, без внешних сэмплов): каждая дорожка —
 * 14-секундный бесшовный луп с фейдами по краям. Рецепты подобран по ключевым
 * словам имени (rain/wind/hum/static/water/fire/...). Файлы коммитятся в репо —
 * скрипт нужен для воспроизводимости и добавления новых дорожек.
 *
 * Использование: node scripts/generate-ambient-audio.mjs [--force]
 *   --force — перегенерировать даже существующие файлы.
 * Скрипт падает (exit 1), если в src/ есть ссылка на имя без рецепта.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'public', 'sounds', 'ambient');
const DUR = 14; // секунды на луп

const FORCE = process.argv.includes('--force');

/* ── Базовые цепочки ffmpeg (filter_complex) ──
 * Каждая начинается с источника (anoisesrc/sine) и заканчивается фейдами,
 * которые дописываются кодом (afade in/out). */
const R = {
  rain: 'anoisesrc=d=14:c=pink:a=0.85,highpass=f=420,lowpass=f=6500,tremolo=f=0.27:d=0.22,volume=0.75',
  rain_digital: 'anoisesrc=d=14:c=pink:a=0.7,highpass=f=900,lowpass=f=5200,tremolo=f=2.1:d=0.35,volume=0.6',
  wind: 'anoisesrc=d=14:c=pink:a=1.0,lowpass=f=560,tremolo=f=0.13:d=0.75,volume=0.9',
  wind_strong: 'anoisesrc=d=14:c=pink:a=1.0,lowpass=f=760,tremolo=f=0.22:d=0.9,volume=1.0',
  hum50: 'sine=f=50:d=14,volume=0.5,lowpass=f=180',
  hum55: 'sine=f=55:d=14,volume=0.45,lowpass=f=200',
  hum60: 'sine=f=60:d=14,volume=0.5,lowpass=f=220',
  hum120: 'sine=f=120:d=14,volume=0.4,lowpass=f=400,tremolo=f=0.5:d=0.2',
  hum50_noise: 'anoisesrc=d=14:c=brown:a=0.55,lowpass=f=160,volume=0.8',
  hum110_noise: 'sine=f=110:d=14,volume=0.35,lowpass=f=350,anoisesrc=d=14:c=brown:a=0.3,lowpass=f=200,volume=0.5',
  static: 'anoisesrc=d=14:c=white:a=0.5,bandpass=f=1500:w=900,tremolo=f=9:d=0.85,volume=0.55',
  static_soft: 'anoisesrc=d=14:c=white:a=0.32,bandpass=f=1200:w=700,tremolo=f=6:d=0.7,volume=0.45',
  static_low: 'anoisesrc=d=14:c=white:a=0.4,bandpass=f=900:w=500,lowpass=f=2800,tremolo=f=5:d=0.8,volume=0.5',
  water: 'anoisesrc=d=14:c=pink:a=0.75,lowpass=f=880,tremolo=f=0.6:d=0.5,volume=0.8',
  fire: 'anoisesrc=d=14:c=brown:a=0.95,lowpass=f=1300,tremolo=f=2.8:d=0.55,volume=0.85',
  whisper: 'anoisesrc=d=14:c=white:a=0.35,bandpass=f=3200:w=1600,tremolo=f=4.6:d=0.85,volume=0.45',
  crowd: 'anoisesrc=d=14:c=pink:a=0.6,lowpass=f=1100,tremolo=f=0.31:d=0.4,volume=0.7',
  march: 'anoisesrc=d=14:c=pink:a=0.65,lowpass=f=820,tremolo=f=1.7:d=0.55,volume=0.75',
  room_tone: 'anoisesrc=d=14:c=brown:a=0.4,lowpass=f=380,volume=0.7',
  room_warm: 'sine=f=110:d=14,volume=0.22,lowpass=f=320,anoisesrc=d=14:c=brown:a=0.32,lowpass=f=350,volume=0.6',
  rustle: 'anoisesrc=d=14:c=white:a=0.3,highpass=f=1300,tremolo=f=1.15:d=0.7,volume=0.5',
  creak: 'anoisesrc=d=14:c=brown:a=0.42,bandpass=f=520:w=300,tremolo=f=0.45:d=0.85,volume=0.55',
  alarm: 'sine=f=640:d=14,volume=0.32,tremolo=f=2.2:d=0.9,anoisesrc=d=14:c=white:a=0.14,bandpass=f=1800:w=800,volume=0.4',
  pulse: 'sine=f=220:d=14,volume=0.4,bandpass=f=440:w=300,tremolo=f=4:d=0.8',
  broadcast: 'anoisesrc=d=14:c=pink:a=0.55,bandpass=f=1100:w=700,lowpass=f=3000,tremolo=f=0.4:d=0.5,volume=0.6',
};

/** Имя файла (без папки/расширения) → рецепт. */
const SOUND_RECIPES = {
  backroom_hum: R.hum55,
  basement_hum: R.hum50_noise,
  bunker_hum: R.hum50,
  cafe_backroom: R.room_warm,
  cafe_evening_jazz: R.room_warm,
  cafe_jazz_quiet: R.room_warm,
  chk_campfire: R.fire,
  city_broadcast: R.broadcast,
  city_night_distant: R.crowd,
  corridor_alarm: R.alarm,
  crowd_march: R.march,
  digital_pulse: R.pulse,
  intercom_static: R.static_low,
  kitchen_evening: R.room_warm,
  library_basement: R.hum50_noise,
  library_hush: R.room_tone,
  library_whisper: R.whisper,
  office_night: R.hum120,
  paper_rustle: R.rustle,
  park_hum: R.crowd,
  park_morning: R.crowd,
  park_rain_digital: R.rain_digital,
  pier_water: R.water,
  radio_static: R.static,
  radio_static_clear: R.static_soft,
  rain_distant: R.rain,
  river_pier_night: R.water,
  rooftop_wind: R.wind_strong,
  room_hum_quiet: R.room_tone,
  room_morning: R.room_warm,
  room_sunset: R.room_warm,
  room_wardrobe_creak: R.creak,
  server_room: R.hum60,
  server_room_alarm: R.alarm,
  server_room_hum: R.hum60,
  street_morning: R.crowd,
  street_night_rain: R.rain,
  street_winter_wind: R.wind_strong,
  underground_hum: R.hum50_noise,
  vault_terminal_hum: R.hum120,
  winter_bridge: R.wind,
  winter_street: R.wind,
};

/** Собрать все имена `sounds/ambient/<name>.ogg`, на которые ссылается src/. */
function collectReferencedNames() {
  const names = new Set();
  const re = /sounds\/ambient\/([a-z0-9_]+)\.ogg/g;
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const src = readFileSync(full, 'utf8');
        for (const m of src.matchAll(re)) names.add(m[1]);
      }
    }
  };
  walk(SRC);
  return names;
}

function ffmpegGenerate(name, chain) {
  const fadeStart = DUR - 1;
  const full = `${chain},afade=t=in:d=1,afade=t=out:st=${fadeStart}:d=1,alimiter=limit=0.9`;
  const out = path.join(OUT_DIR, `${name}.ogg`);
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-filter_complex', full,
    '-t', String(DUR),
    '-ac', '1', '-ar', '44100',
    '-c:a', 'libvorbis', '-q:a', '3',
    out,
  ], { stdio: 'inherit' });
}

function main() {
  const referenced = collectReferencedNames();
  const missingRecipe = [...referenced].filter((n) => !(n in SOUND_RECIPES));
  if (missingRecipe.length > 0) {
    console.error(`generate-ambient-audio: в src/ есть ссылки без рецепта:\n  ${missingRecipe.join('\n  ')}`);
    process.exit(1);
  }
  const unreferenced = Object.keys(SOUND_RECIPES).filter((n) => !referenced.has(n));
  if (unreferenced.length > 0) {
    console.warn(`generate-ambient-audio: предупреждение — рецепты без ссылок в src/ (не генерируются): ${unreferenced.join(', ')}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  let created = 0;
  let skipped = 0;
  let bytes = 0;
  for (const name of referenced) {
    const out = path.join(OUT_DIR, `${name}.ogg`);
    if (!FORCE && existsSync(out)) {
      skipped += 1;
      bytes += statSync(out).size;
      continue;
    }
    ffmpegGenerate(name, SOUND_RECIPES[name]);
    created += 1;
    bytes += statSync(out).size;
  }
  console.log(`generate-ambient-audio: создано ${created}, уже было ${skipped}, итого ${(bytes / 1024 / 1024).toFixed(1)} MB → public/sounds/ambient/`);
}

main();
