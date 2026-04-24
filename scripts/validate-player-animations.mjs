#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve } from 'path';

const GLB_MAGIC = 0x46546c67; // 'glTF' in little-endian
const GLB_JSON_CHUNK = 0x4e4f534a; // 'JSON'
const DEFAULT_PLAYER_GLB = 'public/models-external/lowpoly_anime_character_cyberstyle.glb';

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

function validate() {
  const playerPath = process.argv[2] || DEFAULT_PLAYER_GLB;
  const fullPath = resolve(process.cwd(), playerPath);
  const buffer = readFileSync(fullPath);
  const gltf = getGlbJson(buffer);
  const animationNames = (gltf.animations || []).map((animation) => animation.name || '');

  const required = ['Idle', 'Walk'];
  const missing = required.filter((name) => !hasAnimationName(animationNames, name));

  if (missing.length) {
    console.error(`Missing animations in ${playerPath}: ${missing.join(', ')}`);
    console.error(`Available animations: ${animationNames.join(', ') || '<none>'}`);
    process.exit(1);
  }

  console.log(`Player animations OK: ${animationNames.join(', ')}`);
}

validate();
