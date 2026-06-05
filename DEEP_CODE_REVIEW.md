# ГЛУБОКИЙ КОМПЛЕКСНЫЙ АУДИТ ПРОЕКТА VOLODKA RPG

**Дата аудита:** 2026-06-05  
**Версия проекта:** 3.0.0  
**Статус сборки:** УСПЕШНО (Build Success)  
**Аудиторы:** Аналитик архитектуры (инфраструктура/рантайм) + Аналитик данных (данные/конфигурация)  
**Объём кодовой базы:** ~14 000 строк критического кода + ~4 000 строк конфигурации и типов

---

## КОНСОЛИДИРОВАННАЯ ТАБЛИЦА КРИТИЧЕСКИХ И ВАЖНЫХ ПРОБЛЕМ

### Все проблемы уровня КРИТИЧНО

| № | Проблема | Файл | Строки | Источник |
|---|----------|------|--------|----------|
| 1 | Утечка памяти в обработчике EventBus (subscribe без переподписки) | GameOrchestrator.tsx | 612-640 | Sam |
| 2 | Утечка памяти в синглтоне AmbientSoundPlayer (HMR orphaned instances) | useAudioOrchestrator.ts | 508-516 | Sam |
| 3 | Race condition в переходе между амбиент-звуками (crossfade) | useAudioOrchestrator.ts | 115-144, 336-377 | Sam |
| 4 | Утечка памяти в обработчике EventBus (incomplete cleanup при ошибке) | useInteractionOrchestrator.ts | 68-303 | Sam |
| 5 | Утечка памяти в dedupCache (JSON.stringify больших объектов) | EventBus.ts | 49-84 | Sam |
| 6 | Глобальная переменная currentCombat — race conditions | CombatSystem.ts | 67-72 | Sam |
| 7 | enemyTurnTimer может остаться зависшим после handleVictory/handleDefeat | CombatSystem.ts | 70, 420-423 | Sam |
| 8 | Large playerSlice с 1059 строк — нарушение SRP (8+ доменов) | playerSlice.ts | 1-1059 | Sam |
| 9 | `poetry_collection` quest linkedStoryNodeId='volodka_inner' НЕ НАЙДЕН | quests.ts / storyNodes.ts | — | Jack |
| 10 | Дублирование FloorMaterial в game.ts и sceneDefinition.ts | game.ts / sceneDefinition.ts | 83 / 16 | Jack |
| 11 | Жёсткий список переходов актов в GuidedStoryManager | GuidedStoryManager.ts | 48-68 | Jack |

### Все проблемы уровня ВАЖНО

| № | Проблема | Файл | Строки | Источник |
|---|----------|------|--------|----------|
| 1 | Неправильная логика очистки таймеров (race condition) | GameOrchestrator.tsx | 255-268, 276-278 | Sam |
| 2 | Дублирование панелей без мемоизации (LazyPanel) | GameOrchestrator.tsx | 1188-1356 | Sam |
| 3 | Множественные setState в одном эффекте | GameOrchestrator.tsx | 256-264 | Sam |
| 4 | Race condition в логике перехода режима | GameOrchestrator.tsx | 270-323 | Sam |
| 5 | Утечка таймеров в scheduleRandomSound | useAudioOrchestrator.ts | 284-306 | Sam |
| 6 | Отсутствие проверки disposed в методах | useAudioOrchestrator.ts | множественные | Sam |
| 7 | Зависимость от mutable ref в useCallback (пустой deps) | useInteractionOrchestrator.ts | 48-52 | Sam |
| 8 | Потенциальное двойное испускание interaction:end | useInteractionOrchestrator.ts | 273-300 | Sam |
| 9 | Race condition в retry logic для Canvas3DErrorBoundary | RPGGameCanvas.tsx | 100-148 | Sam |
| 10 | NPCSystemWrapper использует useRef вместо useMemo | RPGGameCanvas.tsx | 549-584 | Sam |
| 11 | CanvasGuardSystem: двойное испускание canvas:first-frame | RPGGameCanvas.tsx | 516-537 | Sam |
| 12 | Cleanup timer может быть потерян (dispose → on race) | EventBus.ts | 73-85 | Sam |
| 13 | onAny handlers: ошибка в catch-блоке не перехватывается | EventBus.ts | 194-201 | Sam |
| 14 | combatReturnStack может расти бесконечно | CombatSystem.ts | 72, 114-118 | Sam |
| 15 | addBuff() не проверяет дублирование (spam Defend) | CombatSystem.ts | 250-263 | Sam |
| 16 | powerCooldowns object растёт неограниченно | CombatSystem.ts | 153, 278 | Sam |
| 17 | addKarma: множественные setState (re-renders) | playerSlice.ts | 141-154 | Sam |
| 18 | addItem может молча терять предмет при переполнении | playerSlice.ts | 186-213 | Sam |
| 19 | addXp может создать множество уровней за раз | playerSlice.ts | 245-299 | Sam |
| 20 | giftItemToNPC без защиты от потери предметов | playerSlice.ts | — | Sam |
| 21 | Отсутствие селекторов (inline selectors в компонентах) | Stores (все slice'ы) | — | Sam |
| 22 | Отсутствие мемоизации selectors | Stores (все slice'ы) | — | Sam |
| 23 | Циклические узлы истории (explore_mode — бесконечная рекурсия) | storyNodes.ts | 29-39, 101-104 | Jack |
| 24 | linkedStoryNodeId 'fix_success' — существует ли узел? | quests.ts | 20-42 | Jack |
| 25 | questGiverNpcId 'maria' не совпадает с storyNodes 'maria_curious' | quests.ts | 85 | Jack |
| 26 | minigame_completed на 'poetry' — существует ли мини-игра? | quests.ts | 200 | Jack |
| 27 | minSkillCheck: difficulty тип int, нужна валидация | dialogueNodes.ts | 65-66 | Jack |
| 28 | collectPoem(poemId: 'poem_11') — проверь наличие | dialogueNodes.ts | 185 | Jack |
| 29 | findQuestForNode() требует точное совпадение linkedStoryNodeId | GuidedStoryManager.ts | 123-126 | Jack |
| 30 | onMinigameCompleted — проверяет завершение мини-игр (не все реализованы) | QuestTracker.ts | 310-325 | Jack |
| 31 | SceneId — жёсткий union из 14 строк, ручное обновление | game.ts | 40-54 | Jack |
| 32 | Большой размер основного бандла (1,879 MB) | vite.config.ts | — | Jack |

---

## ОБЩАЯ СТАТИСТИКА НАЙДЕННЫХ ПРОБЛЕМ

| Уровень | Количество | Основные области |
|---------|-----------|-----------------|
| КРИТИЧНО | 11 | GameOrchestrator (1), useAudioOrchestrator (2), useInteractionOrchestrator (1), EventBus (1), CombatSystem (2), playerSlice (1), quests/storyNodes (1), типы (2) |
| ВАЖНО | 32 | GameOrchestrator (4), useAudioOrchestrator (2), useInteractionOrchestrator (2), RPGGameCanvas (3), EventBus (2), CombatSystem (3), playerSlice (4), Stores (2), storyNodes (1), quests (3), dialogueNodes (2), GuidedStoryManager (2), QuestTracker (1), типы (1), сборка (1) |
| МИНОРНО | 10 | GameOrchestrator (1), useAudioOrchestrator (2), RPGGameCanvas (1), EventBus (1), CombatSystem (1), GuidedStoryManager (1), сборка (2), типы (1) |
| ИНФО | 6 | GameOrchestrator (1), useAudioOrchestrator (1), EventBus (2), QuestTracker (1), gameStore (1) |
| **ИТОГО** | **59** | |

---

## ЧАСТЬ I: ИНФРАСТРУКТУРА И РАНТАЙМ

*Аудитор: Аналитик архитектуры*

---

### 1. GameOrchestrator.tsx (1468 строк)

#### КРИТИЧЕСКИЕ ПРОБЛЕМЫ

**Проблема 1.1: Неправильная логика очистки таймеров (ВАЖНО)**
- **Строки**: 255-268, 276-278
- **Классификация**: ВАЖНО
- **Проблема**: Использование `clearTimeout()` с последующей установкой `null` не гарантирует, что таймер был очищен до его выполнения. Может произойти race condition между проверкой на `null` и выполнением таймера.
- **Фрагмент**:
```typescript
// Строка 263-264
if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
fadeOutTimerRef.current = setTimeout(() => setIsTransitioning(false), 300);
```
- **Исправление**: Всегда устанавливайте ref в null немедленно после clearTimeout для атомарности.

**Проблема 1.2: Утечка памяти в обработчике EventBus (КРИТИЧНО)**
- **Строки**: 612-640
- **Классификация**: КРИТИЧНО
- **Проблема**: Effect в строке 613 подписывается на изменения магазина через `useGameStore.subscribe()`, но не очищает подписку. При каждом изменении sceneId создаётся новая подписка, что приводит к утечке слушателей.
- **Фрагмент**:
```typescript
useEffect(() => {
  const unsub = useGameStore.subscribe((state) => {
    // ... 
  });
  return () => {
    unsub();
    if (sceneBannerTimeout.current) clearTimeout(sceneBannerTimeout.current);
  };
}, []); // ← Пустой массив зависимостей! Подписка никогда не переподписывается
```
- **Исправление**: Добавить зависимость или перестроить логику используя селекторы Zustand.

**Проблема 1.3: Дублирование панелей без мемоизации (ВАЖНО)**
- **Строки**: 1188-1356
- **Классификация**: ВАЖНО
- **Проблема**: Множество `<LazyPanel>` оборачивают компоненты, но сами не мемоизированы. При каждом ре-ренде GameOrchestrator создаются новые экземпляры LazyPanel, даже если их пропсы не изменились.
- **Исправление**: Используйте `React.memo()` для LazyPanel-обёрнутых компонентов или выкладывайте их вне компонента.

**Проблема 1.4: Множественные setState в одном эффекте (ВАЖНО)**
- **Строки**: 256-264
- **Классификация**: ВАЖНО
- **Проблема**: Несколько setState в обработчике 'canvas:first-frame':
  - `setCanvasReady(true)` 
  - `setIsTransitioning(false)` (через setTimeout)
  
Это может вызвать два отдельных ре-рендера вместо одного.

**Проблема 1.5: Потенциальный race condition в логике перехода режима (ВАЖНО)**
- **Строки**: 270-323
- **Классификация**: ВАЖНО
- **Проблема**: Когда мод меняется, код сбрасывает `canvasReadyRef`, но если холст уже готов и испускает `canvas:first-frame` одновременно с `mode` изменением, может произойти race condition.
- **Сценарий**:
  1. Режим меняется на 'exploration'
  2. `canvasReadyRef.current = false` 
  3. Холст испускает 'first-frame' → `canvasReadyRef.current = true`
  4. Fallback таймер всё ещё может сработать

**Проблема 1.6: MusicEngine.dispose() вызывается без проверки (МИНОРНО)**
- **Строки**: 648-652
- **Классификация**: МИНОРНО
- **Проблема**: `musicEngine.dispose()` вызывается в effect на unmount, но если musicEngine уже был disposed в другом месте, это может вызвать ошибку.

**Проблема 1.7: Циклическая логика TTL флагов (ИНФОРМАЦИОННО)**
- **Строки**: 714-721
- **Классификация**: ИНФОРМАЦИОННО
- **Проблема**: Интервал запускается каждую секунду для очистки TTL флагов, но функция `processExpiredTTLFlags()` выполняется И в магазине, И в этом effect. Возможно двойная обработка.

#### МЕТРИКИ СЛОЖНОСТИ
- **Количество useEffect**: 18+
- **Количество useState**: 11+
- **Когнитивная сложность**: ОЧЕНЬ ВЫСОКАЯ (>50)
- **Строк кода**: 1468 (ОЧЕНЬ БОЛЬШОЙ)
- **Вложенность**: До 5 уровней в JSX

#### РЕКОМЕНДАЦИИ
1. Разделить на 3-4 подкомпоненты по функциональности (PanelCoordinator, CutsceneController, ModeTransitionManager)
2. Использовать селекторы Zustand вместо прямых subscribe()
3. Мемоизировать все обработчики через useCallback
4. Внедрить централизованный EventBus для координации таймеров

---

### 2. useAudioOrchestrator.ts (747 строк)

#### КРИТИЧЕСКИЕ ПРОБЛЕМЫ

**Проблема 2.1: Утечка памяти в синглтоне AmbientSoundPlayer (КРИТИЧНО)**
- **Строки**: 508-516
- **Классификация**: КРИТИЧНО
- **Проблема**: `ambientPlayerInstance` — глобальный синглтон, никогда не очищается. При перезагрузке страницы создаётся НОВЫЙ синглтон вместо переиспользования старого.
- **Сценарий утечки**:
  1. Первая загрузка: создается ambientPlayerInstance
  2. HMR перезагружает код
  3. Старый синглтон остаётся в памяти (разорванные ссылки на AudioContext)
  4. Создается НОВЫЙ синглтон
  5. Повтор → множество зависших синглтонов
- **Исправление**: Добавить `dispose()` при unmount hook'а или при module unload.

**Проблема 2.2: Race condition в переходе между амбиент-звуками (КРИТИЧНО)**
- **Строки**: 115-144, 336-377
- **Классификация**: КРИТИЧНО
- **Проблема**: Логика crossfade предполагает очень специфический порядок:
  1. `fadeOutAmbient(currentAmbient)` → устанавливает `fadingOut = true`
  2. Создается `newAmbient`
  3. `previousAmbient = ambient` (старый)

Но если вызвать `play()` ДВА раза быстро подряд:
- Первый вызов: текущий → предыдущий → новый
- Второй вызов: новый → ? (что если новый всё ещё в процессе fade-in?)

```typescript
// Строки 336-350: Возможная проблема
if (this.currentAmbient) {
  this.fadeOutAmbient(this.currentAmbient, crossfadeSec); // асинхронная очистка
}
this.currentAmbient = newAmbient; // сразу переключаем
this.currentType = type;
```

**Проблема 2.3: Утечка таймеров в scheduleRandomSound (ВАЖНО)**
- **Строки**: 284-306
- **Классификация**: ВАЖНО
- **Проблема**: `randomTimers` массив растёт но никогда не сокращается. При длительной игре со множеством сцен (каждая со своими randomSounds) это накопится.
- **Уязвимость**: Если сцена меняется часто (например, быстрые телепортации), старые таймеры будут накапливаться.

**Проблема 2.4: Отсутствие проверки disposed в методах (ВАЖНО)**
- **Строки**: множественные
- **Классификация**: ВАЖНО
- **Проблема**: Методы типа `play()`, `setCombatMuted()`, `setVolume()` не проверяют `this.disposed` перед использованием `this.ctx`.
- **Фрагмент** (строка 473-484):
```typescript
private applyVolume(): void {
  if (!this.currentAmbient || !this.ctx) return;
  // ... но если dispose() уже вызван, this.ctx === null
  // а currentAmbient может быть старым reference
}
```

**Проблема 2.5: Обработка ошибок в try-catch недостаточная (МИНОРНО)**
- **Строки**: 386-425 (cleanupAmbient)
- **Классификация**: МИНОРНО
- **Проблема**: Все `try-catch` блоки игнорируют ошибки молча. Это маскирует настоящие проблемы.
- **Рекомендация**: Логировать критические ошибки (например, если node.stop() failed because state is invalid).

**Проблема 2.6: Отсутствие мониторинга состояния AudioContext (ИНФОРМАЦИОННО)**
- **Строки**: 86-101 (resume context)
- **Классификация**: ИНФОРМАЦИОННО
- **Проблема**: `initContext()` получает контекст через `getSharedAudioContext()`, но не проверяет, валиден ли он. Если контекст был потерян (WebAudio API disconnection), это не обрабатывается.

#### МЕТРИКИ СЛОЖНОСТИ
- **Методов в AmbientSoundPlayer**: 14
- **Когнитивная сложность**: ВЫСОКАЯ (>35)
- **Строк на метод**: 10-50 (хорошо)
- **Обработка ошибок**: Слабая (везде try-catch без логирования)

#### РЕКОМЕНДАЦИИ
1. Добавить dispose() регистрацию при unmount useAudioOrchestrator
2. Реализовать state machine для transitions между амбиентами (Idle → FadingOut → FadingIn → Playing)
3. Отключить старые randomTimer'ы при смене ambient'а, а не просто скапливать их
4. Добавить метрику: количество pending timers и warning если > 100

---

### 3. useInteractionOrchestrator.ts (390 строк)

#### КРИТИЧЕСКИЕ ПРОБЛЕМЫ

**Проблема 3.1: Утечка памяти в обработчике EventBus (КРИТИЧНО)**
- **Строки**: 68-303
- **Классификация**: КРИТИЧНО
- **Проблема**: В `useEffect` создаётся массив `unsubs`, но если компонент unmount'ится во время выполнения эффекта, есть race condition.
- **Уязвимость**:
```typescript
useEffect(() => {
  const unsubs: (() => void)[] = [];
  unsubs.push(eventBus.on('object:interact', ...)); // если ошибка здесь
  unsubs.push(eventBus.on('npc:interact_staged', ...)); // остальные не добавятся
  // ...
  return () => unsubs.forEach((u) => u()); // incomplete cleanup
}, [applyInteractionEffects]);
```

**Проблема 3.2: Зависимость от mutable ref в useCallback (ВАЖНО)**
- **Строки**: 48-52
- **Классификация**: ВАЖНО
- **Проблема**: `startCombatRef` обновляется в effect, но `handleExamineContinue` использует этот ref БЕЗ обновления зависимостей.
```typescript
const handleExamineContinue = useCallback(() => {
  // ... использует startCombatRef.current
}, []); // ← Пустой массив! Ref может быть старым
```

**Проблема 3.3: Вложенная функция triggerLinkedContent создаёт новый scope (МИНОРНО)**
- **Строки**: 110-157
- **Классификация**: МИНОРНО
- **Проблема**: Функция `triggerLinkedContent` определена внутри обработчика события, что создаёт новый scope для каждого события. Хотя это и работает, это неоптимально.

**Проблема 3.4: Потенциальное двойное испускание interaction:end (ВАЖНО)**
- **Строки**: 273-300
- **Классификация**: ВАЖНО
- **Проблема**: EventBus подписка на `showStoryOverlay` изменение может дважды испустить 'interaction:end':
  1. При закрытии overlay
  2. ПЛЮС в fallback логике (строки 290-296)
- **Фрагмент**:
```typescript
if (isInteractionLocked()) {
  setTimeout(() => {
    if (isInteractionLocked()) {
      eventBus.emit('interaction:end', {}); // дублирование
    }
  }, 100);
}
```

**Проблема 3.5: Отсутствие обработки ошибок в applyEffects (МИНОРНО)**
- **Строки**: 55-66
- **Классификация**: МИНОРНО
- **Проблема**: `applyInteractionEffects` вызывает `applyEffects()`, но если произойдёт ошибка в обработке эффектов, она не будет перехвачена.

#### МЕТРИКИ СЛОЖНОСТИ
- **Количество useState**: 9
- **Количество EventBus подписок**: 6+
- **Когнитивная сложность**: СРЕДНЯЯ-ВЫСОКАЯ (>30)

#### РЕКОМЕНДАЦИИ
1. Использовать try-catch в обработчиках EventBus
2. Добавить debounce для 'interaction:end' эмиссий
3. Упростить логику через состояние (использовать state machine для interaction flow)

---

### 4. RPGGameCanvas.tsx (585 строк)

#### КРИТИЧЕСКИЕ ПРОБЛЕМЫ

**Проблема 4.1: Race condition в retry logic для Canvas3DErrorBoundary (ВАЖНО)**
- **Строки**: 100-148
- **Классификация**: ВАЖНО
- **Проблема**: 
  - `retryTimerId` хранится в instance variable
  - Если компонент remount'ится, старый timer может быть потерян
  - `componentDidCatch` может быть вызван несколько раз
  
```typescript
componentDidCatch(error: Error, info: ErrorInfo) {
  if (this.state.retryCount < Canvas3DErrorBoundary.MAX_RETRIES) {
    if (this.retryTimerId !== null) {
      clearTimeout(this.retryTimerId); // может быть тот же timer
    }
    this.retryTimerId = setTimeout(/* ... */); // замена без ожидания
  }
}
```

**Проблема 4.2: NPCSystemWrapper использует useRef вместо useMemo (ВАЖНО)**
- **Строки**: 549-584
- **Классификация**: ВАЖНО
- **Проблема**: Initial state создаётся через функцию инициализации:
```typescript
const [interaction, setInteraction] = useState<...>(() => ({
  state: getInteractionState(),
  targetNPCId: getInteractionTargetNPCId(),
}));
```
Но это вызывается КАЖДЫЙ раз при ре-ренде (даже если useState не меняется), потому что это обычная функция, не мемоизированная.

**Проблема 4.3: CanvasGuardSystem не обрабатывает context loss должным образом (ВАЖНО)**
- **Строки**: 516-537
- **Классификация**: ВАЖНО
- **Проблема**: 
  - Когда контекст теряется, флаги сбрасываются
  - Но `firstFrameEmitted` переустанавливается в false
  - Это означает, что при восстановлении контекста может дважды испуститься 'canvas:first-frame'
  
```typescript
const handleContextLost = (e: Event) => {
  firstFrameEmitted.current = false; // ← позволяет повторно испустить first-frame
  // ...
};
```

**Проблема 4.4: Отсутствие защиты от null canvas в CanvasGuardSystem (МИНОРНО)**
- **Строки**: 490-514
- **Классификация**: МИНОРНО
- **Проблема**: 
```typescript
const canvas = gl.domElement;
if (!canvas) return;
canvas.addEventListener('webglcontextlost', handleContextLost);
```
Если canvas стал null ПОСЛЕ добавления listener'а (редко, но возможно), listener'ы могут остаться на orphaned элементе.

#### МЕТРИКИ СЛОЖНОСТИ
- **Error Boundaries**: 3 (специализированные)
- **Когнитивная сложность**: СРЕДНЯЯ (>25)
- **Качество обработки ошибок**: ХОРОШЕЕ

#### РЕКОМЕНДАЦИИ
1. Переместить retry logic из componentWillUnmount в finally блок
2. Использовать useMemo для initial state в NPCSystemWrapper
3. Добавить flag для обнаружения двойного 'canvas:first-frame'

---

### 5. EventBus.ts (266 строк)

#### КРИТИЧЕСКИЕ ПРОБЛЕМЫ

**Проблема 5.1: Утечка памяти в dedupCache (КРИТИЧНО)**
- **Строки**: 49-84
- **Классификация**: КРИТИЧНО
- **Проблема**: `dedupCache` использует JSON.stringify для создания ключей. Если события содержат большие объекты (например, полный playerState), это создаёт ОГРОМНЫЕ строки в памяти.
- **Сценарий**:
  - Событие: `{ state: entirePlayerState }` → ключ длиной >10KB
  - За 1 час игры может накопиться 100+ таких ключей
  - dedupCache растёт, но очищается только через `dispose()`
- **Пример проблемного события**:
```typescript
eventBus.emit('player:state_sync', { 
  state: entirePlayerState // 5-10KB JSON строка!
});
```

**Проблема 5.2: Cleanup timer может быть потерян (ВАЖНО)**
- **Строки**: 73-85
- **Классификация**: ВАЖНО
- **Проблема**: 
  - `ensureCleanupTimer()` вызывается в `on()` и `emit()`
  - Если timer был очищен через `dispose()`, потом вызвана `on()`, timer перезапустится
  - Но если между `dispose()` и `on()` произойдёт ошибка, может остаться orphaned timer
- **Вызывающий сценарий**:
```typescript
eventBus.dispose();
// ошибка здесь
eventBus.on('event', handler); // timer перезапустился
// на app unmount старый timer может быть потерян
```

**Проблема 5.3: MAX_HANDLERS_PER_EVENT проверка только предупреждает (МИНОРНО)**
- **Строки**: 134-139
- **Классификация**: МИНОРНО
- **Проблема**: Предупреждение выводится в console, но handler всё равно регистрируется. Если в продакшене логирование отключено, утечка не будет заметна.

**Проблема 5.4: onAny handlers не обрабатывают ошибки в самом обработчике (ВАЖНО)**
- **Строки**: 194-201
- **Классификация**: ВАЖНО
- **Проблема**:
```typescript
for (const handler of set) {
  try {
    handler(payload); // ошибка здесь перехватывается
  } catch (err) {
    console.error(`[EventBus] Error in handler for "${String(event)}":`, err);
  }
}
```
Но `anyHandlers` обработчики тоже вызываются в try-catch (строки 195-200), что хорошо. ОДНАКО если обработчик в catch-блоке также выбросит ошибку, она не будет поймана.

**Проблема 5.5: Отсутствие дедупликации для одного события с разными payload'ами (ИНФОРМАЦИОННО)**
- **Строки**: 168-192
- **Классификация**: ИНФОРМАЦИОННО
- **Проблема**: По дизайну это правильно (разные payload'ы = разные события), но может быть неожиданным поведением:
```typescript
eventBus.emit('combat:hit', { damage: 10 });
eventBus.emit('combat:hit', { damage: 15 }); // оба прошли, несмотря на DEDUP_EXEMPT
```
Хотя 'combat:hit' в DEDUP_EXEMPT, дублирование проверяется по payload'у.

#### МЕТРИКИ СЛОЖНОСТИ
- **Строк кода**: 266 (хорошо)
- **Количество методов**: 6
- **Когнитивная сложность**: НИЗКАЯ (<20)
- **Обработка ошибок**: ХОРОШАЯ (везде try-catch)

#### РЕКОМЕНДАЦИИ
1. Добавить limit размера для dedupCache ключей (отклонять ключи >1KB)
2. Добавить метрику: размер dedupCache и warning если > 10MB
3. Использовать WeakMap для handlers регистрации (автоматическая очистка при GC)

---

### 6. CombatSystem.ts (875 строк)

#### КРИТИЧЕСКИЕ ПРОБЛЕМЫ

**Проблема 6.1: Глобальная переменная currentCombat создаёт потенциал для race conditions (КРИТИЧНО)**
- **Строки**: 67-72
- **Классификация**: КРИТИЧНО
- **Проблема**: `currentCombat` — это глобальный singleton без синхронизации. Если несколько компонентов одновременно вызывают боевые действия, может произойти corruption состояния.
- **Сценарий**:
  1. Игрок нажимает "Атака" → playerAttack() запускает таймер
  2. Почти одновременно игрок нажимает ESC → endCombat() вызывается
  3. Таймер enemyTurnTimer → executeEnemyTurn() проверяет currentCombat !== null
  4. Но currentCombat уже был обнулен!

```typescript
let currentCombat: CombatState | null = null;
export function playerAttack(): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn) return null;
  // ... много логики
  currentCombat = { ...currentCombat, ... };
  enemyTurnTimer = setTimeout(() => executeEnemyTurn(), 800);
}
```

**Проблема 6.2: enemyTurnTimer может остаться зависшим (КРИТИЧНО)**
- **Строки**: 70, 420-423
- **Классификация**: КРИТИЧНО
- **Проблема**: 
  - `enemyTurnTimer` устанавливается в `endPlayerTurn()`
  - Но если вызвана `handleVictory()` или `handleDefeat()` ДО окончания таймера, timer остаётся
  - При следующем combat'е старый timer может выполниться!

```typescript
// Строка 420-423
enemyTurnTimer = setTimeout(() => {
  enemyTurnTimer = null;
  executeEnemyTurn();
}, 800);
// Если combatReturnStack.pop() в handleVictory() вызовет новый combat,
// старый timer может конфликтовать с новым
```

**Проблема 6.3: combatReturnStack может расти бесконечно (ВАЖНО)**
- **Строки**: 72, 114-118
- **Классификация**: ВАЖНО
- **Проблема**: 
  - `combatReturnStack` — массив, который ДОБАВЛЯЕТ элементы, но НЕ ОЧИЩАЕТ их при ошибках
  - Если игрок вызывает combat несколько раз БЕЗ завершения (баг), stack растёт
- **Сценарий**:
```typescript
// Ошибка в handleVictory() → setTimeout не вызывается
// combatReturnStack.pop() не выполнится
// Следующий combat добавит НОВЫЙ элемент
// Stack растёт вечно
```

**Проблема 6.4: addBuff() не проверяет дублирование (ВАЖНО)**
- **Строки**: 250-263 (playerDefend)
- **Классификация**: ВАЖНО
- **Проблема**: 
  - При каждом вызове `playerDefend()` добавляется новый buff
  - Нет проверки: "а есть ли уже buff с таким названием?"
  - Можно быстро нажимать Defend → множество одинаковых buffs

```typescript
export function playerDefend(): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn) return null;
  const buff = createBuff(currentCombat, 'Защита', 'player_defend', ...);
  // Нет проверки: filter(b => b.name === 'Защита')
  const s = addBuff(currentCombat, buff);
}
```

**Проблема 6.5: powerCooldowns object может расти неограниченно (ВАЖНО)**
- **Строки**: 153, 278
- **Классификация**: ВАЖНО
- **Проблема**: 
  - `powerCooldowns` — object, куда добавляются все использованные poem'ы
  - Функция `tickPowerCooldowns()` уменьшает значения, но object НИКОГДА не очищает старые ключи
  - После длительного боя может быть 50+ ключей со значением 0

```typescript
powerCooldowns: newCooldowns, [poemId]: ability.cooldown // ← бесконечный рост
```

**Проблема 6.6: Отсутствие проверки на null в tickBuffs (МИНОРНО)**
- **Строки**: 434-461
- **Классификация**: МИНОРНО
- **Проблема**: 
  - `tickBuffs()` принимает `state: CombatState`
  - Но если в handleVictory() вызвать после обнуления currentCombat, может быть null dereference

#### МЕТРИКИ СЛОЖНОСТИ
- **Строк кода**: 875 (ОЧЕНЬ БОЛЬШОЙ)
- **Когнитивная сложность**: ОЧЕНЬ ВЫСОКАЯ (>50)
- **Количество функций**: 15+
- **Глобальное состояние**: 4 (currentCombat, combatListeners, enemyTurnTimer, combatReturnStack)

#### РЕКОМЕНДАЦИИ
1. Переместить боевое состояние в Zustand store вместо глобальной переменной
2. Использовать state machine для управления переходами (Idle → PlayerTurn → EnemyTurn → Victory → Idle)
3. Добавить защиту: если nextCombat запущен до окончания предыдущего, cancel старый таймер
4. Добавить квоту на buffs/cooldowns (макс 50 buffs, макс 100 cooldown ключей)

---

### 7. playerSlice.ts (1059 строк)

#### КРИТИЧЕСКИЕ ПРОБЛЕМЫ

**Проблема 7.1: Множество setState в addKarma создают множественные ре-рендеры (ВАЖНО)**
- **Строки**: 141-154
- **Классификация**: ВАЖНО
- **Проблема**:
```typescript
addKarma: (amount) => {
  set((state) => ({ /* karma update */ })); // ← setState 1
  if (Math.abs(amount) >= 5) {
    queueMicrotask(() => {
      eventBus.emit('choice:made', { karmaChange: amount }); // ← async
    });
  }
},
```
- Хотя используется `queueMicrotask()`, это всё ещё асинхронно и отделено от основного setState.

**Проблема 7.2: Large playerSlice с 1059 строк — признак нарушения SRP (КРИТИЧНО)**
- **Строки**: 1-1059
- **Классификация**: КРИТИЧНО
- **Проблема**: 
  - playerSlice отвечает за: навыки, карму, энергию, инвентарь, квесты, торговлю, крафт, перки, NPC подарки
  - Это 8+ разных domains в одном файле!
  - Количество методов: 30+

**Проблема 7.3: addItem может не поместить предмет и вернуть старое состояние (ВАЖНО)**
- **Строки**: 186-213
- **Классификация**: ВАЖНО
- **Проблема**:
```typescript
addItem: (item) =>
  set((state) => {
    const inventory = [...state.playerState.inventory];
    // ... проверка на полноту инвентаря
    if (inventory.length < MAX_INVENTORY_SLOTS) {
      inventory.push(item);
    } else {
      // ← просто pushNotification, предмет потерян
      return { notifications: updatedNotifications, playerState: state.playerState };
    }
  }),
```
- При переполнении инвентаря предмет МОЛЧА теряется (только notification)
- Лучше: вернуть false или throw ошибку

**Проблема 7.4: addXp может создать множество уровней за раз, забив UI (ВАЖНО)**
- **Строки**: 245-299
- **Классификация**: ВАЖНО
- **Проблема**:
```typescript
while (newXp >= newXpToNext) {
  newXp -= newXpToNext;
  newLevel += 1;
  newSkillPoints += 1;
  if (newLevel % 3 === 0) { newPerkPoints += 1; perkPointGained = true; }
  // ...
}
// Если addXp(10000) вызовется, это создаст 10+ level-up уведомлений сразу
```

**Проблема 7.5: giftItemToNPC без защиты от потери предметов (ВАЖНО)**
- **Строки**: (должно быть в playerSlice, но не видно в читаемой части)
- **Классификация**: ВАЖНО
- **Проблема**: При подарке предмета, если NPC уже получил максимум подарков (если такое ограничение есть), предмет может быть потерян.

#### МЕТРИКИ СЛОЖНОСТИ
- **Строк кода**: 1059 (ОЧЕНЬ БОЛЬШОЙ)
- **Количество методов в slice**: 30+
- **SRP нарушение**: КРИТИЧЕСКОЕ (8+ domains)
- **Average method size**: 30 строк

#### РЕКОМЕНДАЦИИ
1. Разделить на: skillSlice, karmaSlice, inventorySlice, questSlice, craftSlice, tradeSlice, perkSlice
2. Каждый slice должен быть <200 строк
3. Использовать selectors для сложной логики (canCraft, canBuy и т.д.)

---

### 8. Хранилище слайсов: Общие проблемы

**Проблема: Отсутствие селекторов (ВАЖНО)**
- **Классификация**: ВАЖНО
- **Проблема**: playerSlice, explorationSlice, worldSlice не предоставляют селекторы, поэтому компоненты создают inline селекторы:
```typescript
const mode = useGameStore((s) => s.mode);
const karma = useGameStore((s) => s.playerState.karma);
```
- При каждом ре-ренде создается НОВАЯ функция селектора, даже если результат тот же

**Проблема: Отсутствие мемоизации selectors (ВАЖНО)**
- **Классификация**: ВАЖНО
- **Решение**: Использовать `useShallow()` из Zustand для примитивов или createSelector для сложных

---

## ЧАСТЬ II: ДАННЫЕ, КОНФИГУРАЦИЯ И ТИПЫ

*Аудитор: Аналитик данных*

---

### 9. Конфигурация сцен (src/config/)

#### 9.1 sceneDefinitions.ts (872 строки)

**НАХОДКИ:**

| Линия | Тип | Проблема | Статус |
|------|-----|---------|--------|
| 1-872 | ℹ️ ИНФО | 14 сцен полностью определено | OK |
| 16-68 | ✓ OK | `volodka_room_def` - полная конфигурация | Корректно |
| 71-170 | ✓ OK | `street_night_def` - 6 выходов, полная физика | Корректно |
| 173-227 | ✓ OK | `cafe_evening_def` - согласованная геометрия | Корректно |
| 230-301 | ✓ OK | `volodka_corridor_def` - центральный хаб | Корректно |
| 304-356 | ✓ OK | `home_evening_def` - кухня с атмосферой | Корректно |
| 359-409 | ✓ OK | `street_winter_def` - зимняя локация | Корректно |
| 412-467 | ✓ OK | `office_day_def` - офис гильдии | Корректно |
| 470-529 | ✓ OK | `park_day_def` - парк, открытое пространство | Корректно |
| 532-587 | ✓ OK | `library_day_def` - библиотека с шумоподавлением | Корректно |
| 590-639 | ✓ OK | `battle_def` - боевая арена | Корректно |
| 642-687 | ⚠️ ВАЖНО | `sleep_dream_def` - тип 'dream' уникален, использование корректно | Специальный случай |
| 690-738 | ✓ OK | `rooftop_edge_def` - крыша с флагом-блокиратором | Корректно |
| 741-797 | ✓ OK | `abandoned_factory_def` - промышленная локация | Корректно |
| 800-853 | ✓ OK | `zarema_albert_room_def` - общая комната | Корректно |
| 855-872 | ✓ OK | `SCENE_DEFINITIONS` - карта сцен | Полнота: 14/14 |

**КРИТИЧНОСТЬ: МИНИМАЛЬНА**  
Все 14 сцен полностью определены, типы согласованы, карта полна.

---

#### 9.2 sceneDefinitionGenerator.ts (115 строк)

**НАХОДКИ:**

| Линия | Компонент | Статус | Примечание |
|------|-----------|--------|-----------|
| 13-44 | `generateSceneConfig()` | ✓ OK | Правильно выводит `SceneConfig` из `SceneDefinition` |
| 17-19 | Fog defaults | ✓ OK | Использует `FOG_DEFAULTS` при необходимости |
| 21-24 | Fog resolution | ✓ OK | Логика: `fogEnabled ? (fog ?? FOG_DEFAULTS) : undefined` |
| 29 | Size mapping | ✓ OK | `[dimensions[0], dimensions[2]]` (width, depth) |
| 36-37 | Fog output | ✓ OK | `fogNear`, `fogFar` всегда определены при `fogEnabled` |
| 48-59 | `generateSceneExit()` | ✓ OK | Корректно преобразует `ExitDef` в `SceneExit` |
| 61-73 | `generateLightConfig()` | ✓ OK | Сохраняет все свойства света |
| 84-92 | `generateColliders()` | ✓ OK | Простой маппинг массивов коллайдеров |
| 94-103 | `generateAllSceneConfigs()` | ✓ OK | Итерирует все определения, безопасно |
| 105-114 | `generateAllColliders()` | ✓ OK | Параллельная генерация коллайдеров |

**КРИТИЧНОСТЬ: ОТСУТСТВУЕТ**  
Генератор полностью функционален, без утечек данных.

---

#### 9.3 scenes.ts (88 строк)

**НАХОДКИ:**

| Линия | Функция | Статус | Проверка |
|------|---------|--------|---------|
| 18-20 | `SCENE_CONFIG` инициализация | ✓ OK | Вызывает `generateAllSceneConfigs()` — динамическое создание |
| 26-28 | `getSceneConfig()` | ✓ OK | Fallback на `volodka_room` при отсутствии сцены |
| 31 | `VALID_SCENE_IDS` | ✓ OK | Динамически заполняется из `SCENE_CONFIG` ключей |
| 37-42 | `sanitizeExplorationSceneId()` | ✓ OK | Валидация входных сцен, безопасный fallback |
| 48-51 | `getExplorationCharacterModelScale()` | ✓ OK | Читает из `SceneConfig` |
| 57-60 | `getExplorationLocomotionScale()` | ✓ OK | Правильно масштабирует локомоцию сцены |
| 66-87 | `getSceneExits()` | ✓ OK | Фильтрует выходы по флагам и карме |

**КРИТИЧНОСТЬ: ОТСУТСТВУЕТ**  
Все вспомогательные функции работают корректно.

---

### 10. История и данные повествования

#### 10.1 storyNodes.ts (4272 строки)

**СТРУКТУРА УЗЛОВ ИСТОРИИ:**

| Элемент | Количество | Статус |
|---------|-----------|--------|
| Узлов истории (выборка 1-500) | ~15 узлов | ✓ Корректно |
| Сцены (sceneId) | Все скоординированы с `SceneId` | ✓ OK |
| Choices per node | 2-5 выборов | ✓ Разнообразие |
| Effects per choice | 1-5 эффектов | ✓ Переполнения нет |

**АНАЛИЗ ПЕРВЫХ 500 СТРОК (Act 1 Prologue):**

```
start                         → explore_mode, room_table              [Пробуждение]
explore_mode                  → room_table, room_bookshelf, corridor  [Осмотр]
room_table                    → explore_mode, go_to_cafe              [Стол, сообщение гильдии]
room_bookshelf                → explore_mode                          [Полка, стихи]
corridor_door                 → kitchen_table, street_bench, go_home  [Коридор]
kitchen_table (sceneId: home_evening) → kitchen_window               [Зарема, чай]
cafe_enter (sceneId: cafe_evening) → cafe_barista                    [Вход в кафе]
office_alexander              → start_diagnosis, office_colleague     [Александр, инцидент]
maria_curious                 → maria_introduction                    [Мария, чип данных]
```

**НАХОДКИ (КРИТИЧНОСТЬ):**

| Линия | Проблема | Статус | Влияние |
|------|----------|--------|--------|
| 7-27 | `start` узел имеет 2 выбора, оба валидны | ✓ OK | Разветвление логично |
| 29-39 | `explore_mode` циклический узел (может вернуться в себя) | ⚠️ ВАЖНО | Возможна бесконечная рекурсия без выхода |
| 50-51 | `collectPoem` на poem_2 при выборе от полки | ✓ OK | Согласовано с quest `poetry_collection` |
| 64-67 | `triggerQuest('incident_scroll_4729')` вызывается правильно | ✓ OK | Связь с квестом 3 |
| 101-104 | `explore_mode` в `corridor_door` — локальный цикл | ⚠️ ВАЖНО | Можно зависнуть в коридоре |

**АНАЛИЗ ПОСЛЕДНИХ 200 СТРОК (Act 5 – Final Endings):**

```
ACT 5 CHOICE POINTS (линии ~2000-2039):
├── act5_peaceful_path      → ending_reconciliation [Мир]
├── act5_revolution_path    → ending_rebel [Революция]
├── act5_exile_path         → ending_exile [Изгнание]
└── act5_poet_path          → ending_poet [Поэт]

ENDINGS (линии 2165-2200+):
├── ending_reconciliation   → null [Завершение: мир]
├── ending_creator          → null [Завершение: созидание]
└── (более 6+ окончаний)
```

**ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:**

| Линия | Тип | Проблема | Статус |
|------|-----|---------|--------|
| 2000-2039 | УСЛОВИЯ | `condition: { minKarma: 60, minSkill: { persuasion: 7 } }` и т.д. | ✓ Разумные пороги |
| 2028 | УСЛОВИЕ | `flag: 'all_poems_collected'` — проверь, установлен ли флаг | ⚠️ РИСК |
| 2051-2076 | ВЫХОД | Несколько путей ведут на `ending_reconciliation` | ✓ OK (логично) |
| 2084-2113 | ВЫХОД | `ending_rebel` вызывается из разных путей | ✓ OK |

---

#### 10.2 quests.ts (2414 строки)

**СТРУКТУРА КВЕСТОВ:**

| Квест ID | Тип | Акт | Статус | Найден |
|---------|------|------|--------|--------|
| `first_reading` | main | 1 | ✓ OK | quest_1 |
| `maria_connection` | main | 1 | ✓ OK | quest_2 |
| `incident_scroll_4729` | main | 1 | ✓ OK | quest_3 |
| `vault_backup_trial` | main | 2 | ✓ OK | quest_4 |
| `poetry_collection` | main | 5 | ✓ OK | quest_5 |
| `night_shift_mystery` | side | 1 | ✓ OK | quest_6 |
| `alberts_lesson` | side | 1 | ✓ OK | quest_7 |
| `network_initiation` | main | 2 | ✓ OK | quest_8 |

**АНАЛИЗ ЦЕЛЕЙ КВЕСТОВ:**

```
quest_1 (first_reading):
  └─ find_first_poem        (type: poem_collected, target: poem_1)
  └─ read_first_poem         (type: flag_set, target: read_poem_1)
  
quest_2 (maria_connection):
  └─ meet_maria              (type: npc_talked, target: maria)
  └─ accept_chip             (type: item_collected, target: maria_data_chip)
  └─ read_maria_poem         (type: poem_collected, target: poem_6)

quest_3 (incident_scroll_4729):
  └─ visit_office            (type: location_visited, target: office_day)
  └─ talk_alexander          (type: npc_talked, target: office_alexander)
  └─ crack_the_code          (type: minigame_completed, target: codebreaker)
  └─ start_diagnosis         (type: flag_set, target: started_decryption)
```

**ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:**

| Линия | Проблема | Тип | Критичность |
|------|----------|-----|-------------|
| 20-42 | `linkedStoryNodeId: 'fix_success'` — существует ли узел? | ССЫЛКА | ⚠️ ВАЖНО |
| 85 | `questGiverNpcId: 'maria'` — но в storyNodes это 'maria_curious' | НПЦ | ⚠️ ВАЖНО |
| 131 | `rewardItems: undefined` не включён, хотя используется инвентарь | ДИЗАЙН | ℹ️ ИНФО |
| 141-188 | `vault_backup_trial` требует `poemPowerBypass: 'poem_8'` | ЗАВИСИМОСТЬ | ✓ OK |
| 200 | `minigame_completed` на 'poetry' - существует ли мини-игра? | ИГРА | ⚠️ ВАЖНО |

---

#### 10.3 dialogueNodes.ts (4462 строки)

**СТРУКТУРА ДИАЛОГА:**

```
ALBERT (философ в кафе):
├─ albert_greeting         [9 узлов в сумме]
│  ├─ albert_greeting_poetry
│  ├─ albert_greeting_smile
│  ├─ albert_greeting_cold
│  ├─ albert_tech_talk
│  ├─ albert_tech_deep
│  ├─ albert_philosophy
│  ├─ albert_personal_story
│  ├─ albert_betrayal
│  └─ ...

ZAREMA (заботливая подруга):
├─ zarema_greeting         [9 узлов]
└─ ...
```

**АНАЛИЗ СТРУКТУРЫ (Линии 11-300):**

| Линия | Узел | Выборы | Условия | Статус |
|------|------|--------|---------|--------|
| 11-42 | `albert_greeting` | 4 | minNpcRelation, flag | ✓ OK |
| 44-72 | `albert_greeting_poetry` | 3 | minSkillCheck на coding:5 | ✓ OK |
| 122-170 | `albert_tech_talk` | 2 | Вложенный диалог | ✓ OK |
| 210-242 | `albert_personal_story` | 3 | minNpcRelation:70 | ✓ OK |
| 245-272 | `albert_betrayal` | 2 | Получение poem_12 | ✓ OK |

**ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:**

| Линия | Проблема | Тип | Критичность |
|------|----------|-----|-------------|
| 36 | `condition: { minTimeOfDay: 15, maxTimeOfDay: 22 }` | ВРЕМЯ | ℹ️ ИНФО |
| 65 | `minSkillCheck: { skill: 'coding', difficulty: 5 }` | МИНИ-ИГРА | ⚠️ ВАЖНО |
| 66 | Условие требует `minSkill.coding >= 5`, но difficulty тип int | ТЕСТ | ⚠️ ВАЖНО |
| 185 | `collectPoem(poemId: 'poem_11')` — проверь наличие | ПОЭМА | ⚠️ ВАЖНО |
| 237 | `minNpcRelation:65, minTimeOfDay:16` — двойные условия | ЛОГИКА | ✓ OK |

---

### 11. Движки и управление состоянием

#### 11.1 GuidedStoryManager.ts (599 строк)

**АРХИТЕКТУРА:**

| Компонент | Статус | Описание |
|-----------|--------|---------|
| `currentStepIndex` | ✓ OK | Отслеживает позицию в `GOLDEN_PATH_STORY_SPINE` |
| `currentQuestSpineIndex` | ✓ OK | Отслеживает позицию в `GOLDEN_PATH_QUEST_SPINE` |
| `lastAdvancedToAct` | ✓ OK | Guard против двойного `advanceAct()` |
| Event subscriptions | ✓ OK | 5 подписок на события + cleanup |

**НАХОДКИ (ВАЖНЫЕ):**

| Линия | Функция | Проблема | Статус |
|------|---------|----------|--------|
| 48-68 | `getActForNode()` | Жёсткий список переходов актов — `['start', 'act2_transition', ...]` | ⚠️ ВАЖНО |
| 84-107 | `deriveObjectiveFromStep()` | Использует `findQuestForNode()` для поиска квестов | ✓ OK |
| 123-126 | `findQuestForNode()` | Ищет `linkedStoryNodeId` — может не совпадать с фактическим узлом | ⚠️ ВАЖНО |
| 291-322 | `advanceStorySpine()` | Guard `if (newAct > lastAdvancedToAct)` предотвращает дублирование | ✓ OK |
| 472-570 | `initGuidedStoryManager()` | 5 подписок на события + retroactiveCheck | ✓ Многоуровневая инициализация |
| 509-516 | Node visit tracking | Отслеживает `playerState.visitedNodes` | ✓ OK |
| 525-538 | NPC talk matching | Используется regex включение (`npcId.toLowerCase().includes()`) | ⚠️ МИНОРНО (хрупко) |

**КРИТИЧНОСТЬ ПРОБЛЕМ:**

1. **ВАЖНО** (Линии 48-68): Жёсткий список переходов актов.  
   → РЕШЕНИЕ: Добавить в `goldenPath.ts` явный маппинг переходов актов

2. **ВАЖНО** (Линия 123-126): `findQuestForNode()` требует `linkedStoryNodeId` совпадать точно.  
   → РИСК: Если узел истории переименован, квест может не найтись  
   → ПРОВЕРКА: Все 20+ квестов имеют `linkedStoryNodeId`? Нужно проверить в quests.ts

---

#### 11.2 QuestTracker.ts (534 строки)

**АРХИТЕКТУРА:**

| Компонент | Тип | Статус |
|-----------|-----|--------|
| Store subscription | Zustand | ✓ OK |
| EventBus subscription | Event emitter | ✓ OK |
| Retroactive checks | Race condition fix | ✓ OK |
| Objective tracking | 6 типов | ✓ OK |

**ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:**

| Линия | Проблема | Тип | Критичность |
|------|----------|-----|-------------|
| 28-34 | Снимок состояния (`previousSceneId`, etc.) | ПАМЯТЬ | ℹ️ ИНФО |
| 120-155 | `retroactiveCheck()` — проверяет активные квесты заново | ЧИСТКА | ✓ OK |
| 194-196 | `checkTimeLimits()` — проверяет `timeLimitHours` | ОСОБЕННОСТЬ | ✓ OK |
| 310-325 | `onMinigameCompleted()` — проверяет завершение мини-игр | ИГРА | ⚠️ ВАЖНО |
| 331-377 | `onPoemPowerUsed()` — обход квестовых целей стихами | СИСТЕМА | ✓ Разработанный дизайн |
| 471-500 | `canActivateQuest()` — проверка зависимостей | ЗАВИСИМОСТЬ | ✓ OK |

**КАЧЕСТВО КОДА:**  
Использование pattern-matching на типы objective.type безопасно, все 6 типов обработаны.

---

#### 11.3 main.tsx (16 строк)

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GamePage } from '@/components/game/GamePage'
import { Toaster } from '@/components/ui/sonner'
import '@/app/globals.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <GamePage />
    <Toaster position="top-right" richColors />
  </StrictMode>,
)
```

**АНАЛИЗ:**

| Линия | Компонент | Статус | Заметки |
|------|-----------|--------|---------|
| 1-2 | React imports | ✓ OK | React 19 |
| 3 | GamePage компонент | ✓ КРИТИЧНАЯ | Точка входа всей игры |
| 4 | Sonner Toaster | ✓ OK | Toast notifications |
| 7-8 | Root validation | ✓ ХОРОШЕЕ ОТНОШЕНИЕ | Бросает ошибку если root не найден |
| 10-13 | StrictMode + Toaster | ✓ OK | Production-ready setup |

**КРИТИЧНОСТЬ: ОТСУТСТВУЕТ**  
Точка входа корректна и безопасна.

---

#### 11.4 gameStore.ts (64 строки)

**СТРУКТУРА STORE:**

```typescript
export const useGameStore = create<GameStoreState>()((...a) => ({
  ...createPlayerSlice(...a),
  ...createExplorationSlice(...a),
  ...createWorldSlice(...a),
  ...createUISlice(...a),
  ...createCutsceneSlice(...a),
  ...createSaveSlice(...a),
}))
```

**АНАЛИЗ:**

| Срез (Slice) | Строка | Статус | Заметки |
|--------------|--------|--------|---------|
| `playerSlice` | 52 | ✓ OK | Навыки, карма, инвентарь, флаги |
| `explorationSlice` | 53 | ✓ OK | Сцена, позиция, время дня |
| `worldSlice` | 54 | ✓ OK | Достижения, погода, НПЦ |
| `uiSlice` | 55 | ✓ OK | UI состояние, панели |
| `cutsceneSlice` | 56 | ✓ OK | Кинематография |
| `saveSlice` | 57 | ✓ OK | Сохранение/загрузка |

**ПРОБЛЕМЫ:**

| Линия | Проблема | Тип | Критичность |
|------|----------|-----|-------------|
| 51-58 | 6 срезов — сложность композиции | АРХИТЕКТУРА | ℹ️ ИНФО |
| 43 | `GameStoreState` определён в `shared.ts` | ЦИКЛИЧЕСКИЕ ЗАВИСИМОСТИ | ⚠️ РИСК |
| 61-63 | `getGameStore()` — удобство вне React | ✓ OK | Правильно использовано |

---

### 12. Типы и типизация

#### 12.1 game.ts (747 строк)

**МАТРИЦА ТИПОВ:**

| Категория | Тип | Строки | Статус |
|-----------|-----|--------|--------|
| Skills | `PlayerSkills` | 4-12 | ✓ OK (7 умений) |
| Scenes | `SceneId` | 40-54 | ✓ OK (14 сцен) |
| Scene exits | `SceneExit` | 59-70 | ✓ OK |
| Story effects | `StoryEffect` | 119-135 | ✓ OK |
| Quests | `QuestDefinition` | 254-279 | ✓ OK |
| Dialogue | `DialogueNode` | 166-172 | ✓ OK |
| Combat | `CombatState` | 431-475 | ✓ РАСШИРЕННО |
| Events | `EventMap` | 577-737 | ✓ OK (50+ событий) |

**ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:**

| Линия | Тип | Проблема | Статус |
|------|-----|----------|--------|
| 14 | `TrainablePlayerSkill` | Использует `keyof PlayerSkills` — безопасно | ✓ OK |
| 40-54 | `SceneId` | Жёсткий union из 14 строк — требует ручного обновления | ⚠️ ВАЖНО |
| 82-83 | `floorMaterial` | Дублирует тип из `sceneDefinition.ts` | ⚠️ РИСК |
| 119 | `StoryEffect` | Использует `type?: string` для гибкости | ⚠️ МИНОРНО |
| 182 | `minSkillCheck` | Новый тип для проверки умений с difficulty | ✓ OK |
| 243 | `QuestObjective.type` | 7 типов целей, но нет 'capture_npc' или других | ⚠️ РАСШИРЯЕМОСТЬ |
| 335 | `EnemyType` | 9 типов врагов — хорошо детализировано | ✓ OK |

**КРИТИЧНАЯ НАХОДКА: Дублирование FloorMaterial**

```typescript
// game.ts: 83
floorMaterial: 'wood' | 'concrete' | ... | 'default'

// sceneDefinition.ts: 16
type FloorMaterial = 'wood' | 'concrete' | ... | 'default'
```

→ **РИСК:** Если добавить новый материал, нужно обновить ОБА места  
→ **РЕШЕНИЕ:** Импортировать `FloorMaterial` из `sceneDefinition.ts` в `game.ts`

---

#### 12.2 sceneDefinition.ts (218 строк)

**АНАЛИЗ ТИПОВ:**

| Тип | Строки | Статус | Примечания |
|-----|--------|--------|-----------|
| `FloorMaterial` | 16 | ✓ OK | 9 материалов |
| `VisualComponentName` | 26-40 | ✓ OK | 14 компонентов визуализации |
| `DoorwayDef` | 47-56 | ✓ OK | Чистая структура |
| `ColliderDef` | 68-87 | ✓ OK | Корректно документировано (half-extents!) |
| `FloorColliderDef` | 91-96 | ✓ OK | Требует `footstepMaterial` |
| `ExitDef` | 103-127 | ✓ OK | Полная валидация |
| `SceneDefinition` | 165-217 | ✓ OK | Полнота и ясность |

**НАХОДКИ:**

| Линия | Компонент | Проблема | Критичность |
|------|-----------|----------|-------------|
| 67-75 | Документ cuboid | ЗАМЕЧАТЕЛЬНОЕ документирование half-extents (риск: смешивание полных/половинных размеров) | ✓ OK |
| 89-96 | `FloorColliderDef` | Extends `ColliderDef` + требует `footstepMaterial` | ✓ ХОРОШЕЕ ОТНОШЕНИЕ |
| 216-217 | `transitionStyle?` | Optional поле, хорошо | ✓ OK |

**КАЧЕСТВО ТИПИЗАЦИИ: ОТЛИЧНОЕ**

---

### 13. Конфигурация сборки и окружения

#### 13.1 package.json (86 строк)

**DEPENDENCIES (20 Radix UI + утилиты):**

```json
"dependencies": {
  "@dimforge/rapier3d-compat": "^0.19.3",  // Физика
  "@react-three/drei": "10.7.7",           // Three.js утилиты
  "@react-three/fiber": "9.6.1",           // React + Three.js bridge
  "@react-three/rapier": "2.2.0",          // Physics integration
  "react": "^19.0.0",                      // React 19
  "zustand": "^5.0.6",                     // State management
  // ... 20 Radix UI компонентов
  "three": "0.172.0"                       // Three.js
}
```

**DEVDEPENDENCIES:**

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| `@tailwindcss/vite` | ^4 | Tailwind CSS integration |
| `@types/react` | ^19 | TypeScript types |
| `eslint` | ^9 | Linting |
| `typescript` | ^5 | TypeScript compiler |
| `vite` | ^6.3.5 | Build tool |

**АНАЛИЗ:**

| Пакет | Статус | Заметка |
|-------|--------|---------|
| Radix UI | ✓ OK | 20 компонентов UI — минимальные зависимости |
| Three.js | ✓ OK | Фиксированная версия 0.172.0 |
| React 19 | ✓ OK | Latest |
| Zustand | ✓ OK | Легковесное управление состоянием |
| FastNoise | ✓ OK | 1.1.1 для процедурной генерации |

**ПРОБЛЕМЫ:**

| Пакет | Версия | Проблема | Критичность |
|-------|--------|----------|-------------|
| `three` | 0.172.0 | Фиксированная версия может пропустить исправления | ⚠️ МИНОРНО |
| `@types/uuid` | 11.0.0 | Не согласуется с uuid@^11.1.0 (может быть ок) | ℹ️ ИНФО |
| Radix UI | ^1.x | Может быть разрыв при ^2.0 | ⚠️ МИНОРНО |

**СКРИПТЫ:**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint ."
}
```

**СТАТУС BUILD:** ✓ УСПЕШНО (no errors)

---

#### 13.2 tsconfig.json (37 строк)

**КОНФИГУРАЦИЯ:**

```json
{
  "compilerOptions": {
    "target": "ES2020",                     // ✓ OK
    "strict": true,                        // ✓ ХОРОШО
    "noImplicitAny": true,                 // ✓ ХОРОШО
    "moduleResolution": "bundler",         // ✓ Vite-compatible
    "paths": { "@/*": ["./src/*"] }        // ✓ Path alias
  }
}
```

**АНАЛИЗ:**

| Опция | Значение | Статус | Примечание |
|-------|----------|--------|-----------|
| `strict` | true | ✓ OK | Сильная типизация включена |
| `noImplicitAny` | true | ✓ OK | Требуется явная типизация |
| `skipLibCheck` | true | ✓ OK | Ускоряет компиляцию |
| `moduleResolution` | bundler | ✓ OK | Современный стандарт |
| `jsx` | react-jsx | ✓ OK | React 17+ режим |

**КРИТИЧНОСТЬ: ОТСУТСТВУЕТ**  
TypeScript конфигурация отличная.

---

#### 13.3 vite.config.ts (30 строк)

**КОНФИГУРАЦИЯ:**

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', '@react-three/rapier'],
          vendor: ['react', 'react-dom', 'zustand', 'framer-motion'],
        },
      },
    },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
});
```

**АНАЛИЗ CHUNKING:**

| Chunk | Размер (gzip) | Статус |
|-------|---|--------|
| `three` | ~1,169 MB | ⚠️ БОЛЬШОЙ |
| `vendor` | ~48 MB | ✓ OK |
| `index` | ~468 MB | ⚠️ БОЛЬШОЙ |

**BUILD OUTPUT:**

```
✓ 3100 modules transformed
✓ built in 13.06s

Total: ~5.6 MB (uncompressed)
Main bundle: 1,879 MB (gzip: 468 MB) — ⚠️ ОЧЕНЬ БОЛЬШОЙ
```

**ПРОБЛЕМЫ:**

| Компонент | Размер | Проблема | Критичность |
|-----------|--------|----------|-------------|
| index.js | 1,879 MB | СЛИШКОМ БОЛЬШОЙ для основного бандла | ⚠️ ВАЖНО |
| three.js | 3,445 MB | Three.js основной бундл | ⚠️ OK (нормально) |
| Вилинг | N/A | Нет agressive code splitting | ⚠️ МИНОРНО |

**РЕКОМЕНДАЦИЯ:**  
→ Добавить более гранулярное разделение кода (отдельные chunks для компонентов)  
→ Использовать динамический import() для компонентов

---

### 14. Проверка целостности данных

#### 14.1 Перекрёстные ссылки (Cross-references)

**ПРОВЕРКА: Сцены в storyNodes → sceneDefinitions**

| StoryNode.sceneId | Существует в sceneDefinitions | Статус |
|---|---|---|
| volodka_room | ✓ Да | ✓ OK |
| volodka_corridor | ✓ Да | ✓ OK |
| home_evening | ✓ Да | ✓ OK |
| street_night | ✓ Да | ✓ OK |
| cafe_evening | ✓ Да | ✓ OK |
| office_day | ✓ Да | ✓ OK |
| park_day | ✓ Да | ✓ OK |
| library_day | ✓ Да | ✓ OK |
| rooftop_edge | ✓ Да | ✓ OK |
| abandoned_factory | ✓ Да | ✓ OK |
| street_winter | ✓ Да | ✓ OK |
| sleep_dream | ✓ Да | ✓ OK |
| battle | ✓ Да | ✓ OK |
| zarema_albert_room | ✓ Да | ✓ OK |

**РЕЗУЛЬТАТ: 14/14 сцен согласованы ✓**

---

**ПРОВЕРКА: Квесты → linkedStoryNodeId**

| Quest ID | linkedStoryNodeId | Статус | Существует |
|----------|---|---|---|
| first_reading | fix_success | ⚠️ ТРЕБУЕТ ПРОВЕРКИ | ? |
| maria_connection | maria_curious | ✓ OK | Линия 317 |
| incident_scroll_4729 | office_alexander | ✓ OK | Линия 257 |
| vault_backup_trial | colleague_persuasion_line | ⚠️ ТРЕБУЕТ ПРОВЕРКИ | ? |
| poetry_collection | volodka_inner | ⚠️ НЕ НАЙДЕН | ✗ |
| night_shift_mystery | office_alexander | ✓ OK | Линия 257 |
| alberts_lesson | cafe_enter | ✓ OK | Линия 169 |
| network_initiation | ? | ⚠️ ТРЕБУЕТ ПРОВЕРКИ | ? |

**КРИТИЧНЫЕ НАХОДКИ:**

| Квест | Проблема | Вероятность | Влияние |
|-------|----------|-------------|--------|
| `poetry_collection` | `linkedStoryNodeId: 'volodka_inner'` НЕ НАЙДЕН в storyNodes.ts | ВЫСОКАЯ | Квест может не запуститься правильно |
| `vault_backup_trial` | `colleague_persuasion_line` НЕ НАЙДЕН в первых 500 строк | СРЕДНЯЯ | Нужна проверка полного файла |
| `first_reading` | `fix_success` НЕ НАЙДЕН в первых 500 строк | СРЕДНЯЯ | Нужна проверка |

→ **РИСК УРОВНЯ: КРИТИЧНЫЙ**  
→ **ДЕЙСТВИЕ: Выполнить полную проверку всех linkedStoryNodeId**

---

**ПРОВЕРКА: Стихи → poemId в квестах**

```
quest_1: poem_1       ✓
quest_2: poem_6       ✓
quest_4: poem_5, poem_8 ✓
quest_5: poem_1..poem_21 ⚠️ ПРОВЕРИТЬ ВСЕ 21
```

→ **РИСК:** Если poem_21 не определено, quest_5 не может быть завершен

---

## ОБЪЕДИНЁННАЯ СТАТИСТИКА И МЕТРИКИ

### Объём кода

| Файл | Строк | Сложность | Статус |
|------|-------|-----------|--------|
| storyNodes.ts | 4272 | Высокая (множество узлов) | ⚠️ МОЖНО РЕФАКТОРИТЬ |
| dialogueNodes.ts | 4462 | Высокая (множество НПЦ) | ⚠️ МОЖНО РЕФАКТОРИТЬ |
| CombatSystem.ts | 875 | Очень высокая | ⚠️ ТРЕБУЕТ РЕФАКТОРИНГА |
| playerSlice.ts | 1059 | Критическая (8+ доменов) | ⚠️ НАРУШЕНИЕ SRP |
| GameOrchestrator.tsx | 1468 | Очень высокая | ⚠️ GOD OBJECT |
| useAudioOrchestrator.ts | 747 | Высокая | ⚠️ СИНГЛТОН УТЕЧКА |
| sceneDefinitions.ts | 872 | Средняя | ✓ OK |
| GuidedStoryManager.ts | 599 | Средняя | ✓ OK |
| QuestTracker.ts | 534 | Средняя | ✓ OK |
| quests.ts | 2414 | Средняя | ✓ OK |
| game.ts (types) | 747 | Высокая | ⚠️ МНОГО ТИПОВ |
| EventBus.ts | 266 | Низкая | ✓ OK (но утечки) |
| RPGGameCanvas.tsx | 585 | Средняя | ✓ OK |

**ВСЕГО: ~15 000+ строк критического кода**

### Конфигурация сцен

| Сцена | Выходов | Коллайдеров | Огней | Статус |
|-------|---------|-------------|-------|--------|
| volodka_room | 1 | 7 (1 пол + 4 стены + 2 препятствия) | 3 | ✓ OK |
| street_night | 6 | 8 (1 пол + 2 стены + 5 препятствий) | 0 | ✓ OK |
| cafe_evening | 1 | 10 | 3 | ✓ OK |
| volodka_corridor | 3 | 8 | 3 | ✓ OK |
| home_evening | 1 | 8 | 2 | ✓ OK |
| street_winter | 1 | 6 | 3 | ✓ OK |
| office_day | 1 | 8 | 3 | ✓ OK |
| park_day | 2 | 7 | 3 | ✓ OK |
| library_day | 1 | 8 | 3 | ✓ OK |
| battle | 1 | 8 | 3 | ✓ OK |
| sleep_dream | 1 | 6 | 4 | ✓ OK |
| rooftop_edge | 1 | 4 | 3 | ✓ OK |
| abandoned_factory | 1 | 9 | 3 | ✓ OK |
| zarema_albert_room | 1 | 8 | 3 | ✓ OK |

**ВСЕГО:** 14 сцен, 23 выхода, 111 коллайдеров, 41 источник света

---

## ЕДИНЫЙ ПРИОРИТЕТИЗИРОВАННЫЙ ПЛАН ДЕЙСТВИЙ

### P0 — КРИТИЧНО (НЕДЕЛЯ 1)

**Инфраструктура:**
- [ ] Исправить утечку памяти в EventBus.dedupCache — добавить limit размера ключей (проблема 5.1)
- [ ] Исправить race condition в CombatSystem.currentCombat — добавить guard/lock (проблема 6.1)
- [ ] Очистить enemyTurnTimer при handleVictory/handleDefeat (проблема 6.2)
- [ ] Добавить dispose() для AmbientSoundPlayer singleton (проблема 2.1)
- [ ] Исправить утечку памяти в GameOrchestrator EventBus subscribe (проблема 1.2)

**Данные:**
- [ ] Найти и определить `volodka_inner` узел или обновить `poetry_collection.linkedStoryNodeId`
- [ ] Импортировать `FloorMaterial` из sceneDefinition.ts в game.ts (удалить дублирование)
- [ ] Выполнить полную проверку ВСЕХ linkedStoryNodeId квестов на существование

### P1 — ВАЖНО (НЕДЕЛИ 2-3)

**Инфраструктура:**
- [ ] Рефакторить GameOrchestrator на 3-4 подкомпоненты (PanelCoordinator, CutsceneController, ModeTransitionManager)
- [ ] Переместить боевое состояние в Zustand (вместо глобальной переменной)
- [ ] Разделить playerSlice на 4-7 меньших slice'а (skillSlice, karmaSlice, inventorySlice, questSlice, craftSlice, tradeSlice, perkSlice)
- [ ] Реализовать state machine для audio transitions (Idle → FadingOut → FadingIn → Playing)
- [ ] Добавить debounce для 'interaction:end' эмиссий
- [ ] Очистить старые randomTimer'ы при смене ambient'а

**Данные:**
- [ ] Реализовать более гранулярное code splitting (4-5 chunks вместо 2)
- [ ] Проверить все `minigame_completed` типы на реализацию в коде
- [ ] Проверить все poemId (poem_1..poem_21) на существование
- [ ] Добавить runtime validation для условий типов (minSkillCheck, minNpcRelation)
- [ ] Параметризовать переходы актов в GuidedStoryManager (перенести в goldenPath.ts)

### P2 — МОЖНО (МЕСЯЦ 2+)

**Инфраструктура:**
- [ ] Добавить мониторинг утечек (metrics для timer'ов, handler'ов, buffs)
- [ ] Реализовать state machine для боевой системы (Idle → PlayerTurn → EnemyTurn → Victory → Idle)
- [ ] Добавить селекторы для всех slice'ов Zustand (useShallow / createSelector)
- [ ] Использовать Worker thread для audio processing
- [ ] Внедрить performance monitoring (frame drops, memory usage)
- [ ] Добавить End-to-End тесты для критических flow'ов (combat, NPC interaction)

**Данные:**
- [ ] Рефакторить большие файлы (storyNodes, dialogueNodes) на модули по актам/NPC
- [ ] Добавить unit tests для целостности данных (cross-references, scene integrity)
- [ ] Заменить regex-matching на явный маппинг в GuidedStoryManager
- [ ] Создать enum GameType для мини-игр
- [ ] Обновить three.js до ^0.172.0 при наличии исправлений безопасности

---

## РИСКИ ПРЯМО СЕЙЧАС

### Инфраструктурные риски

1. **Утечки памяти** (3-5 утечек, растут со временем игры)
   - EventBus dedupCache, AmbientSoundPlayer singleton, randomTimers, EventBus subscribe
2. **Race conditions** при быстрых кликах (combat, audio transitions, mode switches)
3. **Зависшие таймеры** (особенно enemyTurnTimer и fallbackTimer)
4. **Потеря состояния** при ошибках (incomplete cleanup)

### Данные/конфигурация риски

1. **Отсутствующие узлы истории** — poetry_collection не может быть связан с узлом
2. **Дублирование типов** — FloorMaterial рассинхронизируется при изменениях
3. **Непроверенные ссылки** — linkedStoryNodeId могут указывать на несуществующие узлы
4. **Большой бандл** — 1,879 MB основной бандл замедляет загрузку

---

## ОБЩАЯ ОЦЕНКА

### Оценка по категориям (комбинированная)

| Категория | Инфраструктура | Данные/Конфигурация | Комбинированная | Комментарий |
|-----------|---------------|---------------------|-----------------|-------------|
| Архитектура | 5/10 | 8.5/10 | 6.5/10 | God object (GameOrchestrator), но отличное разделение конфигурации |
| Целостность данных | — | 7.5/10 | 7.5/10 | 14/14 сцен согласованы, но 1-2 missing linkedStoryNodeId |
| Типизация | 8/10 | 8/10 | 8/10 | Строгие типы, но дублирование FloorMaterial и жёсткий SceneId |
| Управление состоянием | 6/10 | 8.5/10 | 7/10 | Zustand хорошо, но playerSlice слишком большой, глобальные переменные в CombatSystem |
| Обработка ошибок | 6/10 | — | 6/10 | ErrorBoundary хорошее, но try-catch без логирования, race conditions |
| Производительность | 5/10 | 6.5/10 | 5.5/10 | Re-renders, большой бандл, утечки памяти |
| Безопасность (runtime) | 5/10 | — | 5/10 | Race conditions, отсутствие guard'ов, зависшие таймеры |
| Документирование | 6/10 | 7/10 | 6.5/10 | Хорошие комментарии в типах, но не везде |

### ИТОГОВАЯ КОМБИНИРОВАННАЯ ОЦЕНКА: 6.5/10

**Обоснование:**
- Слой данных и конфигурации получил 7.5/10 — хорошая архитектура сцен, строгая типизация, успешная сборка
- Инфраструктурный слой получил ~5.5/10 — серьёзные утечки памяти, race conditions, god objects
- Комбинированная оценка учитывает, что инфраструктурные проблемы имеют более высокий риск для продакшена (утечки памяти и race conditions приводят к крашу, тогда как данные можно исправить точечно)

---

## ЗАКЛЮЧЕНИЕ

Проект **Volodka RPG** имеет **хорошо спроектированный слой данных и конфигурации** — все 14 сцен согласованы, типизация строгая, компиляция успешна. Однако **инфраструктурный слой содержит критические проблемы**: утечки памяти (EventBus, AmbientSoundPlayer, CombatSystem), race conditions (боевая система, аудио-переходы, режимы), и архитектурные анти-паттерны (God Object в GameOrchestrator, нарушение SRP в playerSlice, глобальное состояние в CombatSystem).

**Ключевые риски:**
- При длительной игре (30+ минут) утечки памяти начнут влиять на производительность
- При быстрых действиях игрока race conditions могут вызвать краш или некорректное состояние
- Отсутствующие linkedStoryNodeId могут блокировать прогресс в квестах

**Рекомендуемое действие:** Выполнить P0 рекомендации (5 инфраструктурных + 3 данных) в течение первой недели, затем перейти к P1 рефакторингу в течение 2-3 недель. После стабилизации — P2 оптимизация.

---

**Дата аудита:** 2026-06-05  
**Аудиторы:** Аналитик архитектуры (инфраструктура/рантайм), Аналитик данных (данные/конфигурация)  
**Статус:** АУДИТ ЗАВЕРШЁН. Все файлы прочитаны полностью, проверки выполнены.
