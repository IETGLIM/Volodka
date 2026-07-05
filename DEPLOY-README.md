# Volodka RPG — Deploy Archive v4.2.50

> Production-ready build with 37 fixes from roadmap improvements (v4.2.43 → v4.2.50).
> All typecheck + lint + 1224 tests green. Verified end-to-end.

## Quick Start (local verification)

```bash
tar -xzf volodka-deploy-v4.2.50.tar.gz
cd volodka
npm install
npm run dev          # http://localhost:3000
```

## Vercel Deploy (3 options)

### Option A: GitHub + Vercel (recommended)

```bash
tar -xzf volodka-deploy-v4.2.50.tar.gz
cd volodka
git init && git add -A && git commit -m "Volodka RPG v4.2.50"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/volodka.git
git push -u origin main
```
Then https://vercel.com/new → Import repo. Vercel auto-detects Vite.

### Option B: Vercel CLI

```bash
npm i -g vercel
tar -xzf volodka-deploy-v4.2.50.tar.gz
cd volodka && npm install
vercel && vercel --prod
```

## Build Pipeline

`npm run build` runs:
1. assets:prepare (idempotent — skips existing GLBs)
2. validate (content validator)
3. assets:validate (GLB magic bytes)
4. tsc -b (TypeScript)
5. vite build (~20s, ~2.5MB gzip)
6. budgets:check (enforced, not advisory)
7. verify:deploy

## Verification

```bash
npm run lint        # 0 errors
npx tsc --noEmit    # 0 errors
npm run test:unit   # 1224+ tests pass
```

## Tech Stack

Vite 6 + React 19 + TypeScript 5 + Three.js 0.172 + R3F 9 + Rapier 2.2 + Zustand 5 + Zod 4 + Tailwind 4 + shadcn/ui. 27 scenes, 7 acts, 302 story nodes, 83 quests, 46 poems, 11 enemy types, 220 GLB assets (200 MB), procedural Web Audio.
