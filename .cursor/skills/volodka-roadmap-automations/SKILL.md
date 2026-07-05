---
name: volodka-roadmap-automations
description: Drafts Cursor Automations for the Volodka RPG repo using ROADMAP.md sprint gates, npm validation commands, and exit criteria. Use when creating git-triggered or scheduled automations for this project, sprint checkpoints, pre-deploy checks, golden-path work, content validation, or roadmap-driven agent workflows in IETGLIM/Volodka.
disable-model-invocation: true
---

# Volodka Roadmap Automations

## Before drafting

1. Read [ROADMAP.md](../../../ROADMAP.md) at repo root — source of truth for priorities, sprints, exit criteria, and commands. Cross-check `package.json` version vs ROADMAP header when drafting Sprint 6 / RC automations.
2. Follow the **automate** skill (`~/.cursor/skills-cursor/automate/SKILL.md`) for the full creation spine: finish-path check → intent → PCD gates → draft table → editor handoff.
3. Scope automations to **IETGLIM/Volodka** unless the user names another repo.

## Active sprint detection

Sprints 0–5 are **completed** (v4.2.29–v4.2.40+). **Sprint 6** (RC v4.3.0) is the primary active ship gate.

To find open work, read ROADMAP §8.C and list items still marked `[ ]`:
- **Sprint 2 (partial):** Mixamo 0/4, AI3DGen Pro 0/18 — blocked on user asset downloads
- **Sprint 6:** RC tag, playtest, feedback, Production promote

For checkpoint automations, default to Sprint 6 unless the user names another sprint or a PR touches Sprint 2 asset paths.

## Project guardrails (always in agent prompts)

- **Стихи Владимира Лебедева неприкосновенны** — never edit poem text; only surrounding story/UI/metadata.
- **Local gate:** `npm run check` (lint + typecheck + validate:content + assets:validate + build + verify:deploy).
- **CI parity gate** (pre-merge / pre-deploy): mirror `.github/workflows/ci.yml` — `npm run lint && npm run typecheck && npm run validate && npm run assets:prepare && npm run assets:validate && npm run test:unit && npm run build && npm run verify:deploy`; e2e runs in a separate CI job (`npm run test:e2e` after build).
- **Content edits:** `npm run check` already includes `validate:content`; for a fast narrative-only loop use `npm run validate:content` alone.
- **Key paths:** `src/data/goldenPath.ts`, `src/data/story/`, `src/config/sceneDefinitions.ts`, `src/config/sceneExtensionDefinitions.ts`, `src/config/sceneInheritance.ts`, `src/config/proceduralAudioCatalog.ts`, `scripts/validate-content.ts`.

## Repo commands (reference)

| Purpose | Command |
|---------|---------|
| Local full gate | `npm run check` |
| CI mirror (check job) | See guardrails above |
| Content / quests / golden path | `npm run validate:content` |
| Assets on disk | `npm run assets:validate` |
| Asset pipeline bootstrap | `npm run assets:prepare` |
| Asset pipeline status | `npm run assets:status` |
| Unit tests | `npm run test:unit` |
| E2E smoke | `npm run test:e2e` |
| Bundle budgets | `npm run budgets:check` |
| Deploy verify | `npm run verify:deploy` |
| Event map integrity | `npm run events:check` |

## Automation patterns

Pick the closest pattern, then tailor trigger + instructions to the user's sprint or priority.

### 1. Pre-merge quality gate (PR opened / pushed)

**Trigger:** Git — pull request opened or code pushed to PR  
**Tools:** `manageCheckRun` (optional), agent shell  
**Instructions summary:** Run the **CI parity gate** (not `check` alone — it omits `test:unit` and uses a different assets order than CI). On failure, summarize failing step(s) with log excerpts and suggest fixes. On success, note green baseline from ROADMAP §0. Do not modify poem text.

### 2. Story / content change reviewer (PR touching narrative)

**Trigger:** Git — PR opened (scope: `src/data/story/**`, `src/data/quests/**`, `src/data/goldenPath.ts`)  
**Tools:** `prComment`  
**Instructions summary:** Run `npm run validate:content`. Report quest-section errors, golden-path warnings count, and any `getGoldenPathDerivationReport()` drift vs `GOLDEN_PATH_STORY_SPINE`. Flag quest giver / NPC mismatches (P0 class bugs). Poems read-only. Regression: expect 0 golden-path warnings (Sprint 4 done).

### 3. Sprint checkpoint (scheduled)

**Trigger:** Cron — weekly (e.g. Monday 9:00) or user-supplied schedule  
**Tools:** agent only (or `prComment` / Slack if user wants reports elsewhere)  
**Instructions summary:** Read ROADMAP.md §6 and §8.C. List unchecked `[ ]` items — prioritize Sprint 6, then Sprint 2 partial gaps. Run CI parity gate and `npm run assets:status`. Output: status table (pass/fail), blockers, next 3 concrete tasks from open checklists only.

### 4. Golden path regression (manual / PR comment)

**Trigger:** Git — comment on PR containing `@golden-path` or user-defined label; or webhook  
**Tools:** `prComment`  
**Instructions summary:** Sprint 4 is complete — **regression only**. Run `npm run validate:content` and confirm `missingGoldenPathMarkers: []` and derived spine matches manual spine. If drift appears, fix markers in the touched PR scope only; do not batch-rewrite the full spine without human review.

### 5. Pre-deploy / RC smoke (before production promote)

**Trigger:** Git — push to `main` or manual webhook before Vercel promote  
**Tools:** agent shell  
**Instructions summary:** ROADMAP §5 checklist: `assets:bootstrap` if needed, CI parity gate, `npm run test:e2e` when time allows, confirm `VITE_SITE_URL`, document 10-min manual smoke (0× 404 on `.glb`). Summarize go/no-go for Production promote.

### 6. Sprint-specific deep work

For detailed triggers, file targets, and exit criteria per sprint, see [sprint-patterns.md](sprint-patterns.md). Completed sprints (0–5) use **regression** prompts; Sprint 6 and Sprint 2 partial gaps use **actionable** prompts.

### 7. CI mirror (explicit)

**Trigger:** Same as Pattern 1, or manual before RC tag  
**Tools:** agent shell  
**Instructions summary:** Run steps 1:1 with `.github/workflows/ci.yml` `check` job, then optionally `test:e2e` as in the `e2e` job. Report pass/fail per step. Do not substitute `npm run check` for this pattern.

## Mapping user intent → sprint

| User says | ROADMAP anchor |
|-----------|----------------|
| production smoke, P0, baseline | Sprint 0 (regression), §0, §5 |
| audio, extension scenes, SceneAudioController | Sprint 1 (regression) |
| Mixamo, Quaternius, AI3DGen, assets | Sprint 2 (partial — open items) |
| wet surfaces, interiors, LOD, graphics | Sprint 3 (regression) |
| golden path, STORY_NODE_GUIDANCE, endings act7 | Sprint 4 (regression), §1 P1, §2 |
| lint zero, e2e, eslint | Sprint 5 (regression) |
| RC, v4.3.0, playtest, Vercel promote | Sprint 6 (active) |

## Draft table extras

When showing the automate skill draft table, add a row:

| Draft field | What will open in the editor |
|-------------|------------------------------|
| Roadmap scope | Sprint N / priority (P0–P2) / pattern 1–7 above |
| Exit criteria | Copy the matching checklist bullets from ROADMAP §8.C or §1 |
| Sprint mode | `regression` (0–5) vs `active` (Sprint 6, Sprint 2 partial) |

## File references in automations

Only `@`-mention or embed repo paths in the automation prompt when the automation runs in **IETGLIM/Volodka** and the file is **committed** on the target branch (automate skill repo-file rule). Prefer `ROADMAP.md` and sprint-specific paths from [sprint-patterns.md](sprint-patterns.md).

## What not to automate here

- Do not use `npm run check` alone as a CI substitute — it skips `test:unit` and orders assets differently than CI.
- Do not schedule poem or narrative rewrites without human review on PRs.
- Do not prefill MCP actions for servers not authenticated in the current session (automate MCP auth gate).
- Do not assign greenfield Sprint 0–5 implementation work — those exit criteria are already met; use regression checks instead.

## Additional resources

- Sprint checklists and file targets: [sprint-patterns.md](sprint-patterns.md)
