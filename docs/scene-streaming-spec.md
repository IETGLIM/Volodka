# Спецификация: стриминг сцен и управление памятью (3D-обход)

Версия: **0.2** (дополнения: React↔Rapier, EventBus жизненного цикла, NPC/LOD, prefetch, persistent)  
Связанные модули: `SceneManager` (`scene:enter` / `scene:exit`), `src/config/scenes.ts` (`SceneConfig`), `src/lib/gltfModelCache.ts`, `RPGGameCanvas` / Rapier, `NPC.tsx`.

---

## 1. Цели

- **Память:** не держать в RAM/VRAM и в шаге Rapier то, что не видно и не понадобится в горизонте перехода.
- **Кадр:** асинхронная подгрузка не ломает `frameloop="always"` — только `Suspense` / отложенный mount, без перевода Canvas на `demand` без `invalidate`.
- **Наблюдаемость (фаза 0 ∥ 4):** решения координатора измеримы (очередь prefetch, оценка веса ассетов, активные чанки, **количество тел Rapier**).

---

## 2. Типы данных (фаза 0)

### 2.1 Идентификаторы

- **`SceneId`** — уже есть (`@/data/types`); граница стриминга «целой локации».
- **`StreamingChunkId`** — строка в пространстве имён сцены, например `` `${SceneId}::courtyard` ``. Уникальна в пределах игры.

### 2.2 Ярус ассета (`AssetTier`)

Приоритет для политики вытеснения и prefetch (не путать с LOD меша):

| Значение   | Смысл |
|-----------|--------|
| `critical` | Нужен для текущего `StreamingChunkId` / спавна игрока; не вытеснять при нехватке бюджета, пока активен чанк. |
| `nearby`   | Сосед по графу (см. ниже); prefetch допустим, выгрузка с **debounce** после `deactivate`. |
| `optional` | Декоративный / редкий; первым кандидат на LRU при давлении бюджета. |

### 2.3 Запись ассета в манифесте стриминга

```ts
/** Оценки для бюджета (байты — опционально, можно заполнять скриптом генерации) */
export type StreamingAssetManifestEntry = {
  url: string;
  tier: AssetTier;
  /** Грубая оценка VRAM/геометрии для координатора (0 = неизвестно) */
  estimatedTextureBytes?: number;
  estimatedGeometryBytes?: number;
  /** Связь с чанком; пусто = «вся сцена» */
  chunkId?: StreamingChunkId;
};

export type SceneStreamingProfile = {
  /** Соседние SceneId для prefetch при входе / у портала */
  neighborSceneIds: readonly SceneId[];
  /** Чанки внутри одной SceneId (порядок не задаёт граф — граф чанков отдельно при необходимости) */
  chunks?: readonly {
    id: StreamingChunkId;
    /** Ассеты, монтируемые вместе с чанком */
    assets: readonly StreamingAssetManifestEntry[];
    /** Логические ключи тел Rapier, ожидаемых после mount (см. §3 и §5) */
    rapierBodyKeys?: readonly string[];
  }[];
};
```

### 2.4 Расширение `SceneConfig` (`src/config/scenes.ts`)

Опциональное поле (обратная совместимость):

```ts
// внутри SceneConfig
streaming?: SceneStreamingProfile;
```

Пока **`streaming` не задан** — координатор не меняет поведение (только глобальные dev-счётчики, если включены).

### 2.5 Persistent-сущности (v0.1)

NPC (и прочие акторы), которые **переезжают между сценами** без полного размонтирования персонажа, помечаются в данных как **`persistent: true`** (или вынесены в отдельный слой вне `StreamingChunk`). Такие узлы **не** входят в выгрузку чанка: при `deactivateChunk` координатор не ожидает их тел в реестре чанка. До появления поля в данных v0.1 допускает «все NPC только внутри чанка» — без миграции между сценами в одном кадре.

---

## 3. React, Rapier и каденс (критично для тестов)

Координатор остаётся **чистым TS**, но **активация/деактивация чанка** обязана иметь **императивное отражение в React**: монтирование/размонтирование `<StreamingChunk>` (или эквивалента) внутри дерева, где живёт `<Physics>`.

### 3.1 Проблема каденса

После команды «активируй чанк `X`» UI добавляет поддерево, но **`RigidBody` из `@react-three/rapier` появляется в мире Rapier не раньше, чем после соответствующего commit/кадра** внутри `<Physics>`. Между `activateChunk` (логика координатора) и фактической регистрацией тел проходит **≥ 1 кадр**.

Симметрично: при `deactivateChunk` размонтирование React **асинхронно** снимает тела; пока они не удалены из WASM-мира, чанк **нельзя** считать полностью выгруженным.

### 3.2 События шины (рекомендуемый контракт)

Надёжнее, чем необязательные колбэки в интерфейсе координатора: **типизированные события в `EventBus`**, на которые подписан координатор (учёт состояния) и тесты.

| Событие | Кто эмитит | Смысл |
|---------|------------|--------|
| `streaming:chunk_activation_requested` | координатор (или store после `activateChunk`) | «Разрешить mount UI для `chunkId`» (если нужен явный сигнал; можно заменить чтением `activeChunkIds` из store). |
| `streaming:chunk_activated` | **React** (`StreamingChunk` / дочерний хук после регистрации тел) | Все ожидаемые для чанка тела **уже в мире** Rapier; координатор переводит чанк в `active` в своей машине состояний. |
| `streaming:chunk_deactivation_requested` | координатор | «Снять mount UI для `chunkId`» (или сброс флага в store). |
| `streaming:chunk_deactivated` | **React** (cleanup после `removeRigidBody` / размонтирования Rapier-компонентов) | Тела чанка **удалены** из мира; разрешены `release` GLB и LRU. |

**Правило:** `deactivateChunk` в координаторе переводит чанк в состояние **`unloading`** и **не** считает выгрузку завершённой, пока не получен **`streaming:chunk_deactivated`** для этого `chunkId`. Повторный `activate` того же `chunkId` до `deactivated` — либо noop, либо очередь (решение реализации; в спеке зафиксировать один вариант в коде).

**`activateChunk`:** после монтирования дерево обязано как можно раньше (после первого кадра с телами) эмитить **`streaming:chunk_activated`**, иначе координатор не знает, что префетч/логика «игрок в чанке» безопасны.

Полезная нагрузка: минимум `chunkId`; в реализации v0.1 у `*_requested` также `sceneId` (контекст для UI без чтения координатора); у `chunk_activated` опционально `rapierBodyCount` / `sceneId` для отладки.

---

## 4. `SceneStreamingCoordinator` (интерфейс)

Один экземпляр на приложение (или на «мир обхода»). Не заменяет `SceneManager`, а подписан на `scene:enter` / `scene:exit` и на **`streaming:chunk_*`**.

```ts
export interface SceneStreamingCoordinator {
  prefetch(sceneId: SceneId, reason: 'scene_enter' | 'portal_hint' | 'manual'): void;

  /**
   * Логическая активация: выставить store / событие, чтобы `<StreamingChunk chunkId>` смонтировался.
   * Физическая активация завершается только после `streaming:chunk_activated`.
   */
  activateChunk(chunkId: StreamingChunkId): void;

  /**
   * Запрос на выгрузку: снять mount; дождаться `streaming:chunk_deactivated` перед финальным release GLB.
   */
  deactivateChunk(chunkId: StreamingChunkId): void;

  getDebugSnapshot(): StreamingDebugSnapshot;
}

export type StreamingDebugSnapshot = {
  activeSceneId: SceneId;
  activeChunkIds: readonly StreamingChunkId[];
  /** Чанки в процессе размонтирования / ожидания Rapier */
  unloadingChunkIds?: readonly StreamingChunkId[];
  prefetchQueueLength: number;
  budgetTextureBytesApprox: number;
  rapierActiveBodiesApprox?: number;
};
```

Реализация в **`src/engine/streaming/`** (чистый TS); React — только исполнители mount и эмиттеры `chunk_activated` / `chunk_deactivated`.

---

## 5. Физика

При получении сигнала, что чанк снимается с UI (или в cleanup `StreamingChunk`):

1. Удалить все тела чанка из мира: **`world.removeRigidBody`** (или API R3F Rapier, согласованный с тем, как тела созданы).
2. Снять висячие коллайдеры без RB, если были.
3. Эмитить **`streaming:chunk_deactivated`**.
4. Уменьшать ref-count GLB / LRU **после** `chunk_deactivated`.

Реестр «тело ↔ chunkId» ведёт React (регистрация при mount) и/или координатор по событиям от детей.

---

## 6. Компонент `<StreamingChunk>` (императивный слой UI)

Расположение: например **`src/ui/3d/exploration/StreamingChunk.tsx`**.

- Потребляет **флаг активности** из лёгкого store (Zustand) или контекста, который выставляет координатор в ответ на `activateChunk` / `deactivateChunk`.
- При `active === true`: `return (<Suspense>{children}</Suspense>)`; в `useLayoutEffect` / кадре после появления `RigidBody` — **`eventBus.emit('streaming:chunk_activated', { chunkId })`** (один раз на цикл активации).
- При снятии активности: cleanup удаляет тела и в конце — **`streaming:chunk_deactivated`**.
- При монтировании: **`retainGltfModelUrl`** для URL из манифеста чанка (если список известен пропом/конфигом); при полной деактивации — **`releaseGltfModelUrl`**.

Псевдологика не заменяет реализацию, но фиксирует порядок: **событие activated строго после Rapier**, **deactivated строго после remove**.

---

## 7. Подключение (точки в коде)

| Событие / место | Действие |
|-----------------|----------|
| `scene:enter` / `scene:exit` | `prefetch`, постановка активных чанков, debounce выгрузки (как в v0.1). |
| `streaming:chunk_activated` / `deactivated` | Координатор обновляет внутреннее состояние и snapshot для HUD/тестов. |
| `gltfModelCache` | `retain` / `release` на границах жизни чанка; см. §8. |
| `GameOrchestrator` или `useSceneStreaming` | Создание координатора, подписки, `destroy` при уходе из игры. |
| `RPGGameCanvas` | Оборачивать части сцены в `<StreamingChunk>` **только** если у `SCENE_CONFIG[sceneId].streaming` заданы чанки. |

---

## 8. Prefetch и `useGLTF.preload` (drei)

**Проблема:** `useGLTF.preload(url)` пишет в **встроенный кэш drei**, а не в **`gltfModelCache`** (LRU на 14 URL + ref-count). Раздвоение кэшей даёт непредсказуемое давление на память и тесты.

**v0.1 (проще):** не вызывать `preload` отдельно; для прогрева использовать **`retainGltfModelUrl(url)`** и загрузку через тот же путь, что и игровой код (`useGLTF` внутри краткоживущего скрытого дерева **или** явный `GLTFLoader` + ручная интеграция с тем же URL — по согласованию в PR). После прогрева — либо оставить retain до реального mount чанка, либо `release` с политикой «prefetch только для `nearby`».

**v0.2+:** унифицировать один кэш (обёртка над drei или отказ от `preload` полностью).

---

## 9. Конфликт с LOD NPC (`NPC.tsx`)

Сейчас при **`useFullModel`** в дереве могут сосуществовать полный GLB и импостор, переключаемые **`visible`**. Для стриминга важно: при **размонтировании чанка** все узлы NPC этого чанка должны **размонтироваться**, а не только стать `visible={false}` — иначе ref-count и Rapier останутся живыми.

- В коде NPC уже есть очистка при размонтировании (`useGLTF.clear` и т.д. по текущей логике) — при корректном **unmount** чанка этого достаточно.
- **Тест (рекомендуемый):** «чанк с одним NPC выгружен → для всех URL моделей NPC в этом чанке `refCount` в тестовом состоянии кэша **0**» (через `__getGltfModelCacheTestState` или мок).

---

## 10. LRU и вытеснение

- **База:** `gltfModelCache` (лимит URL + ref-count).
- **`optional`:** не поднимать ref-count до фактического mount чанка.
- **Вытеснение:** только URL с `refCount === 0`; не вытеснять URL чанков в состоянии **`unloading`** (ожидание `chunk_deactivated`).

---

## 11. Наблюдаемость (фаза 4)

- **`StreamingDebugHUD`:** `NEXT_PUBLIC_EXPLORATION_STREAMING_DEBUG=1` (или общий флаг диагностики обхода).
- Показывать: `activeChunkIds`, `unloadingChunkIds`, длина очереди prefetch, приблизительный бюджет текстур, **`rapierActiveBodiesApprox`**, счётчики событий `chunk_activated` / `chunk_deactivated`.

---

## 12. План v0.1 (без переписывания мира)

1. Добавить **`streaming?: SceneStreamingProfile`** в тип `SceneConfig`; в данных пока можно не заполнять.  
2. **`SceneStreamingCoordinator`** в `src/engine/streaming/` + подписка на `scene:enter` / `scene:exit` + на `streaming:chunk_activated` / `deactivated`; no-op, если `streaming` отсутствует.  
3. **`StreamingChunk`** + тонкий store активных чанков.  
4. Один тестовый сценарий: эмиссия `chunk_activated` после мока; координатор не помечает чанк активным до события; выгрузка — до `deactivated`.  
5. Добавить типы событий в **`EventMap`** (`src/engine/events/EventBus.ts`) в том же PR, что и координатор.

---

## 13. Вне скоупа v0.1

- World grid / HLOD глобальные.  
- Полная унификация preload с LRU (§8 v0.2).  
- KTX2 / mip streaming.  
- WebGPU.
