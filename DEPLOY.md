# Volodka RPG — Production Deploy Guide

Browser SPA (Vite + React). Primary target: **Vercel**. Models may be same-origin or CDN-hosted.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_MODELS_BASE` | No | CDN origin for GLBs, e.g. `https://cdn.example.com/volodka-models`. Unset = `/models-external/` on same host. |
| `VITE_DEFAULT_PLAYER_MODEL` | No | Override player GLB path for art QA builds. |

Preview and production use the same vars; set production values on the **Production** environment in Vercel.

## Models CDN checklist

Before launch, verify:

- [ ] All files in `public/models-external/` uploaded to CDN **or** committed and served from Vercel
- [ ] `VITE_MODELS_BASE` set in production if using external CDN
- [ ] CORS: CDN allows `GET` from your game origin (or use same-origin)
- [ ] Cache headers: `Cache-Control: public, max-age=31536000, immutable` for `.glb`, `.wasm`, `.ktx2`
- [ ] Basis transcoder at `/basis/basis_transcoder.js` + `.wasm` (immutable cache — see `vercel.json`)
- [ ] Draco decoder at `/draco/gltf/` if using Draco-compressed meshes
- [ ] Smoke test: New Game → first scene loads player + NPC meshes (no 404 in Network tab)
- [ ] `npm run assets:validate` green when processed assets are checked in

### Upload layout (CDN)

Mirror the local path after `/models-external`:

```
https://cdn.example.com/volodka-models/khronos_cc0_CesiumMan.glb
https://cdn.example.com/volodka-models/khronos_cc0_RiggedFigure.glb
…
```

Build rewrites `/models-external/foo.glb` → `{VITE_MODELS_BASE}/foo.glb`.

## Build & deploy (Vercel)

1. Connect GitHub repo to Vercel
2. Framework preset: **Vite** (or use repo `vercel.json`)
3. Build command: `npm run build` (runs validate + typecheck + budgets)
4. Output directory: `dist`
5. Deploy preview on PR; promote to production after [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)

```bash
npm run check    # Full gate locally before release tag
```

## Cache strategy (`vercel.json`)

| Path | Cache |
|------|-------|
| `/index.html`, `/` | `no-cache` (SPA shell) |
| `/assets/*` | 1 year immutable (hashed bundles) |
| `/models-external/*`, `*.glb` | 1 year immutable |
| `/basis/*` | 1 year immutable |
| Static images | 1 day |

## Rollback

- Vercel: redeploy previous production deployment from dashboard
- CDN models: version by path prefix (`/v3/models-external/…`) if you need atomic rollbacks without app redeploy

## Security

Security headers are defined in `vercel.json` (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`). Do not embed secrets in client env vars — all `VITE_*` values are public in the bundle.
