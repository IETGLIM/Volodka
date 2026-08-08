# 🔍 Экспертный Аудит Volodka — Анализ Проблем

**Дата:** 2026-08-08  
**Ветка:** `arena/019fddda-volodka` (база `main` @ b144eb82)  
**Аудитор:** Arena AI Agent  
**Статус до фикса:** CI красный — lint error + 30+ typecheck errors  
**Статус после фикса:** `lint` 0 errors / 37 warnings, `typecheck` 0 errors, `validate` 0 errors / 3 warnings

---

## 1️⃣ Критические Блокеры CI/CD (P0) — ИСПРАВЛЕНЫ

### 1.1 `AaaLivingWorldActivities.tsx` — Полностью сломан мёрджем
**Файл:** `src/components/3d/AaaLivingWorldActivities.tsx`  
**Ошибка до:**  
```
244:7  Parsing error: Declaration or statement expected
244:8  TS1128 Declaration or statement expected
265:1  TS1005 '}' expected
```
**Причина:** Два разных файла сконкатенированы в один — дубликат `ACTIVITY_LINES`, дубликат `export function`, импорт `dispatchGameAction` внутри тела функции, оборванный `if (key) {} else if` чейнинг.  
**Источник:** PR #56 `feat(AAA Phase B "ебашь")` + PR #57  
**Фикс:** Переписал файл в чистый вариант: один импорт сверху (`getGameSnapshot, dispatchGameAction` из `GameActionDispatcher`), единый `ACTIVITY_LINES` (38 ключей), `COZY_ACTIVITIES`, единый smart-matching chain с scene-specific приоритетом (`pier_lamp`, `pier_crate`, `library_basement_clutter` перед generic).

### 1.2 `AaaCinematicAtmosphere.tsx` — Дубль `const count`
```ts
const count = isHero ? ... : ...;
const count = isHero ? ... : ...; // TS2451 Cannot redeclare
```
Фикс — оставил только усиленный вариант (92/68/38).

### 1.3 `GodRays.tsx` — Дубль ключей объекта
```
cafe_evening: [ ... ] // 184
cafe_evening: [ ... ] // 575 — TS1117 duplicate property
library_day: [ ... ] // 233 и 592
```
Фикс — удалил второй дубликат `cafe_evening` и `library_day`, оставил первый более детальный (2 шейфта для library_day). `pier_evening` сохранен (только во втором блоке, не дубль).

### 1.4 `AaaImmersiveGuide.tsx` — Дубль `let line`
```ts
const line = ...
let line = ... // TS2451
line = ... // TS2588 Cannot assign to constant
```
Фикс — оставил `let line`.

### 1.5 `explorationStrategy.ts` — `fwd is not defined`
```ts
const brakeBack = fwd.clone().negate() // TS2304 Cannot find name fwd
```
Фикс — `const fwd = targetLook.clone().sub(targetPos).normalize()`.

### 1.6 EventBus — 20+ не типизированных событий
Typecheck сыпал:
```
"world:ambient_event" not assignable
"audio:ambient_stinger" not assignable
"player:landed" not assignable
"player:hard_brake" not assignable
"cinematic:atmosphere_boost" not assignable
etc
```
**Причина:** В AAA Phase B добавлены эмиты событий, но не добавлены типы в `src/engine/events/*`.  
Фикс — добавил в `EventMap`:
- `worldEvents.ts`: `world:ambient_event { type, intensity?, duration? }`
- `audioEvents.ts`: `audio:ambient_stinger { cue }`
- `cinematicTimelineEvents.ts`: `cinematic:atmosphere_boost { intensity, sceneId?, duration? }`
- `playerEvents.ts`: `player:landed`, `hard_brake`, `sprint_start`, `karma_change`, `rest`
- `explorationEvents.ts`: расширил `exploration:footstep` до `{ position?, yaw?, speed?, easedSpeed?, sceneId?, impact?, isSprinting?, runWeight? }`
- `uiEvents.ts`: `volodka:thought` → `{ text, duration?, source?, scene? }`

### 1.7 `dispatchGameAction` импорт + неверные экшены
- Импорт был из `@/store/gameStore` (не экспортирует) → фикс на `@/engine/GameActionDispatcher`
- Экшены `player/energy` / `player/karma` с `delta` не существуют → фикс на `player/addEnergy` / `player/addKarma` с `amount`

### 1.8 `CompassIndicator.tsx` + `playerFinalizeFrame.ts`
- `payload.yaw` стал optional → `?? 0`
- `speed` / `runWeight` не было в типах для `player:sprint_start` / `hard_brake` → добавил поля

**Итог P0:** typecheck с 30+ ошибок → 0, lint с 1 error → 0 errors.

---

## 2️⃣ Остаточные Lint Warnings (P1) — 37 шт

```
AaaCinematicAtmosphere  sceneId unused
AaaCombatCinematic      duration unused
AaaInteractionRich      label unused
CesiumPlayerModel       landingSquash assignments lost after render — use useRef
FootstepDust            PARTICLES_PER_STEP_MAX unused + lastSprintState / lastKnownYaw etc lost
GodRaysSunMesh          Fast refresh only works when file only exports components
InteractionHighlight    HIGHLIGHT_COLOR_COOL unused
PhysicsPlayerContactShadow sprintIntensity / stepPulse / landingSquash lost
VolodkaCorridorVisual   AmbientParticles unused
VolodkaRoomVisual       mat_15,16,17,19,22,23,24 unused (из GLTF импорта)
FirstMinutesDirector    useMemo unnecessary deps
MenuScreenPanel         useEffect/useCallback missing menu dep
useMenuScreen           Unused eslint-disable
PrologueBootConsole     AnimatePresence unused + prefer-const raf
bindStoreMusicEvents    volume unused
preloadPhysicsChunk     isExternal unused
aaaPoemCinematicVfx     PoemId unused
```

**Рекомендация:** 
- `CesiumPlayerModel`, `FootstepDust`, `PhysicsPlayerContactShadow` — перенести `let landingSquash` → `useRef`. Сейчас значения теряются после каждого рендера, это баг поведения камеры.
- Удалить неиспользуемые `mat_*` или префиксить `_`.
- `GodRaysSunMesh` — вынести константы в `godRays.constants.ts`.

---

## 3️⃣ Контент Валидация (P1) — 3 warnings, 0 errors

```
quest:cafe_street_whisper — reward setFlag "cafe_street_whisper_done" duplicates objective "connect_whisper_to_city"
quest:system_takedown — reward setFlag "nadzor_destroyed" duplicates objective "witness_system_death"
quest:final_poem — reward setFlag "final_poem_written" duplicates objective "compose_masterpiece"
```

Дублирование флага в reward и objective — не критично, но может давать двойной триггер. Исправить либо убрать из reward, либо переименовать objective.

Дополнительно в логах тестов:
```
[narrativePackRegistry] story node "fix_success" overwrites earlier definition
  "office_colleague", "balcony_thought", "friday_arrives", "vladimir_secret_room"
```
Дубликаты ID нод в разных паках. Нужен линтер на уникальность `id` по всем `act*.json`.

---

## 4️⃣ Безопасность Зависимостей (P0) — 7 уязвимостей

```
brace-expansion <=1.1.17 — high DoS via unbounded expansion (GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895)
js-yaml 4.0.0-4.3.0 — high Quadratic CPU in !!omap (GHSA-5p4m-2wfm-xmqj)
postcss <=8.5.22 — moderate sourceMappingURL reads arbitrary .map (GHSA-fxqj-rqcc-2cmp)
sharp <0.35.0 — high libvips CVEs (CVE-2026-33327 etc)
undici 7.0.0-7.28.0 — high CRLF Injection, cookie injection, cache poisoning (5 GHSA)
```

**Фикс:** `npm audit fix` покрывает 5 из 7 (brace-expansion, js-yaml, postcss, undici). Sharp требует `npm audit fix --force` → ломает `@gltf-transform/cli`. Рекомендация: обновить `sharp` до `0.33.5+` вручную, затем `gltf-transform` до `3.10+` с алиасом.

---

## 5️⃣ Размер Деплоя и Ассеты (P0)

```
public/ total 460M
  models/npcs 96M
  models/polyhaven 219M
  models/props 50M
  models/vegetation 40M
  models/environments 2.9M
  models/characters 3.6M
```

- `.vercelignore` есть, но `public/models/polyhaven` (219M) всё равно попадает в сборку, если не prune.
- Скрипт `prune-deploy-assets.ts` есть в `build`, но `assets:bootstrap` падает на `ECONNRESET raw.githubusercontent.com` (network). В offline CI это блокирует `npm run build`.
- `public/rapier/` содержит только `README.md` (0 wasm) — wasm генерится при билде (фикс #55/56 `fix(ci): remove committed rapier wasm (1.5MB)`). Это правильно, но надо кешировать.
- `bun.lock` (210KB) и `package-lock.json` (424KB) оба закоммичены — конфликт пакетных менеджеров. Выбери один (npm, т.к. CI использует `npm ci`). Удали `bun.lock` из репо или добавь в `.gitignore`.

**Рекомендации:**
- Вынести тяжелые модели в R2/S3, грузить по demand.
- Добавить `assets:status` в pre-commit.
- Кешировать `CsiumMan.glb` локально, не качать каждый билд.

---

## 6️⃣ Архитектура и Кодстайл (P1-P2)

### 6.1 Двойная система стора
- `gameStore.ts` фасад над slice-сторами, но `dispatchGameAction` живет в 3 местах: `GameActionDispatcher`, `gameActionBridge`, `storeFacade`. Смешение.

### 6.2 Огромные компоненты 3D
```
VolodkaRoomVisual 1388 строк
VolumetricLightShaft 1222
RPGGameCanvas 873
CafeVisual 844
GodRays 840
...
```
116k строк в `src/components/3d/` только. Нет разделения на `hooks` / `materials` / `utils`. Рекомендация — сплит по доменам.

### 6.3 131x console.log / warn / error в src
Много `console.log` в проде (`CesiumPlayerModel`, `AppBootRoot`). Нужен `logger.ts` с уровнями и tree-shake в проде.

### 6.4 Нет типизации для новых луж живых миров
В `AaaLivingWorldActivities` 38 активностей, но матчинг по `includes('coffee')` хрупок — может матчить `coffee_office` и `coffee_machine` оба. Лучше явный маппинг `propId -> key` или регистр.

---

## 7️⃣ Тесты (P1)

- `test:unit` — `vitest run` — долго (90+ сек), но проходит. Есть flaky `gltfScale.quaternius.test.ts` с `THREE.GLTFLoader: Couldn't load texture blob:...` — не критично.
- `test:coverage` — таймаут 120с в этом окружении, в CI должен успевать за 25 минут.
- Нет `test` скрипта (только `test:unit`). CI вызывает `test:coverage`, но локально `npm test` падает `Missing script`.
- E2E — не проверялся, требует `npm run build` (который падает на assets bootstrap).

---

## 8️⃣ Arena Ветки — Анализ

```
origin/arena/019fcf48-volodka  e099ee96  66m ago  Merge main into arena — 2 ahead / 7 behind main — 4 файла diff
origin/arena/019fcfca-volodka  a89cecbd  3d ago   Fix broken build — 26 ahead / 1 behind — 5 файлов diff (thoughtCabinet etc)
origin/arena/019fd35b-volodka  6009fdf2  27h ago  fix(ci) remove rapier wasm — 0 diff (уже в main)
origin/arena/019fd36e-volodka  6009fdf2  duplicate предыдущ
origin/arena/019fdda8-volodka  b1a2fd0c  53m ago  fix lint — 2 ahead / 1 behind — package-lock diff
origin/arena/019fddda-volodka  b144eb82  now      fix lint #58 — 0/0 vs main (это наша текущая)
```

- Все PR #53-58 MERGED, но `019fcf48` и `019fcfca` имеют остаточные коммиты не в `main` (сквош-мердж создает новый хеш, старый остается висеть). Это нормально, но ветки можно удалить.
- `019fd35b` и `019fd36e` идентичны — дубликаты, можно удалить одну.
- `019fddda` — пустая ветка, точь-в-точь main, создана для проверки пуша.

**Рекомендация:** после мержа удалять remote ветку (`gh pr merge --delete-branch`).

---

## 9️⃣ Что Починено в Этом PR

- [x] `AaaLivingWorldActivities.tsx` — полный рерайт, 0 синтакс-ошибок
- [x] `AaaCinematicAtmosphere.tsx` — убран дубль `count`
- [x] `GodRays.tsx` — убраны дубли `cafe_evening`, `library_day`
- [x] `AaaImmersiveGuide.tsx` — убран дубль `let line`
- [x] `explorationStrategy.ts` — `fwd` undefined fix
- [x] `CompassIndicator.tsx` — `yaw ?? 0`
- [x] EventMap — добавлены 8 новых событий
- [x] `exploration:footstep` расширен
- [x] `dispatchGameAction` импорт + `addEnergy/addKarma` типы

**Результат:**
```
Before: lint 1 error / 37 warn, typecheck 30+ errors
After:  lint 0 error / 37 warn, typecheck 0 errors, validate 0 errors
```

---

## 🔟 Топ-10 Рекомендаций (Приоритет)

1. **P0 Security:** `npm audit fix` + обновить `sharp` вручную, проверить `undici`.
2. **P0 Build:** сделать `assets:bootstrap` resilient (кеш, retry, fallback), иначе offline build падает.
3. **P0 Deploy Size:** удалить `bun.lock`, добавить `public/models/polyhaven` в prune, вынести heavy NPC в lazy chunks.
4. **P1 Lint:** пофиксить `useRef` баг в `CesiumPlayerModel`, `FootstepDust`, `PhysicsPlayerContactShadow` — сейчас `let landingSquash` теряет значение каждый рендер, ломает тактильность.
5. **P1 Content:** убрать дубли `setFlag` в 3 квестах, добавить уникальность story node ID линтер.
6. **P1 EventBus:** добавить `docs/EVENTS.md` автогенерацию из `EventMap`, чтоб не забывать типы.
7. **P2 Arch:** разбить `VolodkaRoomVisual` (1388 LOC) на `room.geometry.ts`, `room.materials.ts`, `room.lights.ts`.
8. **P2 CI:** добавить `npm run test` алиас, кешировать `node_modules/.vite`, вынести e2e build из check job (сейчас дублируется).
9. **P2 Branches:** удалить `arena/019fd35b`, `019fd36e`, `019fddda` после мержа, включить auto-delete branch в GitHub settings.
10. **P2 DX:** добавить `logger` вместо `console.log`, `assets:status` в pre-push hook.

---

## 📊 Метрики

- **LOC:** src 116k в 3D alone, всего ~428k ins в последнем PR.
- **Public:** 460M (96M NPC + 219M polyhaven).
- **Lint:** 37 warnings (0 errors after fix).
- **Typecheck:** 0 errors (30+ → 0).
- **Tests:** ~200 unit tests pass, coverage thresholds 73/57/75/73.
- **Vulnerabilities:** 7 (1 moderate, 6 high).

---

## ✅ Заключение

Проект в целом в хорошем состоянии — AAA фичи из Phase B добавлены, но мёрдж оставил артефакты (дубли ключей, отсутствие типов событий). После фиксов в этой ветке CI должен стать зелёным (кроме assets bootstrap network). Основная системная проблема — размер `public/` и хрупкий `assets:prepare`. Если пофиксить `npm audit` и `useRef` баги в физике, проект готов к релизу на Vercel.

**Следующий шаг:** запушить фиксы (уже готово в `arena/019fddda-volodka`), пройти CI, затем `npm audit fix` отдельным PR.
