# ВОЛОДЬКА — Pioneer AAA Roadmap / Дорожная карта

**Baseline:** v3.1.0 · React 19 + Vite 6 + Three.js 0.172 + R3F 9 · 55 quests · 14 scenes · budgets green · engineering **~8/10**, visuals **~4–5/10** (CC0 placeholders).

> Companion doc: [AI_CANON_POLICY.md](./AI_CANON_POLICY.md) · Art handoff: [assets-source/characters/README.md](../assets-source/characters/README.md)

---

## 1. Definition — Pioneer AAA Browser RPG

### Not the goal: Console AAA parity

| Criterion | Console AAA (2026) | Volodka today |
|-----------|-------------------|---------------|
| Budget | $50–300M | Solo / micro-team |
| Characters | Photoreal scan + mocap | CC0 Khronos / procedural |
| Distribution | Steam / consoles | Vercel SPA, zero-install |

**Вывод / Conclusion:** Visual parity with Cyberpunk / FF XVI in-browser is unrealistic and unnecessary.

### The real goal: Pioneer AAA

**Pioneer AAA** = best-in-class **narrative 3D RPG in the browser**:

1. **Art direction** over raw poly count — recognizable cyberpunk-noir + poetry layer.
2. **Instant play** — link → playable in ≤3 s (830 KB to first scene today).
3. **Web-native innovation** — browser ML (opt-in), stress-reactive FX, poem-magic.
4. **Production engineering** at AA-studio web level — budgets, E2E, validation, LOD tiers.
5. **Narrative integrity** — poems by Vladimir Lebedev are fixed canon, never LLM-generated.

### Maturity targets (12 months)

| Layer | Now | Target |
|-------|-----|--------|
| Engineering | 8/10 | 9/10 |
| Content / design | 7.5/10 | 8.5/10 |
| Visual fidelity | 4/10 | **7.5/10** (web ceiling) |
| Animation / juice | 5/10 | **8/10** |
| Innovation | 6/10 | **9/10** |

---

## 2. Five Phases (6–12 months)

### Phase A — Visual Foundation (weeks 1–8)

| Week | Deliverable |
|------|-------------|
| 1–2 | Hero GLB (Volodka) replaces CesiumMan; Mixamo idle/walk/run |
| 2–3 | `volodka_room` + `street_night` environment art pass |
| 3–4 | IBL, reflection probes, contact shadows on ultra |
| 4–5 | KTX2 atlases; CDN offload via `VITE_MODELS_BASE` |
| 5–6 | WebGPU canary on `street_night` (feature flag) |
| 6–8 | 3 quest-giver NPCs → GLB hybrid |

**Exit:** Screenshot “wow” on desktop ultra · budgets green · E2E green.

### Phase B — Animation & Combat Juice (weeks 9–16)

Combat clips + hit-stop · camera juice · TSL/VFX pass · spatial audio (HRTF) · 3 enemy meshes.

**Exit:** Combat E2E green · 60 FPS desktop / 30 FPS weak laptop on `abandoned_factory`.

### Phase C — AI / Cyberpunk Features (weeks 17–24, opt-in)

Codex semantic search · terminal minigame hints · voice commands (ASR) · settings UX with model download.

**Hard rule:** zero LLM on `DialogueRenderer` and poem text — see [AI_CANON_POLICY.md](./AI_CANON_POLICY.md).

### Phase D — Pioneer Differentiators (weeks 25–36)

Stress-reactive world · poem-as-code magic · zero-install 80h campaign · browser ML codex · photo mode · 1–2 Gaussian splat hero shots.

### Phase E — Native / Premium (weeks 37–48, optional)

Tauri 2 shell · cloud saves · Steam/itch distribution · HD asset pack.

**Out of scope 12 mo:** multiplayer, live service, DLC pipeline.

---

## 3. Keep vs Rewrite

### ✅ KEEP

`EventBus` + orchestrators · `QuestTracker` (55 quests) · `SceneDefinition` SSOT · Zustand slices · `CombatManager` · `qualityPresets` + LOD · `gltfPipeline` + asset scripts · audio FSM · E2E + CI + budgets · narrative data (poems, dialogue) · `modelUrls.ts` CDN pattern.

### 🔄 EVOLVE

| Module | Change |
|--------|--------|
| `RPGGameCanvas.tsx` | Dual WebGL / WebGPU renderer (flag-gated) |
| `ExplorationPostFX.tsx` | Node-based passes for WebGPU branch |
| `*Visual.tsx` | Hybrid GLB hero props + procedural fill |
| Player / NPC models | `npcRenderMode: 'glb'` on high/ultra |

### ❌ REPLACE

CC0 Khronos models · procedural story NPCs · procedural-only ultra environments.

### 🚫 DO NOT REWRITE

Quest/content data · save schema · UI panel system · Rapier physics · Vercel deploy config.

---

## 4. Quick Wins — 2–4 Weeks

**Highest ROI: one good character + one neon street.**

| Week | Actions |
|------|---------|
| **1** | `assets-source/characters/volodka.glb` → `npm run assets:process` → wire `assetManifest.player_volodka` · Mixamo 4 clips · before/after screenshot |
| **2** | `street_night` art pass: 5–10 GLB props · emissive neon · Poly Haven night HDRI |
| **3** | `volodka_room` desk GLB + emissive monitor · `<ContactShadows>` · 1 quest-giver GLB on ultra |
| **4** | CDN upload (`VITE_MODELS_BASE`) · `assets:validate` · E2E with custom model · screenshot regression script |

**Expected:** perceived quality **4/10 → 6/10** without WebGPU migration.

---

## 5. Technology Tiers (summary)

| Tier | Stack | Verdict |
|------|-------|---------|
| Core | React 19, Vite 6, Zustand, Rapier, EventBus | **Keep** |
| Rendering | Three.js r175+ WebGPU canary + TSL (gradual) | **Evolve** |
| Assets | Draco + Meshopt + KTX2/Basis (`assets:process`) | **Extend** |
| AI | transformers.js lazy worker, opt-in only | **Phase C** |
| Distribution | Vercel SPA primary; Tauri optional Phase E | **Keep + optional** |

---

## 6. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Bundle bloat (transformers.js +3–8 MB) | High | Lazy chunk; opt-in; separate budget tier; never in boot |
| Mobile WebGL perf | High | Procedural fallback; aggressive auto quality |
| WebGPU post-FX gaps | Medium | Dual pipeline; WebGPU ultra-only flag; WebGL default 6+ months |
| Vercel bandwidth | Medium | CDN (R2/Blob) for GLBs; cache headers |
| Scope creep (LLM dialogue, multiplayer) | Critical | [AI_CANON_POLICY.md](./AI_CANON_POLICY.md); phase gates |
| Art bottleneck | Critical | 2 hero scenes first; kitbash; don't custom-all-14-scenes |
| Poem canon via AI | Critical | Code review gate; AI sandbox isolated from dialogue modules |
| Solo burnout | High | Phase A until screenshot wow; hire 0.5 artist at week 4 |

---

## 7. Decision Matrix

```
                    Now             Month 3         Month 6         Month 12
Renderer:           WebGL           WebGL default   WebGPU canary   WebGPU default
Characters:         CC0/procedural  Hero GLB        Story NPCs      Full cast GLB
Environments:       Procedural      2 hero scenes   6 hybrid        10 hybrid
AI:                None            None            Codex search      + Voice ASR
Distribution:      Vercel          Vercel+CDN      Vercel            +Tauri opt
```

---

## 8. Immediate Next Actions

1. Art handoff: [assets-source/characters/README.md](../assets-source/characters/README.md)
2. `VITE_DEFAULT_PLAYER_MODEL` on Vercel preview env
3. Signature scenes: `volodka_room` + `street_night`
4. Enforce [AI_CANON_POLICY.md](./AI_CANON_POLICY.md) in `transformersBridge`
5. Branch `feat/art-pass-a` — don't break green CI on `main`
6. Screenshot baseline now → compare in 4 weeks

---

**Итог / Summary:** Volodka already has AAA **engineering** for a browser game. Pioneer AAA = **custom art + WebGPU path + poem-stress innovation**, preserving Lebedev canon and production discipline. Highest ROI: **one hero character + one neon street** in 4 weeks.
