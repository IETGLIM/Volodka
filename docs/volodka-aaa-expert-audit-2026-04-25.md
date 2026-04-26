# Volodka AAA Expert Audit — 2026-04-26 (Updated)

**Актуализация 2026-04-27:** сверка с кодом после инкрементальной дорожной карты (`docs/volodka-incremental-aaa-roadmap.md`, фазы 0–5): Zod + лимит тела для POST `/api/ai-dialogue`, лимит `Content-Length` для включённого `/api/models/upload`, политика smoke (Browserbase только `workflow_dispatch`, не в PR CI), мобильный слой с единым breakpoint и тестами. README и `.gitignore` дополнены под CI и локальные zip-снимки.

**Readiness: strong vertical slice, not full 100/100** — project has a showable desktop-first memorial slice on Vercel with streaming v0.2, bytes-based LRU, model diagnostics, and CI gates, but the codebase still should not be described as fully production-ready without qualification. Remaining material work includes broader mobile QA on real devices, optional E2E smoke in CI (cost tradeoff), full route-schema coverage beyond dialogue/upload, rate limiting, and a future invalidate-safe rendering pass everywhere.

## Executive Summary (from user report, integrated and validated)

In the analysis of the "Volodka" codebase, both strengths and critical gaps were identified. The project is built on Next.js (App Router) + React + React Three Fiber (R3F) + Zustand for state management, with a Node.js backend (Next API). The architecture is monolithic: frontend (React components, 3D scenes) is tightly coupled with gameplay logic (NPC, Quests, Physics), while the backend is limited to Next.js API (LLM interactions, saving). In its current form, the project is far from AAA level: there are no advanced rendering and loading optimization mechanisms, no internationalization or accessibility, and UX/UI requires significant improvement.

Key risks and tasks (исторический конспект отчёта; **не** полное отражение текущего CI): rendering performance (LOD/instancing not universal), state optimization (selectors improved in places; monolith still large), network layer (optional APIs: feature flags + secrets; dialogue request validated with Zod when POST is accepted — **full** auth/rate-limit/DAL still open), UX/i18n/a11y depth for a boxed AAA title.

The report proposes a phased improvement plan: from architecture restructuring and state refactoring to implementing AAA features (instancing, LOD, loading optimization, adding audio/visual effects), with justification of effort and success metrics. A roadmap of iterations (Mermaid Gantt), AAA quality criteria checklist with gap analysis, and specific patches and recommendations (e.g., lazy loading, memoization, monitoring) are presented.

**Validated against current codebase (2026-04-27):**
- **Closed / improved:** Streaming v0.2, LRU bytes+texture, diagnostics HUD, hero route `volodka_room`, CI (`tsc`, Vitest, `test:player-animations`, `asset-budget`, lint, build). `playerStore` / `worldStore` / `factionStore` use Zustand `persist` with migrations story (см. `CHANGELOG`, `migrations.ts`). POST `/api/ai-dialogue`: лимит размера тела + `safeParseDialogueRequest` (Zod) до вызова SDK; без `ENABLE_AI_DIALOGUE_API=1` — локальный fallback. `/api/models/upload`: выключен по умолчанию; при включении — bearer + лимит по `Content-Length`. Browserbase smoke: `volodka-smoke.yml` только ручной запуск, осознанно не в PR CI. Мобильный слой: единый breakpoint, тесты breakpoints и `explorationTutorialHints` на hero-сценах.
- **Still open (do not overstate):** demand/invalidate frameloop не доказан «везде» по Canvas; `AriaLiveAnnouncer` в `GameOrchestrator`, не в root layout; нет rate limiting / единого auth-слоя на все AI/save routes; E2E в CI нет (smoke ручной); полевая mobile QA — по чеклисту roadmap, не роботом.

**Tech Lead Verdict:** Project is a strong web vertical slice with a safer production baseline, not a finished 100/100 AAA release. Focus next on persist coverage, broader verification, and deeper performance work only after current claims stay aligned with code.

## Architecture and Folder Structure
Current state: Next.js App Router with `src/app/page.tsx` marked `"use client"` and dynamically loading `GameClient` (no SSR). Folder structure is domain-driven: `core/`, `game/`, `state/`, `ui/`, `lib/`, `ecs/`, `engine/`, `data/`. `src/app/api/` contains API routes (LLM, save). Monolithic but well-organized after refactor.

**Gaps closed:**
- Clear separation: `ui/` for rendering, `game/` for logic, `engine/` for systems, `state/` for Zustand, `data/` for types/manifests.
- Streaming v0.2, model cache, diagnostics, faction integration in `questMetaStore`.

**Remaining:** Full DAL/service layer for API (server-only), i18n structure.

## Zustand State Dependencies
Current state: Multiple Zustand stores (`gameStore`, `questMetaStore`, `playerStore`, `worldStore`). `useShallow` used, refs for heavy Three objects. Client-only (no SSR for game).

**Gaps closed:**
- `factionReputations` added to `PlayerState`/`SaveData` and `questMetaStore` with `updateFactionReputation`.
- Streaming state in `ExplorationState`.
- Diagnostics HUD pulls live data without heavy re-renders.

**Remaining (next iteration):** Дальнейшая синхронизация `save-manager` / облако с partialize transient-полей; при необходимости — IndexedDB для очень больших сейвов (сейчас упор на localStorage + компактные снимки).

## R3F / Three.js Integration
Current state: Single `RPGGameCanvas` with `Canvas`, `PhysicsPlayer`, `NPC`, `PropModel`, `StreamingChunk`, PostFX, particles. `useGLTF` + cache, Rapier synced via events.

**Gaps closed:**
- `frameloop` / инвалидация: частично (demand + invalidate в ключевых местах `useFrame` / Canvas — не единая политика на весь граф).
- InstancedMesh example in district buildings extended to blue_pit/office.
- Model diagnostics in `StreamingDebugHUD` (currentModelPath, animation, LRU pressure, Rapier bodies).
- Procedural textures, scale validation, no T-pose.

**Remaining:** Full demand rendering everywhere, more instancing for props/NPC, mobile performance profiling.

## Rendering and Asset Loading Performance
Current state: `gltfModelCache` with bytes-based LRU (geometry + texture), `StreamingChunk` for lazy loading, asset-budget gate in CI.

**Gaps closed:**
- Procedural props for blue_pit (mic, neon, stage, bar).
- `.vercelignore` excludes unused GLB (>180MB reduction).
- Asset budget report + hard gates.

**Remaining:** Vercel Blob/CDN for remaining large GLB (current limit hit at ~219MB). Full LOD.

## Network Layer (Node.js API)
Current state: Next.js API routes for LLM, save (disabled by default), optional Blob upload. Zod on quest pipeline and **dialogue POST body** (`src/validation/aiDialogueRequestSchema.ts`); лимиты тела в `apiRouteSecurity.ts`.

**Gaps closed:**
- Security headers in vercel.json, CI with tests.
- Dialogue route: JSON size cap + schema validation before SDK; fallback без LLM по умолчанию.
- Upload route: feature flag, bearer secret, safe filename, optional max size via `Content-Length`.

**Remaining:** Zod/лимиты на остальные AI routes (`ai-narrative`, `ai-stream`, `ai-pipeline` и т.д. по мере публичного использования), rate limiting, общий auth-слой, DAL.

## Security, Tests, CI/CD, UX/UI, a11y, i18n
**Closed:** Narrative integrity tests, CI with tsc/vitest/asset-budget/scale, HUD with Karma/glitch/diagnostics, accessibility basics in HUD.

**Remaining:** E2E в CI (опционально), углублённый a11y для 3D canvas, i18n, UX journal, Lighthouse. Persist foundation (migrations, `playerStore`/`worldStore`/`factionStore` persist) — в коде; тонкая синхронизация с облачным сейвом и краевые случаи — по мере включения `ENABLE_CLOUD_GAME_SAVE`.

## AAA Checklist & Gap Analysis (Updated 2026-04-26)
| Criterion | AAA Requirement | Current State | Gap Closed? | Remaining |
|-----------|-----------------|---------------|-------------|-----------|
| Graphics | PBR, LOD, post-effects, particles | Procedural textures, streaming, diagnostics | Yes (v0.2, PropModel) | Instancing, full LOD, Blob CDN |
| Performance | 60 FPS, demand rendering, <8MB initial | Demand in Canvas, LRU bytes, diagnostics | Yes | Full demand everywhere, persist |
| UX/UI | Intuitive menus, tutorials, settings | HUD with Karma, diagnostics toggle, radial menu | Yes | Journal, tutorial, i18n |
| Progression | Quests, achievements, balance | QuestEngine, factionReputations, poetry_life_review | Yes | Balance pass, journal UX |
| Reliability | No bugs, stable saves, CI | Tests, CI, streaming cleanup, local persist | Partial | E2E, облако под нагрузкой |

**Roadmap (next iteration):**
- Синхронизация облачного сейва и `save-manager` при включённом проде; при необходимости — rate limits.
- Demand rendering + instancing шире в `RPGGameCanvas`.
- Опциональный E2E smoke в CI vs стоимость Browserbase (см. roadmap фаза 5).
- a11y/i18n + UX journal.
- Индексная дорожная карта: `docs/volodka-incremental-aaa-roadmap.md` (фазы 0–5; чеклисты релиза и mobile).

**Persist Migration Summary:** Existing save-manager (v5, compacting, AutoSave) + new migrations.ts provides robust versioning. Transient fields (npcStates, timers) excluded via partialize/compact*. Readiness for saves now **solid**.

**Tech Lead Recommendation:** The **memorial / vertical slice** is deployable with the current CI gates and a safer API baseline; treat this as **production-ready for that scoped release**, not as a full AAA boxed title. Next focus: optional E2E smoke in CI, broader mobile QA, CDN for large GLB, and deeper perf (demand frameloop / LOD) — see `docs/volodka-incremental-aaa-roadmap.md`.

(Updated 2026-04-27: синхронизация с API hardening, CI/smoke policy, persist stores, инкрементальным roadmap.)