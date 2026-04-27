#!/usr/bin/env node
/**
 * Upload critical GLB to Vercel Blob using the new /api/models/upload route
 * Usage: node scripts/uploadModelsToBlob.mjs
 * Requires BLOB_READ_WRITE_TOKEN in .env.local
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIRS = [
  path.join(process.cwd(), 'public', 'models'),
  path.join(process.cwd(), 'public', 'models-external')
];

const CRITICAL_MODELS = [
  'khronos_cc0_CesiumMan.glb',
  'khronos_cc0_RiggedFigure.glb',
  'khronos_cc0_Fox.glb',
  'sayuri_dans.glb',
  'spartan_armour_mkv_-_halo_reach.glb',
  'Chair.glb',
  'desk_volodka.glb',
  'shelf.glb',
  'mug.glb',
  'Keyboard.glb',
  'lamp.glb',
];

console.log('🚀 Uploading critical models to Vercel Blob via API...');

for (const dir of MODELS_DIRS) {
  for (const filename of CRITICAL_MODELS) {
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) continue;

    const fileBuffer = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), filename);

    const response = await fetch(`http://localhost:3000/api/models/upload?filename=${filename}`, {
      method: 'POST',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (response.ok) {
      const blob = await response.json();
      console.log(`✅ Uploaded ${filename} → ${blob.url}`);
    } else {
      console.error(`❌ Failed to upload ${filename}: ${response.statusText}`);
    }
  }
}

console.log('\n🎉 Upload complete. Set NEXT_PUBLIC_MODELS_BASE to your Blob base URL in .env.local.');
console.log('Example: NEXT_PUBLIC_MODELS_BASE=https://your-project.blob.vercel-storage.com');
console.log('\nThen run: vercel --prod');
