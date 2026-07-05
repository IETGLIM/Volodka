# ROADMAP — Volodka RPG

> **Historical sprint record & forward-looking improvement index.**
>
> This file is referenced by `CHANGELOG.md` (Sprint 0–5 completion notes),
> `ARCHITECTURE.md:442`, `.cursor/skills/volodka-roadmap-automations/`, and
> `scripts/assets-status.mjs`. It was missing from the repo prior to v4.2.43
> (phantom reference — see `[roadmap:P0-DOC-01]`).
>
> **For active improvement work**, see
> [`ROADMAP-IMPROVEMENTS.md`](./ROADMAP-IMPROVEMENTS.md) — the living,
> code-analysis-driven roadmap with prioritized items, file:line citations,
> and execution phases.

---

## §0 — Baseline (Sprint 0, v4.2.29)

**Status: ✅ Closed**

- P0 fix: `WakeUpSequence` deferred `cutscene:overlay_end` / 9s timer no longer
  reopens `start` prologue after `explore_mode`.
- E2E: `waitForExplorationInputReady` + `enterCorridorViaPhysicalDoor`.
- `npm run check` green; 1107 unit; assets 26/26 shipped; smoke + boot-pipeline
  + act1 e2e green.

---

## §1 — Golden path integrity (P1)

**Status: ✅ Closed (Sprint 4)**

- `deriveStorySpine` === `GOLDEN_PATH_STORY_SPINE`, `fallbackSpineSteps: []`,
  `missingGoldenPathMarkers: []`.
- `STORY_NODE_GUIDANCE`: 116/116 spine steps with HUD hint.
- Tests: `goldenPathGuidance.test.ts`.

---

## §2 — Story guidance HUD

**Status: ✅ Closed (Sprint 4)**

- `STORY_NODE_GUIDANCE` public alias for `GOLDEN_PATH_BRANCH_HINTS`.
- `StoryGuidanceHUD` renders objective text for current spine step.

---

## §5 — Production deploy checklist

**Status: ✅ Closed (Sprint 0)**

1. `npm run check` — green
2. Preview: New Game → 10 min without 404 on `.glb`
3. Promote to Production
4. `VITE_SITE_URL` set in Vercel Environment Variables

---

## §6 — Vercel deploy

**Status: ✅ Closed**

- `vercel.json` configured (SPA-rewrites, immutable cache `/assets/` + `/models/`,
  security headers).
- `npm run assets:bootstrap` → CC0 GLB for first production deploy.
- `npm run verify:deploy` → gate in build.

---

## §8 — AAA polish sprints

### Sprint 1 — Audio + mode integrity

**Status: ✅ Closed (v4.2.30)**

- Audio manifest for 9 extension scenes.
- Inheritance fallback via `SCENE_DERIVED_FROM`.
- `SceneAudioController.onSceneUnload()` — fade music + crossfade ambient.
- Tests: audio manifest coverage (27/27 scenes).

### Sprint 2 — Art pipeline audit

**Status: ✅ Closed (v4.2.38)**

- `assets:status` Sprint 2 audit block.
- 26/26 shipped GLB, 20/20 Quaternius interim.
- Mixamo/RPM — blockers on user downloads (manual pipeline).

### Sprint 3 — Graphics AAA

**Status: ✅ Closed (v4.2.39)**

- Wet street planar reflector (high+).
- Interior lighting for `chk_campfire_night`, `albert_backroom`, `guild_mainframe`.
- LOD audit: `SCENE_ENV_LOD` for 9 extension scenes.

### Sprint 4 — Narrative UX + golden path

**Status: ✅ Closed (v4.2.40)**

- Golden path 0 warnings.
- `STORY_NODE_GUIDANCE` 116/116 steps.
- Act7 endings verified.

### Sprint 5 — Lint zero + E2E hardening

**Status: ✅ Closed (v4.2.41)**

- ESLint 0 warnings (353 → 0).
- E2E typed bridge: `callE2EBridge` + `e2eBridge` helpers.
- Extension scenes smoke: `pier_evening`, `city_square`.

### Sprint 6+ — Open

**Status: See `ROADMAP-IMPROVEMENTS.md`**

Forward-looking improvement work is tracked in
[`ROADMAP-IMPROVEMENTS.md`](./ROADMAP-IMPROVEMENTS.md), organized by subsystem
(ARCH, PLYR, CMBT, POEM, GFX, WRLD, SAVE, STORE, UI, AUDIO, TEST, NPC, NARR,
SCENE, A11Y, BUILD, DOC) with priorities P0–P3 and execution phases.

---

## §10 — Library evaluation

**Status: ✅ Documented (v4.2.35–36)**

- `@formkit/auto-animate` evaluated then removed → `tailwindcss-animate` adopted.
- `drei Sparkles` for industrial ambient particles.
- XState: phased plan (interaction first), deferred.
- Ink (narrative scripting): XL effort, deferred.
- `CustomShaderMaterial` ≠ drei export — noted.

---

## CI parity gate

The CI parity gate (referenced by `.cursor/skills/`) is:

```bash
npm run lint && npm run typecheck && npm run validate:content && npm run assets:validate && npm run build && npm run verify:deploy
```

> **Note:** `npm run check` omits `test:unit` and uses a different assets order
> than CI. Use the full parity gate above for accurate CI reproduction.

---

## Sprint patterns reference

See `.cursor/skills/volodka-roadmap-automations/sprint-patterns.md` for
per-sprint regression checks and exit criteria.

---

*Last updated: v4.2.43 — `[roadmap:P0-DOC-01]` created this file to resolve
phantom reference. All historical sprint completion claims are preserved from
`CHANGELOG.md`. Active work lives in `ROADMAP-IMPROVEMENTS.md`.*
