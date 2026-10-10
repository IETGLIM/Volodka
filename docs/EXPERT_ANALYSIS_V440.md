# Экспертиза Zustand / React / R3F-drei — v4.40.0

Диагноз по прод-замеру (volodka_room, desktop, high): **FPS 21** (цель 60, минимум 55),
Frame 55.2 ms против бюджета 33.33 ms, **Budget runner 39.0 ms** (суммарный CPU всех
фрейм-тиков), **57 зарегистрированных тиков**, Physics step 1.3 ms, Zustand notifies 0,
Draw calls 1/220 (GPU не перегружен — ботлнек чисто CPU).

---

## 1. Zustand — вердикт экспертизы

Архитектура зрелая и в целом здоровая: фасад (`gameStore`) над 9 слайс-сторами,
per-frame телеметрия игрока вынесена в module-level refs (`PlayerRotationState.ts`),
движковый снапшот мемоизирован по ссылкам (`gameSnapshotCache`), flush'и коалесцируются.

**Почему «notifies 0» — артефакт измерения:** счётчик нотификаций вешается только на
фасад (`frameProfilerCounters.ts:50` — `if (!import.meta.env.DEV) return base`) и замер
снимался с prod-сборки (`:4173`), где счётчик всегда возвращает 0. Реальная нагрузка —
не в Zustand, а в тиках.

Найденные проблемы Zustand (по убыванию вреда):

| # | Место | Проблема |
|---|-------|----------|
| Z1 | `achievementWatcher.ts` | Полный снапшот-подписка без селектора: `checkTrophies()` на каждое изменение любого слайса (+динамический import + Set-аллокация) |
| Z2 | `gameStore.ts:79-85` | `setState`-override даёт двойной fan-out на серийные мутации (identity-сравнение в `flushFacadeState`) |
| Z3 | `StatisticsTab.tsx:52` | `useSyncExternalStore` на полном снапшоте — ре-рендер вкладки на любое изменение |
| Z4 | фасад vs слайсы | Одно-кадровый рассинхрон фазовых флагов (документирован `storeFacadeCutsceneLag.test.ts`) — источник «миганий» и «некорректно отрабатывает» |
| Z5 | ~12 bare-подписок `useGameStore.subscribe` без селектора | Дёшевы сейчас, но масштабируются плохо |
| Z6 | `frameProfilerCounters` | Мёртвый `incrementReactRender` — детектор лишних ре-рендеров не работает |

**Исправлено в v4.40:** Z1 (коалесценция + троттлинг 400 мс).

## 2. React — вердикт экспертизы

- Позиция/поворот игрока в стор НЕ пишутся per-frame — правильно.
- Компоненты с селекторами (`useGameSelector`/`useShallow`) — нестабильных селекторов не найдено.
- Ререндер-давление создаётся широкими бандлами (`selectMinimapHudState` включает quests+npcRelations+npcStates) — ререндер минимапы на любой прогресс квестов.
- Пер-кадровые аллокации в hot-path: `CameraModeContext` (~30 полей) в FollowCamera и `FrameGameSnapshot` в FrameBudgetRunner — ~4300 объектов/мин мусора для GC.

**Исправлено в v4.40:** обе пер-кадровые аллокации (ctx-хостинг + мемоизация снапшота).

## 3. R3F / drei — вердикт экспертизы

Каркас кадра корректен (v4.39 починил чёрный экран: отрицательные приоритеты, авторендер жив).
Физика и GPU — не узкое место. CPU съедают:

| # | Место | Проблема | Стоимость |
|---|-------|----------|-----------|
| D1 | `TriggerZoneComponent`/`NPCProximityMarker`/`SceneExitIndicator` → `ProximityGodRay` | spot+point свет на КАЖДУЮ зону/NPC/выход: 25–40 лишних light-юнитов на сцену, пухлые шейдеры всех материалов, пер-кадровый аплоад light-униформ; каждый инстанс — тик в **critical**-системе, пишущий 7 свойств каждый кадр даже в неактивном состоянии (~19 тиков в volodka_room) | ★★★★★ |
| D2 | `AaaCinematicAtmosphere` | 68–92+18 отдельных мешей с уникальными материалами, мутируемыми каждый кадр (position+opacity) — ~110 draw calls + ~110 записей материалов/кадр | ★★★★★ |
| D3 | `ExplorationPostFX` | 13+ пост-пассов, N8AO `halfRes=false` (полнорезкий depth-пре-пасс), пер-кадровые computeBloom/Vignette/Chromatic | ★★★★ |
| D4 | `Lighting.tsx` TimeOfDayAdjuster | Линейный обход `scene.children` каждый кадр + compute с неизменным аргументом | ★★ |
| D5 | `InteractionHighlight`+`AaaInteractionRich` | Два параллельных хайлайт-цикла: запись visible=false в пустые слоты каждый кадр | ★★ |
| D6 | `GodRays`/`VolumetricLightShaft` | Пер-кадровый `sanitizePositionArray` (скан всего буфера) + `needsUpdate` 60 раз/с | ★★ |
| D7 | drei `<Html>` на NPC/итемах | DOM-синк каждый кадр на каждого подписчика | ★★ |
| D8 | `EnvironmentalHazardSystem` | `filter()`-аллокация каждый кадр при 0 зон | ★ |
| D9 | `AmbientSkinnedMidLod` | 8 скелетных клонов с клонированными материалами | ★★ (улицы) |
| D10 | `MeshReflectorMaterial` (улицы) | Планарное отражение — ещё один полный рендер сцены | ★★★ (улицы) |

**Исправлено в v4.40:** D1, D2, D4, D5, D6, D8 (+троттлинг постэффектов из D3).

---

## План из 30 этапов

### Волна A — Экспертиза и диагностика (1–7) — выполнено
1. ✅ Карта репозитория, стек, точка входа, пайплайн сборки.
2. ✅ Аудит Zustand: фасад, 9 слайсов, снапшот-кэш, fan-out.
3. ✅ Аудит React: подписки, селекторы, пер-кадровые аллокации.
4. ✅ Аудит R3F/drei: Canvas, постобработка, свет, тени, GLTF, инстансинг.
5. ✅ Локализация «Budget runner 39 ms» → сумма CPU тиков, не реестр.
6. ✅ Восстановление состава 57 тиков сцены volodka_room (19 — ProximityGodRay).
7. ✅ Реестр виновников D1–D10 / Z1–Z6 с оценкой стоимости.

### Волна B — Свет и тики интеракций (8–12) — выполнено
8. ✅ ProximityGodRay: `enableLights` по умолчанию `false` (−25–40 light-юнитов).
9. ✅ ProximityGodRay: edge-triggered видимость — неактивный луч = 1 чтение ref/кадр вместо 7 записей.
10. ✅ InteractionHighlight: idle-гейт (0 записей в scene graph без активных хайлайтов).
11. ✅ EnvironmentalHazardSystem: early-out при 0 зон (−1 аллокация/кадр).
12. ✅ AaaCinematicAtmosphere: N мешей → 2×Points с шейдерным дрейфом по uTime (−~108 draw calls, −110 записей материалов/кадр).

### Волна C — Hot-path CPU (13–18) — выполнено
13. ✅ FrameBudgetRunner: мемоизация FrameGameSnapshot по ссылке стора (0 аллокаций/кадр).
14. ✅ FollowCamera: CameraModeContext в ref (−60 аллокаций 30-польных объектов/с).
15. ✅ TimeOfDayAdjuster: тик → useEffect по пропам + кэш ссылок на свет (−120 обходов scene.children/с).
16. ✅ ExplorationPostFX: рантаймы bloom/vignette/chromatic на троттлинге 10 Гц.
17. ✅ GodRays + VolumetricLightShaft: sanitize раз в 60 кадров вместо каждого.
18. ✅ achievementWatcher: коалесценция + троттлинг 400 мс (−сотни checkTrophies/мин).

### Волна D — Проверка корректности (19–22) — выполнено
19. ✅ `tsc --noEmit` без ошибок.
20. ✅ Полный юнит-прогон: 438 файлов / 2740 тестов — все зелёные.
21. ✅ Ревизия семантики: снапшот read-only, edge-triggers не ломают e2e-бриджи.
22. ✅ Отсутствие утечек: диспоз Points-геометрий/материалов в unmount.

### Волна E — itch.io готовность (23–26) — выполнено
23. ✅ Резолвер публичных ассетов: корневые '/models/...' → document-relative через LoadingManager.resolveURL (без правок сотен вызовов).
24. ✅ Rapier WASM URL через `import.meta.env.BASE_URL` (иначе 404 → fallback на inline base64 +829KB).
25. ✅ Service Worker: регистрация только на корневом хостинге ( itch.io запрещает scope '/' ).
26. ✅ Билд с `--base=./` и zip-архив для itch.io (index.html в корне архива).

### Волна F — Завершение каркаса (27–30) — выполнено в v4.41.0
27. ✅ Батчинг тиков зон: все ProximityGodRay сцены обслуживает ОДИН центральный тик `ProximityGodRayBatch` (proximityGodRayBatch.ts) — −19 записей в реестре тиков, пер-тиковый overhead один раз на кадр. Спрайты вместо drei `<Html>` (D7) отложены: в текущих сценах подписчиков `<Html>` нет в hot-path.
28. ✅ Отказ от point-light cube-теней: 13 захардкоженных ламп в 9 визуалах сцен светят без куб-теневых карт (−78 проходов рендера сцены/кадр в worst-case), привязка к земле — световые пулы `LightPoolDecal` (общая CanvasTexture, без света). N8AO `halfRes` СОХРАНЁН на false: полнорезный путь защищает от задокументированного WebGL-бага glBlitFramebuffer (n8ao#53) — риск драйвер-специфичных артефактов перед релизом неприемлем. DoF уже гейтится (bokehScale 0↔target без пересборки композера).
29. ✅ Zustand: Z2 — данные-сравнение полей фасада в `flushFacadeState` (не звеним подписчикам без изменений); Z3 — StatisticsTab читает мемоизированную узкую проекцию статистики вместо полного снапшота; Z4 — фазовые слайсы (ui/cutscene) прокидываются в фасад СИНХРОННО (isPhaseSyncSlice), одно-кадровый рассинхрон из storeFacadeCutsceneLag устранён. Z6 (счётчики диагностики) — за кадром этой волны.
30. ✅ Уличные сцены: basic-рефлектор medium/high заменён envmap-фейком (ENABLE_BASIC_WET_REFLECTOR=false; ultra SSR 1024 RT сохранён — явный пользовательский запрос); AmbientSkinnedMidLod — общий модульный кэш материалов фигур (переживает смену сцен, шейдер-программы остаются «горячими») + идемпотентность deplasticize (флаг `__deplasticized` защищает от повторного компаундинга roughnessMul). Прод-замер — на машине пользователя (headless-среда CI не воспроизводит new-game canvas).

---

## Ожидаемый эффект v4.40 (volodka_room, desktop high)

- Light-юниты: −25–40 → шейдеры всех материалов легче, аплоад light-униформ меньше.
- Draw calls атмосферы: ~110 → 2.
- Записей в scene graph из неактивных тиков: ~200+/кадр → ~0.
- Аллокации hot-path: ~4300/мин → ~0.
- Тики: 57 остаются, но большинство выходят по idle-гейту за <2 µs.
- Прогноз: Frame 55 ms → ≤ 30 ms, FPS 21 → 45–60 (финальная верификация — этап 30).
