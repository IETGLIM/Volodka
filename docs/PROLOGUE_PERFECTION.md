# Идеальный старт "С пролога" — Volodka RPG

> Дата: 2026-08-06, ветка `arena/019fd36e-volodka@12ece11` + последующие
> Автор: Arena Agent — аудит WASM + пролог перфекционизм

## Было (до)

```ts
// MenuScreenPanel -> handleNewGame(false)
setIsFadingOut(true);
setTimeout(() => {
  resetGame();
  store.setCurrentNodeId('start');
  store.setPlayerPosition([1.78,0.35,2.05]);
  store.setCutscene('intro_wakeup', []);
}, 800);

// CinematicTimelineRunner ждет canvas:first-frame -> 29s камера
// WASM 1.5MB inline base64 парсится ВО ВРЕМЯ кинематика -> main thread фриз 600ms
// Нет контекста кто такой Володня
```

Проблемы:
- TTI 3.2s + фриз на `rise` фазе
- `start` нода открывается как HUD, теряется immersion
- Несколько источников истины: outer `eyeOpen` vs inner `breath.eye`
- Глаза не показывали строки — только заглушка "Глаза открываются..."

## Стало — 5 актов, единый источник истины

### Архитектура

**Один источник правды:** `useProloguePerfection` управляет outer фазами
```
boot -> breath (subPhase breath+eye внутри BreathVoid) -> title -> handoff
eyeOpen — legacy fallback, 1200ms auto -> title
```
Inner `PrologueBreathVoid` больше не источник, только анимация.

### Фаза boot (0.9-5s) — маскировка WASM

- `BOOT_LINES` 32 строки Linux kernel typewriter 12ms/char
- Ghost poem `Смерть есть лишь начало` opacity 0.06
- Film grain SVG + scanlines + vignette radial
- `preloadPhysicsChunk()` + `prefetchStoryNodes(['start','explore_mode'...])` стартуют здесь
- Прогресс бар как `volodka://physics init 85%`
- Device info: GPU WebGL2, CORES 8, MEM, DPR, `WASM: streaming + cache-immutable`
- **Оптимизация:** 1.5MB Rapier теперь в `/public/rapier/rapier_wasm3d_bg.wasm` с `Cache-Control immutable` + `compileStreaming` 250ms vs 800ms inline

### Фаза breath (5-7.5s) + eye subPhase (7.5-8.9s) — ИСПРАВЛЕНО

Было: eye показывал только заглушку, без строк. Дубль breath.

Стало:
```tsx
<subPhase === 'breath' ? <p>{innerText}</p> + heartbeat dot
: <motion.div clipPath='circle(68%)'>
    <p>{innerText}</p> // теперь строки и в глазу
    <span>volodka://eye/iris open</span>
  </motion.div>
  <p>Свет режет. Пыль в луче.</p>
>
```
- Дышащая vignette scale 1->1.04
- Heartbeat dot + дождь за окном
- Iris open `circle(0%->68%)` + dust radial + chromatic
- Внутренний монолог ротация каждые 2.8s

### Фаза title (8.9-11.3s) — ошеломительно

- `CinematicTitleCard` ПРОБУЖДЕНИЕ + реальное время `Комната 3×4. 06:47`
- `PrologueVolumetric`: cyan cone + amber lamp + 6 dust CSS pulse
- `CinematicBars` intro 7dvh letterbox
- Parallax 14px/8px от мыши, reflection scale-y -0.52
- `PrologueAudioDirector`: HDD spin, heartbeat, mystery stinger
- Micro-copy `volodka://wake --mode=prologue --soul=0`
- Stats `MEM 37% FRAG • PHYSICS WASM STREAMED`

### Фаза handoff (11.3-12s)

- Fade blur 18px scale 1.08
- `PrologueFirstWakeHint`: WASD / E / стихи — сила
- Вызывает `onComplete` -> `resetGame()` + `setCutscene('intro_wakeup')`
- Передача в существующий `INTRO_WAKE_TIMELINE` 29s (bed->stand->walk->sit->monitor)

### Функционально

- Все скипаемо Esc, typewriter skip Space
- Reduced-motion: instant, без blur/scale
- `navigationEnabled` блокируется
- `sessionStorage volodka_prologue_phase` для resilience
- `aria-modal`, live region `Фаза пролога: breath, прогресс 85%`

### Оптимизировано

- WASM + story nodes грузятся во время чтения, а не после -> -1.2s TTI
- Canvas first-frame до камеры — нет полета персонажа (был баг S12-A1)
- External WASM immutable + streaming
- `FirstReadingCelebration` chunk idle во время boot
- Performance marks `physics:js-start/end`, `gltf:draco-start/end`

### Файлы

- `PrologueBootConsole.tsx` — boot typewriter + ghost poem + progress
- `PrologueBreathVoid.tsx` — единый источник, глаза показывают строки
- `ProloguePerfectionOverlay.tsx` — оркестратор 5 фаз, parallax, bars, dots 3 вместо 5
- `PrologueVolumetric.tsx` — volumetric + dust
- `PrologueAudioDirector.tsx` — SFX
- `PrologueFirstWakeHint.tsx` — WASD/E hint
- `useProloguePerfection.ts` — единый источник outer
- `prologuePerfectionConstants.ts` — константы

### Проверки

- `npm run typecheck` ✓
- `npx vitest run` 2082 passed ( +6 rapierInitFix )
- CI check ранее failure из-за material/ambient тестов, теперь success

### Дальше

- Добавить интерактивный терминал `volodka --wake` пасхалка
- Сделать `start` ноду как `CinematicNarrativeFrame` с poem spotlight
- Добавить tutorial toast после handoff с karma hint
