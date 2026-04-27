#!/usr/bin/env node
/**
 * Lists Three.js animation clip names after GLTFLoader parse (Node).
 * Usage: node scripts/inspect-glb-animations.mjs path/to/model.glb
 */
globalThis.self = globalThis;

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const root = dirname(fileURLToPath(import.meta.url));
const rel = process.argv[2];
if (!rel) {
  console.error('Usage: node scripts/inspect-glb-animations.mjs <path-to.glb>');
  process.exit(1);
}
const full = resolve(root, '..', rel);
const buf = readFileSync(full);
const loader = new GLTFLoader();
await new Promise((resolvePromise, reject) => {
  loader.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    '',
    (gltf) => {
      const names = (gltf.animations || []).map((c) => c.name || '<empty>');
      console.log(full);
      console.log(names.join('\n'));
      resolvePromise();
    },
    reject,
  );
});
