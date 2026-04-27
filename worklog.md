# Worklog

## Текущее состояние (`main`, 2026-04-27)

**Продукт:** 3D web RPG в браузере (Next.js, R3F, Rapier, Zustand). Основной геймплей — свободный обход локаций; сюжет и диалоги из тех же данных (`STORY_NODES`), без отдельного «только VN»-маршрута — `docs/ADR-single-exploration-narrative-layer.md`.

**Недавние ориентиры кода:**

- Нарративный UI: `useGameUiLayout` + `currentNode` → `storyNodeShowsStoryOverlay`.
- `volodka_room`: lightmap (процедурно, слот под bake из Blender), merged shell (`mergeGeometries`), один fill-свет с тенью, мониторы на emissive + Bloom, `Suspense`/`use` для текстур комнаты, dispose на размонтировании.
- CI: `ci.yml` (tsc, vitest, player-animations, asset-budget, lint, build); Browserbase smoke — только ручной workflow.

**Проверки перед пушем сюжета/квестов:** `npx vitest run src/data/goldenPath.test.ts src/data/narrativePoetryIntegrity.test.ts`.

**Детальная история:** `CHANGELOG.md` (`[Unreleased]` — краткая сводка; релизы — от `[0.2.8]`).

---

## Архив (кратко)

| Период | Суть |
|--------|------|
| 2026-04-15 | Рефактор оркестратора в хуки, Vitest, стабильность `CoreLoop`. |
| 2026-04-16 | `CyberGameShell`, гидратация стора, AI quest schema, HUD/a11y, тач-обход. |
