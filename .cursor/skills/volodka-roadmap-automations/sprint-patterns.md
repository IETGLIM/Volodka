# Sprint patterns — Volodka ROADMAP automations

Reference for [SKILL.md](SKILL.md). Align automation instructions with ROADMAP.md §8.C exit criteria.

**Status (June 2026):** Sprints 0–5 ✅ complete. Sprint 2 has partial open items (Mixamo, AI3DGen Pro). **Sprint 6** is the active ship gate.

Use **regression** prompts for completed sprints — confirm exit criteria still hold. Use **actionable** prompts only for open `[ ]` items in §8.C.

---

## Sprint 0 — Production smoke + P0 ✅ (regression)

**Exit criteria (met v4.2.29):** `check` green; smoke without 404; P0 closed; baseline in ROADMAP §0.

**Suggested automation:** Pattern 5 (pre-deploy) + Pattern 2 on PRs touching `src/data/quests/**`.

**Agent focus files:**
- `scripts/verify-deploy-assets.ts`
- `scripts/validate-content.ts` (quest section empty)
- `e2e/boot-pipeline.spec.ts`, `e2e/*.spec.ts`

**Prompt snippet:**
> Regression: ROADMAP Sprint 0. Run CI parity gate. Confirm `validate:content` quest section is empty. Note dist size via `npm run budgets`. List any `.glb` 404 risks from `verify:deploy`. Report regressions only — do not reopen closed P0 items unless validation fails.

---

## Sprint 1 — Audio + mode integrity ✅ (regression)

**Exit criteria (met v4.2.30):** All shipped scenes have manifest entry; 0 missing audio profile warnings; smoke audio OK.

**Suggested trigger:** PR opened when paths include `src/config/proceduralAudioCatalog.ts`, `src/config/sceneExtensionDefinitions.ts`, `src/config/sceneInheritance.ts`, `src/engine/audio/**`.

**Agent focus files:**
- `src/config/proceduralAudioCatalog.ts`
- `src/config/sceneExtensionDefinitions.ts` (`EXTENSION_SCENE_DEFINITIONS`)
- `src/config/sceneDefinitions.ts` (imports extension definitions)
- `src/config/sceneInheritance.ts`
- `src/engine/audio/SceneAudioController.ts`
- `src/hooks/useAudioOrchestrator.ts`

**Prompt snippet:**
> Regression: ROADMAP Sprint 1. Compare extension scenes in `sceneExtensionDefinitions.ts` / `sceneInheritance.ts` to `proceduralAudioCatalog.ts`. Confirm 0 missing audio profile warnings. After changes, run CI parity gate and describe ambient → combat → dialogue transition risks. Do not hunt for the historical "9 extension scenes" gap — it is closed.

---

## Sprint 2 — Art RPM / Mixamo / Poly (partial — actionable)

**Exit criteria:** `assets:validate` green; hero + story NPCs with correct animations; status report without gaps.

**Open items (§8.C):** Mixamo 0/4 (user download blocker); AI3DGen Pro 0/18 on disk.

**Suggested trigger:** Push to branch matching `assets/**`, `public/models/**`, `assets-source/**`, or manual weekly cron.

**Commands:** `npm run assets:status`, `npm run assets:validate`, `npm run assets:mixamo-import` (document only — do not run destructive imports without user approval).

**Prompt snippet:**
> ROADMAP Sprint 2 — open gaps only. Run `assets:status` and `assets:validate`. Summarize Mixamo (0/4) and AI3DGen Pro (0/18) vs manifest. Quaternius interim (20/20) and shipped GLB (26/26) should stay green. Do not replace shipped GLB without explicit user instruction. See `assets-source/mixamo/README.md` for Mixamo blocker.

---

## Sprint 3 — Graphics AAA (web budget) ✅ (regression)

**Exit criteria (met v4.2.39):** Target scenes pass visual smoke; bundle budgets intact; FPS stable mid-tier GPU.

**Suggested trigger:** PR touching `src/engine/graphics/**`, `config/performanceBudgets.json`, `scripts/check-bundle-budgets.mjs`.

**Commands:** `npm run budgets:check`, `npm run build`.

**Prompt snippet:**
> Regression: graphics sprint work against `performanceBudgets.json` and `npm run budgets:check`. Flag boot menu + first scene hardMax violations. Wet/interior/LOD work is done unless this PR regresses it.

---

## Sprint 4 — Narrative UX + golden path 0 warnings ✅ (regression)

**Exit criteria (met v4.2.40):** `validate:content` → 0 golden-path warnings; manual `GOLDEN_PATH_STORY_SPINE` deprecatable.

**Suggested automation:** Pattern 4 (golden path regression) on demand; Pattern 2 on every story PR.

**Agent focus files:**
- `src/data/goldenPath.ts` (`GOLDEN_PATH_STORY_SPINE`, `STORY_NODE_GUIDANCE`)
- `src/data/story/act7.ts` (endings)
- `src/components/game/StoryGuidanceHUD.tsx`

**Prompt snippet:**
> Regression: ROADMAP Sprint 4 / P1. Run `npm run validate:content` — expect `missingGoldenPathMarkers: []` and 0 golden-path warnings. If this PR touches story nodes, verify `getGoldenPathDerivationReport()` still matches. Improve `STORY_NODE_GUIDANCE` only when in scope. Strengthen `ending_*` emotional beats in act7 without changing poem text.

---

## Sprint 5 — Lint zero + e2e hardening ✅ (regression)

**Exit criteria (met):** `npm run lint` without `--max-warnings`; e2e stable on CI.

**Suggested trigger:** PR opened (any `src/**`, `e2e/**`) or nightly cron.

**Agent focus files:**
- `eslint.config.js`
- `package.json` (`lint` script — no max-warnings budget)
- `src/engine/e2e/e2eBridge.ts`
- `e2e/*.spec.ts`, `e2e/extension-scenes-smoke.spec.ts`

**Prompt snippet:**
> Regression: Sprint 5. Run `npm run lint` — expect 0 warnings (362 budget removed). Prefer typed helpers over raw `page.evaluate` in new e2e code. Run `npm run test:e2e` if build time allows; otherwise run targeted spec paths the user names. Report new warnings or flaky specs only.

---

## Sprint 6 — Playtest RC v4.3.0 (active)

**Exit criteria:** RC deployed; playtest checklist closed; Production promote approved.

**Open items (§8.C):** RC tag `v4.3.0`; changelog; preview deploy + 3+ playtesters; feedback collection; hotfix window; Production promote.

**Suggested trigger:** Git tag push matching `v4.3.0*` or manual webhook before Vercel promote.

**Agent focus files:**
- `CHANGELOG.md` (or project changelog location)
- `e2e/boot-pipeline.spec.ts`, `e2e/extension-scenes-smoke.spec.ts`
- ROADMAP §5 deploy checklist

**Prompt snippet:**
> ROADMAP Sprint 6 RC gate (active). Confirm changelog covers sprints 0–5 and version aligns with `package.json`. Run CI parity gate + `npm run test:e2e`. Verify preview deploy checklist (§5): `VITE_SITE_URL`, 10-min gameplay smoke, 0× `.glb` 404. Output go/no-go for Production promote. Include playtest feedback template: novice (onboarding, story clarity) vs experienced (audio, perf, pacing).

---

## Priority shortcuts (time-boxed)

When the user has limited time, focus on **open** work per ROADMAP §8.D (updated):

1. **Sprint 6** — RC playtest v4.3.0 (active ship gate)  
2. **Sprint 2 partial** — Mixamo / AI3DGen Pro when user supplies assets  
3. **Regression sweep** — CI parity gate on any release candidate PR  

Completed sprints 0–5: use regression prompts from sections above, not greenfield implementation.

Suggest a **single automation per priority**, not one mega-automation covering all sprints.
