# Basis Universal — Volodka GPU Texture Pipeline

Basis Universal is a [supercompressed](http://gamma.cs.unc.edu/GST/gst.pdf) GPU texture format. Volodka uses it for KTX2 atlases produced by the art pipeline.

[Upstream docs](https://github.com/BinomialLLC/basis_universal)

## Files in this folder

| File | Purpose |
|------|---------|
| `basis_transcoder.js` | JS wrapper for the WebAssembly transcoder |
| `basis_transcoder.wasm` | WASM transcoder binary |

Both are required by Three.js `KTX2Loader`:

```js
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('/basis/');
ktx2Loader.detectSupport(renderer);
ktx2Loader.load('/models/characters/volodka/volodka_atlas_1.ktx2', (texture) => {
  material.map = texture;
});
```

## Volodka asset pipeline (GLB → production)

```
assets-source/**/*.glb          # Authoring (git-lfs or art handoff)
        ↓ npm run assets:process
public/models/                  # Draco / Meshopt / LOD variants
public/basis/                   # Transcoder (this folder — do not delete)
public/draco/gltf/              # Draco decoder for compressed meshes
        ↓ npm run assets:validate
src/config/assetManifest.ts     # Typed registry + LOD distances
```

### Processing commands

```bash
npm run assets:process              # All sources in assets-source/
npm run assets:process -- --input assets-source/characters/volodka.glb
npm run assets:validate             # CI gate — manifest paths exist on disk
npm run assets:validate -- --warn-only
```

### CDN deploy

Large GLBs can live off-origin. Set at build time:

```bash
VITE_MODELS_BASE=https://your-cdn.example/volodka-models npm run build
```

See [DEPLOY.md](../../DEPLOY.md) for the full models CDN checklist.

### Art deliverable checklist (per asset)

- [ ] GLB with named skeleton (characters) or pivot at floor (props)
- [ ] Triangle budget: LOD0 ≤ 12k (hero), ≤ 6k (NPC), ≤ 2k (LOD2)
- [ ] Textures power-of-two; prefer KTX2 Basis atlas from `assets:process`
- [ ] Entry added to `src/config/assetManifest.ts`
- [ ] `npm run assets:validate` passes in CI

## License

[Apache License 2.0](https://github.com/BinomialLLC/basis_universal/blob/master/LICENSE)
