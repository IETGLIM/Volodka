# Обход 3D: пост-обработка и чеклист ART

Сводка для «AAA+» ощущения без тяжёлых снапшот-тестов: что уже завязано на код и что сверять с [ART_BIBLE.md](./ART_BIBLE.md).

## Где правда в коде

| Слой | Файлы | Примечание |
|------|--------|------------|
| Формулы интенсивности | `src/lib/explorationPostFxState.ts` | Bloom от креатива/кармы, хрома от стресса, список кибер-грейда сцен |
| Композит | `src/ui/game/RPGGameCanvas.tsx`, `ExplorationPostFX`, `CameraEffects` | Bloom / зерно / виньетка / DOF — согласованы с `useMobileVisualPerf` |
| Тон и IBL | `ExplorationEnvironmentIbl`, `explorationIblProfiles.ts` | Сцено-зависимые пресеты |

## Чеклист (сверка с ART_BIBLE §2.3)

- [ ] **Bloom** — яркие неон/экраны; не раздувать на мобиле (`visualLite` / порог ширины).
- [ ] **Film grain** — присутствует как лёгкий слой на десктопе; отключать или ослаблять на слабых GPU.
- [ ] **Vignette** — интимность; не душить читаемость HUD.
- [ ] **Chromatic aberration** — зависит от стресса/паники (`explorationChromaOffsetFromStress`).
- [ ] **Color grading** — ветка «кибер» для сцен из `EXPLORATION_CYBER_GRADE_SCENE_IDS`.

При новых сценах с плотным неоном: добавить `sceneId` в `EXPLORATION_CYBER_GRADE_SCENE_IDS`, если палитра совпадает с `volodka_room` / `district` / `mvd`.

## Мобильный бюджет

Следовать `useMobileVisualPerf` и заметкам в [perf-exploration-notes.md](./perf-exploration-notes.md): пост — первый кандидат на урезание после FPS-просадки.
