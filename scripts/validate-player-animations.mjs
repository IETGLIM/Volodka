#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const GLB_MAGIC = 0x46546c67; // 'glTF' in little-endian
const GLB_JSON_CHUNK = 0x4e4f534a; // 'JSON'

const REQUIRED = ['Idle', 'Walk'];

/** Совпадает с `DEFAULT_PLAYER_GLB_PUBLIC_PATH` в `modelUrls.ts`; иначе fallback на `models-external`. */
function resolveDefaultPlayerGlbRelative() {
  const cwd = process.cwd();
  const root = resolve(cwd, 'public/lowpoly_anime_character_cyberstyle.glb');
  const ext = resolve(cwd, 'public/models-external/lowpoly_anime_character_cyberstyle.glb');
  if (existsSync(root)) return 'public/lowpoly_anime_character_cyberstyle.glb';
  if (existsSync(ext)) return 'public/models-external/lowpoly_anime_character_cyberstyle.glb';
  return 'public/lowpoly_anime_character_cyberstyle.glb';
}

function getGlbJson(buffer) {
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error('Not a GLB file');
  }

  let offset = 12;
  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkType === GLB_JSON_CHUNK) {
      const jsonBytes = buffer.slice(chunkStart, chunkStart + chunkLength);
      return JSON.parse(jsonBytes.toString('utf-8'));
    }

    offset = chunkStart + chunkLength;
  }

  throw new Error('JSON chunk not found in GLB');
}

function hasAnimationName(animationNames, requiredName) {
  const needle = requiredName.toLowerCase();
  return animationNames.some((name) => name.toLowerCase().includes(needle));
}

function checkPlayerAnimations(relativePath) {
  const fullPath = resolve(process.cwd(), relativePath);
  const buffer = readFileSync(fullPath);
  const gltf = getGlbJson(buffer);
  const animationNames = (gltf.animations || []).map((animation) => animation.name || '');
  const missing = REQUIRED.filter((name) => !hasAnimationName(animationNames, name));
  return { relativePath, animationNames, missing };
}

function validate() {
  const explicit = process.argv[2];
  if (explicit) {
    const { relativePath, animationNames, missing } = checkPlayerAnimations(explicit);
    if (missing.length) {
      console.error(`Missing animations in ${relativePath}: ${missing.join(', ')}`);
      console.error(`Available animations: ${animationNames.join(', ') || '<none>'}`);
      process.exit(1);
    }
    console.log(`Player animations OK: ${animationNames.join(', ')}`);
    return;
  }

  const primary = resolveDefaultPlayerGlbRelative();
  let { relativePath, animationNames, missing } = checkPlayerAnimations(primary);

  if (!missing.length) {
    console.log(`Player animations OK: ${animationNames.join(', ')} (${relativePath})`);
    return;
  }

  const isPublicPrimary = relativePath === 'public/lowpoly_anime_character_cyberstyle.glb';
  const extRel = 'public/models-external/lowpoly_anime_character_cyberstyle.glb';
  const extFull = resolve(process.cwd(), 'public/models-external/lowpoly_anime_character_cyberstyle.glb');

  if (isPublicPrimary && existsSync(extFull)) {
    const second = checkPlayerAnimations(extRel);
    if (!second.missing.length) {
      console.warn(
        '[validate-player-animations] В `public/lowpoly_anime_character_cyberstyle.glb` нет Idle/Walk — в игре всё равно грузится он. ' +
          'Замените файл или задайте `NEXT_PUBLIC_DEFAULT_PLAYER_MODEL=/models-external/lowpoly_anime_character_cyberstyle.glb`. ' +
          'CI принимает эталон из models-external.',
      );
      console.log(`Player animations OK (reference ${extRel}): ${second.animationNames.join(', ')}`);
      return;
    }
  }

  console.error(`Missing animations in ${relativePath}: ${missing.join(', ')}`);
  console.error(`Available animations: ${animationNames.join(', ') || '<none>'}`);
  if (isPublicPrimary) {
    console.error(
      'Подсказка: в корне `public/` ожидается тот же набор клипов, что и для обхода (Idle/Walk). ' +
        'Экспорт Mixamo или переименование клипов; иначе временно уберите файл из `public/` и используйте копию в `models-external` + `NEXT_PUBLIC_DEFAULT_PLAYER_MODEL`.',
    );
  }
  process.exit(1);
}

validate();
