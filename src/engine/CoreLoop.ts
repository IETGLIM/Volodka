// ============================================
// CORE LOOP — Основной игровой цикл v2
// ============================================
// Цикл: Изучение → Диалог → Выбор → Последствия → Прогресс → Новые возможности
// Теперь глубоко интегрирован с GameStore через подписки на события.
// Автоматически обновляет фазы, применяет эффекты, трекает прогресс.

import { eventBus } from './EventBus';
import { statsEngine } from './StatsEngine';
import { evaluateConsequences, applyConsequenceEffects } from './ConsequencesSystem';

// ============================================
// ТИПЫ
// ============================================

export type CoreLoopState =
  | 'EXPLORING'        // Игрок видит сцену, может взаимодействовать
  | 'IN_DIALOGUE'      // Разговор с NPC или внутренним голосом
  | 'MAKING_CHOICE'    // Игрок делает выбор
  | 'PROCESSING_CONSEQUENCES' // Обработка последствий
  | 'PROGRESSING'      // Статы меняются, флаги ставятся
  | 'NEW_OPPORTUNITIES'; // Новые выборы/диалоги/квесты доступны

export interface CoreLoopContext {
  playerId: string;
  currentNodeId: string;
  sceneId: string;
  state: CoreLoopState;
  lastChoice?: {
    nodeId: string;
    choiceText: string;
    effects: string[];
    timestamp: number;
  };
  availableActions: string[];
  newUnlocks: string[];
  stateHistory: CoreLoopState[];
  totalChoicesMade: number;
  totalConsequencesProcessed: number;
  sessionStartTime: number;
}

export interface CoreLoopCallbacks {
  /** Получить текущий контекст стора */
  getStoreContext: () => {
    playerState: import('@/data/types').PlayerState;
    npcRelations: import('@/data/types').NPCRelation[];
    flags: Record<string, boolean>;
    activeQuestIds: string[];
    completedQuestIds: string[];
    inventory: string[];
    visitedNodes: string[];
  };
  /** Действия стора для применения эффектов */
  storeActions: {
    addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
    addStress: (amount: number) => void;
    reduceStress: (amount: number) => void;
    setFlag: (flag: string) => void;
    unsetFlag: (flag: string) => void;
    updateNPCRelation: (npcId: string, change: number) => void;
    addSkill: (skill: string, amount: number) => void;
    activateQuest: (questId: string) => void;
  };
}

// ============================================
// CORE LOOP CLASS
// ============================================

class CoreLoopClass {
  private state: CoreLoopState = 'EXPLORING';
  private context: CoreLoopContext | null = null;
  private stateHistory: CoreLoopState[] = [];
  private callbacks: CoreLoopCallbacks | null = null;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private totalChoicesMade = 0;
  private totalConsequencesProcessed = 0;
  private eventUnsubscribers: Array<() => void> = [];
  private listenersBound = false;

  /** Инициализация с колбэками стора */
  init(callbacks: CoreLoopCallbacks): void {
    this.callbacks = callbacks;
    if (!this.listenersBound) {
      this.setupEventListeners();
      this.listenersBound = true;
    }
  }

  /** Start the core loop */
  startLoop(initialNodeId: string, sceneId: string): void {
    this.state = 'EXPLORING';
    this.context = {
      playerId: 'volodka',
      currentNodeId: initialNodeId,
      sceneId,
      state: this.state,
      availableActions: [],
      newUnlocks: [],
      stateHistory: [this.state],
      totalChoicesMade: 0,
      totalConsequencesProcessed: 0,
      sessionStartTime: Date.now(),
    };
    this.stateHistory = [this.state];
    this.totalChoicesMade = 0;
    this.totalConsequencesProcessed = 0;

    // Авто-сохранение каждые 2 минуты
    this.startAutoSave();
  }

  /** Остановка цикла */
  stopLoop(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /** Transition to a new state */
  transition(newState: CoreLoopState): void {
    const oldState = this.state;
    this.state = newState;
    this.stateHistory.push(newState);

    if (this.context) {
      this.context.state = newState;
      this.context.stateHistory = [...this.stateHistory];
    }
  }

  /** Get the current state */
  getCurrentState(): CoreLoopState {
    return this.state;
  }

  /** Get the full context */
  getContext(): CoreLoopContext | null {
    return this.context;
  }

  /** Record that a choice was made */
  recordChoice(nodeId: string, choiceText: string, effects: string[]): void {
    if (this.context) {
      this.context.lastChoice = {
        nodeId,
        choiceText,
        effects,
        timestamp: Date.now(),
      };
      this.context.currentNodeId = nodeId;
      this.context.totalChoicesMade = ++this.totalChoicesMade;
    }
  }

  /** Record new unlocks */
  recordUnlocks(unlocks: string[]): void {
    if (this.context) {
      this.context.newUnlocks = unlocks;
    }
  }

  /** Get the state display name (in Russian) */
  getStateDisplayName(state?: CoreLoopState): string {
    const s = state || this.state;
    switch (s) {
      case 'EXPLORING': return 'Исследование';
      case 'IN_DIALOGUE': return 'Диалог';
      case 'MAKING_CHOICE': return 'Выбор';
      case 'PROCESSING_CONSEQUENCES': return 'Последствия';
      case 'PROGRESSING': return 'Прогресс';
      case 'NEW_OPPORTUNITIES': return 'Новые возможности';
    }
  }

  /** Process the core loop cycle for a given choice — v2 with store integration */
  processChoiceCycle(
    nodeId: string,
    choiceText: string,
    applyEffects: () => string[],  // Returns list of effect descriptions
    getUnlocks: () => string[],    // Returns list of new unlocks
  ): { effects: string[]; unlocks: string[]; consequences: string[] } {
    // Step 1: Making choice
    this.transition('MAKING_CHOICE');
    eventBus.emit('choice:made', {
      nodeId,
      choiceText,
      choiceIndex: this.totalChoicesMade,
    });

    // Step 2: Process consequences (from ConsequencesSystem)
    this.transition('PROCESSING_CONSEQUENCES');
    let triggeredConsequences: string[] = [];

    if (this.callbacks) {
      const storeContext = this.callbacks.getStoreContext();
      const consequenceEffects = evaluateConsequences('choice:made', storeContext);
      
      if (consequenceEffects.length > 0) {
        applyConsequenceEffects(consequenceEffects, this.callbacks.storeActions);
        triggeredConsequences = consequenceEffects.map(e => e.message || 'stat_change');
        this.totalConsequencesProcessed += consequenceEffects.length;
      }
    }

    // Step 3: Apply direct effects from the choice
    const effects = applyEffects();

    // Step 4: Progress
    this.transition('PROGRESSING');
    this.recordChoice(nodeId, choiceText, effects);

    // Step 5: New opportunities
    this.transition('NEW_OPPORTUNITIES');
    const unlocks = getUnlocks();
    this.recordUnlocks(unlocks);

    // Step 6: Back to exploring
    this.transition('EXPLORING');

    return { effects, unlocks, consequences: triggeredConsequences };
  }

  /** Начать диалог */
  startDialogue(npcId: string, dialogueId: string): void {
    this.transition('IN_DIALOGUE');
    eventBus.emit('dialogue:started', { npcId, dialogueId });
  }

  /** Завершить диалог */
  endDialogue(npcId: string, dialogueId: string): void {
    eventBus.emit('dialogue:ended', { npcId, dialogueId });
    this.transition('EXPLORING');
  }

  /** Авто-сохранение */
  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      eventBus.emit('game:saved', { timestamp: Date.now() });
    }, 120_000); // Каждые 2 минуты
  }

  /** Подписка на события */
  private setupEventListeners(): void {
    // При входе в сцену — обновляем контекст
    this.eventUnsubscribers.push(eventBus.on('scene:enter', (payload) => {
      if (this.context) {
        this.context.sceneId = payload.sceneId;
      }
    }));

    // При пороге стресса — оцениваем последствия
    this.eventUnsubscribers.push(eventBus.on('stress:threshold', () => {
      if (this.callbacks) {
        const storeContext = this.callbacks.getStoreContext();
        const consequenceEffects = evaluateConsequences('stress:threshold', storeContext);
        if (consequenceEffects.length > 0) {
          applyConsequenceEffects(consequenceEffects, this.callbacks.storeActions);
        }
      }
    }));

    // При сборе стиха — оцениваем последствия
    this.eventUnsubscribers.push(eventBus.on('poem:collected', () => {
      if (this.callbacks) {
        const storeContext = this.callbacks.getStoreContext();
        const consequenceEffects = evaluateConsequences('poem:collected', storeContext);
        if (consequenceEffects.length > 0) {
          applyConsequenceEffects(consequenceEffects, this.callbacks.storeActions);
        }
      }
    }));
  }
}

// Singleton instance
export const coreLoop = new CoreLoopClass();
