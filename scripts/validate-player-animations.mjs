#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const GLB_MAGIC = 0x46546c67; // 'glTF' in little-endian
const GLB_JSON_CHUNK = 0x4e4f534a; // 'JSON'

const REQUIRED = ['Idle', 'Walk'];

/** Эталон игрока: `public/models-external/lowpoly_anime_character_cyberstyle.glb` (как `getDefaultPlayerModelPath` при дефолтном base). */
const DEFAULT_PLAYER_GLB_RELATIVE = 'public/models-external/lowpoly_anime_character_cyberstyle.glb';

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
  const target = explicit || DEFAULT_PLAYER_GLB_RELATIVE;

  if (!existsSync(resolve(process.cwd(), target))) {
    console.error(`Player GLB not found: ${target}`);
    process.exit(1);
  }

  const { relativePath, animationNames, missing } = checkPlayerAnimations(target);
  if (missing.length) {
    console.error(`Missing animations in ${relativePath}: ${missing.join(', ')}`);
    console.error(`Available animations: ${animationNames.join(', ') || '<none>'}`);
    process.exit(1);
  }

  console.log(`Player animations OK: ${animationNames.join(', ')} (${relativePath})`);
}

validate();
