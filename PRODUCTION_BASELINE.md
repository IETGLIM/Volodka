# Production Baseline — ВОЛОДЬКА v3.1.0

**Captured:** 2026-06-11  
**Command:** `npm run check` (lint → typecheck → validate → build → budgets)  
**Phases covered:** 0–4 (AAA Production Roadmap); phases 5–7 completed separately.

---

## Definition of Done — Current Status

| Criterion | Target | Baseline | Status |
|-----------|--------|----------|--------|
| Boot JS gzip | ≤ 450 KB | **292.1 KB** | ✅ |
| Game-start JS gzip | ≤ 1.2 MB | **538.3 KB** (incremental) | ✅ |
| Cumulative first scene | ≤ 1.2 MB | **830.3 KB** | ✅ |
| Content validation errors | 0 | **0** (78 warnings) | ✅ |
| Unit tests | all pass | **154/154** | ✅ |
| E2E golden path + critical flows | green | **8/8** | ✅ |
| Bundle budgets | hard max | **OK** | ✅ |
| Long session stress harness | dev global | `window.__volodkaStress` | ✅ (manual gate) |

---

## Bundle Report (`npm run budgets`)

```
Boot menu JS (gzip):     292.1 KB  (target 439.5 KB, hard max 634.8 KB)
Game-start JS (gzip):    538.3 KB  (target 1171.9 KB, hard max 1757.8 KB)
Cumulative first scene:  830.3 KB
Lazy tier:              1214.3 KB
Total JS gzip:          2061.0 KB
Entry CSS gzip:         45.4 KB
Rapier physics lazy:    917.4 KB gzip
WebGL stack (three+r3f+drei): 264.8 KB — 49% of game-start JS
```

---

## Content Validation (`npm run validate`)

- **Errors:** 0
- **Warnings:** 78 (mostly golden-path `choice.goldenPath` markers + 3 questGiverNpcId mismatches)

Vitest gate: `contentPipelineValidator.test.ts` asserts `errorCount === 0`.

---

## Test Results (2026-06-11)

| Suite | Result |
|-------|--------|
| `npm run typecheck` | pass |
| `npm run validate` | pass (0 errors) |
| `npm run test:unit` | **28 files, 154 tests — all pass** |
| `npm run test:e2e` | **8 tests — all pass** |

E2E coverage: `smoke`, `golden-path-act1`, `inventory-quest`, `scene-transition`, `save-load`, `combat-flee`.

---

## DEEP_CODE_REVIEW.md — P0/P1 Reconciliation

### P0 Critical — Status

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | EventBus subscribe leak (GameOrchestrator) | **FIXED** | Thin orchestrator + `eventBus.createScope()` + `useGlobalCleanup` |
| 2 | AmbientSoundPlayer HMR orphans | **FIXED** | `registerHmrDispose` + `audioPlaybackState` FSM |
| 3 | Audio crossfade race | **FIXED** | `Idle→FadingOut→FadingIn→Playing→Disposed` in AmbientEngine |
| 4 | useInteractionOrchestrator incomplete cleanup | **FIXED** | Scoped EventBus + `withHmrCleanup` |
| 5 | EventBus dedupCache JSON.stringify | **FIXED** | `eventBusDedup.ts` fixed-size cache (64) |
| 6 | `currentCombat` global race | **FIXED** | `CombatManager` class + generation tokens |
| 7 | `enemyTurnTimer` orphan after victory | **FIXED** | `Set<timer>` lifecycle in CombatManager |
| 8 | Monolithic playerSlice (1059 lines) | **PARTIAL** | Facade over 5 sub-slices; further split optional |
| 9 | `poetry_collection` → `volodka_inner` missing | **FIXED** | Node in `story/act5.ts` |
| 10 | FloorMaterial duplication | **FIXED** | Single source `sceneDefinition.ts`, re-export `game.ts` |
| 11 | GuidedStoryManager hardcoded act list | **FIXED** | `goldenPath.ts` + `guidedStoryLogic.ts` |

### P1 Important — Selected Status

| Area | Status | Notes |
|------|--------|-------|
| Canvas first-frame double emit | **FIXED** | `canvasFirstFrameSession` generation token |
| Combat returnStack unbounded | **FIXED** | `MAX_RETURN_STACK_DEPTH = 8` + unit test |
| Orchestrator panel re-renders | **FIXED** | `React.memo` OrchestratorPanelSlots + `useShallow` selectors |
| Bundle size 1.87 MB | **IMPROVED** | Game-start 538 KB incremental; budgets green |
| SceneId manual union | **FIXED** | Derived from `sceneDefinitions.ts` |
| Zustand inline selectors | **FIXED** | `store/selectors/*` + `useGameSelector` |
| NavMesh open districts | **DOCUMENTED** | Patrol waypoint fallback in `NavMeshLayer.ts` |
| LOD worst scenes | **FIXED** | `SCENE_NPC_LOD` / `SCENE_ENV_LOD` for `abandoned_factory`, `chk_forest_zorge` |

### Remaining Gaps (non-blocking for phases 0–4)

- 78 validation **warnings** (golden-path marker coverage)
- `playerSlice` facade still large — acceptable for v3.1
- 60-min stress harness is **dev-only** — manual verification required before art pass
- Custom GLB assets — deferred to phase 5 (completed by other agent)

---

## Phase Deliverables Checklist

| Phase | Deliverable | Location |
|-------|-------------|----------|
| 0 | This baseline doc | `PRODUCTION_BASELINE.md` |
| 1 | EventBus leak test | `EventBus.test.ts` (32 mount cycles) |
| 1 | Audio FSM | `audioPlaybackState.ts`, `AmbientEngine.ts` |
| 1 | Combat Zustand mirror | `combatSlice.ts`, `installCombatStoreBridge` |
| 1 | Canvas generation token | `canvasFirstFrameSession.ts` |
| 1 | Stress harness | `longSessionStressHarness.ts` |
| 1 | CombatManager tests | `CombatManager.test.ts` |
| 2 | Bundle budgets | `vite/chunks.ts`, `performanceBudgets.json` |
| 2 | useShallow selectors | `store/selectors/hooks.ts` |
| 2 | Panel memo | `OrchestratorPanelSlots.tsx` |
| 2 | Quality preset persist | `graphicsSettingsStorage.ts` (localStorage) |
| 2 | Scene LOD tuning | `distanceLod.ts` |
| 3 | Validator hardening | `contentPipelineValidator.ts` |
| 3 | Golden path spine | `GuidedStoryManager.ts`, `goldenPath.ts` |
| 3 | Type consolidation | `sceneDefinition.ts`, `game.ts` |
| 3 | QA matrix acts 1–3 | `QA_MATRIX.md` |
| 4 | E2E specs (5 flows) | `e2e/*.spec.ts` |
| 4 | Save schema edge tests | `saveSchema.test.ts` |
| 4 | CI golden path gate | `.github/workflows/ci.yml` |

---

## Maturity Estimate

**Pre-roadmap:** 6.5/10 (DEEP_CODE_REVIEW.md)  
**After phases 0–4:** **7.5–8.0/10** — stable runtime, green budgets/tests, content integrity; visual/asset polish in phases 5–7.
