# Спецификация: стриминг сцен и управление памятью (3D-обход)

Версия: 0.1 (черновик для согласования перед кодом)  
Связанные модули: `SceneManager` (`scene:enter` / `scene:exit`), `src/config/scenes.ts` (`SceneConfig`), `src/lib/gltfModelCache.ts`, `RPGGameCanvas` / Rapier.

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
    /** Идентификаторы тел Rapier, регистрируемых только при activate (см. §4) */
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

---

## 3. `SceneStreamingCoordinator` (интерфейс)

Один экземпляр на приложение (или на «мир обхода»). Не заменяет `SceneManager`, а подписан на его события.

```ts
export interface SceneStreamingCoordinator {
  /** Прогрев соседей и optional-tier без монтирования тяжёлых веток (GLTF preload / warm JSON). */
  prefetch(sceneId: SceneId, reason: 'scene_enter' | 'portal_hint' | 'manual'): void;

  /** Чанк становится активным: разрешить mount в React + зарегистрировать коллайдеры/тела. */
  activateChunk(chunkId: StreamingChunkId): void;

  /**
   * Чанк снимается: размонтировать визуал + **обязательно** удалить все RigidBody/collider,
   * зарегистрированные для этого chunkId (см. §4). Затем отложенный release GLB по политике tier/LRU.
   */
  deactivateChunk(chunkId: StreamingChunkId): void;

  /** Текущее состояние для HUD / тестов */
  getDebugSnapshot(): StreamingDebugSnapshot;
}

export type StreamingDebugSnapshot = {
  activeSceneId: SceneId;
  activeChunkIds: readonly StreamingChunkId[];
  prefetchQueueLength: number;
  /** Сумма estimated* из активных манифестов, если известно */
  budgetTextureBytesApprox: number;
  /** Прокси к Rapier: число активных динамических/кинематических тел в зоне обхода (если доступно) */
  rapierActiveBodiesApprox?: number;
};
```

Реализация **не** обязана жить в React; подписка на шину — в модуле `src/lib/sceneStreaming/` или `src/engine/streaming/` (чистый TS + колбэки в R3F при необходимости).

---

## 4. Физика (критично)

При **`deactivateChunk`**:

1. По реестру «тело ↔ chunkId» вызвать для каждого тела **`world.removeRigidBody`** (или эквивалент API `@react-three/rapier` / прямой Rapier, в зависимости от того, где создано тело).
2. Снять коллайдеры, не привязанные к RB, если такие регистрировались отдельно.
3. Только после этого уменьшать ref-count GLB / ставить в очередь LRU.

Иначе WASM-шаг Rapier продолжит обход «невидимых» тел — деградация без очевидного следа в JS-профайлере.

Реестр тел: заводится при **`activateChunk`** (или при первом кадре после mount чанка), ключ — стабильный `rapierBodyKey` из манифеста или автоген из `chunkId + index`.

---

## 5. Подключение (точки в коде)

| Событие / место | Действие |
|-----------------|----------|
| `eventBus` `scene:enter` | `prefetch` для `streaming.neighborSceneIds`; `activate` для чанка спавна (если есть `chunks`). |
| `eventBus` `scene:exit` | Debounce 200–500 ms → `deactivateChunk` для чанков старой сцены, не пересекающихся с новой. |
| `gltfModelCache` | Общие URL: существующие `retain`/`release`; координатор не дублирует ref-count внутри одного потребителя, а вызывает те же функции на границах activate/deactivate. |
| `GameOrchestrator` или хук `useSceneStreaming` | Один `useEffect` при `phase === 'game'`: подписка на `scene:enter`/`exit`, cleanup = отписка. |
| Dev HUD | Тот же флаг семейства `NEXT_PUBLIC_EXPLORATION_*`, что и прочая диагностика; панель читает `getDebugSnapshot()`. |

**`RPGGameCanvas`** на первом этапе не раздувается: координатор только выставляет флаги в Zustand-lite store или `eventBus` `streaming:*`, а чанки — отдельные дочерние компоненты с `key={chunkId}`.

---

## 6. LRU и вытеснение

- **База:** текущий LRU в `gltfModelCache` (лимит URL + ref-count).
- **Расширение:** для `optional` при `prefetch` не поднимать ref-count до фактического mount; при давлении бюджета — не начинать prefetch низкого приоритета.
- **Время последнего использования:** обновлять при `activateChunk` и при успешном hit в кэше; при вытеснении — только URL с `refCount === 0` (как сейчас).

---

## 7. Параллельно: наблюдаемость (фаза 4)

- **`StreamingDebugHUD`:** активен при `NEXT_PUBLIC_EXPLORATION_STREAMING_DEBUG=1` (или общий флаг диагностики обхода, если решите объединить).
- Метрики минимум: длина очереди prefetch, список `activeChunkIds`, приблизительный суммарный `estimatedTextureBytes`, `rapierActiveBodiesApprox`.

---

## 8. Следующий шаг после утверждения спека

1. Пустая реализация `SceneStreamingCoordinator` + no-op при отсутствии `streaming` в конфиге.  
2. Один `SceneId` в `SCENE_CONFIG` с заполненным `streaming.neighborSceneIds` для проверки prefetch.  
3. Тест: подписка на `scene:enter` увеличивает счётчик prefetch в snapshot (mock EventBus).

---

## 9. Вне скоупа v0.1

- Полноценный world grid и HLOD.  
- KTX2 / mip streaming (только задел полей в манифесте).  
- WebGPU — отдельное решение после стабилизации метрик.
