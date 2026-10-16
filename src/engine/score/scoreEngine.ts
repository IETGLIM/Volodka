/* ─── Volodka RPG – Score Engine / «Стихосложение» (v4.55.0) ───
 * Очки за один забег: боевая доблесть, собранные стихи, квесты,
 * достижения, открытие сцен + серии побед (streak-множитель).
 *
 * Паттерн — module-level engine state (как playerRoll / playerStamina):
 * счёт дёргается из боевых событий каждый тик и НЕ должен жить в zustand.
 * HUD читает через событие 'score:changed' + getRunScore() для первого
 * рендера. Персист — hallOfFame (localStorage), throttle 3с + pagehide.
 *
 * Начисления (сознательно щедрые — очки должны радовать, а не душнить):
 *   победа в бою      +50 × множитель серии
 *   стих собран       +200
 *   сила стиха        +10
 *   квест завершён    +150
 *   достижение        +100
 *   новая сцена       +25
 *   поражение в бою   −25 (и серия сгорает)
 */

import { eventBus } from '@/engine/EventBus';
import {
  upsertLiveEntry,
  finalizeEntry,
  getEntryRank,
  type HallOfFameEntry,
} from '@/engine/score/hallOfFame';

export interface RunScoreState {
  score: number;
  kills: number;
  defeats: number;
  poemsCollected: number;
  poemPowersUsed: number;
  questsCompleted: number;
  achievementsUnlocked: number;
  /** Уникальные сцены, открытые за забег. */
  discoveredScenes: Set<string>;
  streak: number;
  maxStreak: number;
  /** Date.now() начала забега. */
  startedAt: number;
  runId: string;
}

const STREAK_WINDOW_MS = 8000;
const STREAK_MAX_MULTIPLIER = 5;
const SCORE = {
  kill: 50,
  poem: 200,
  power: 10,
  quest: 150,
  achievement: 100,
  discover: 25,
  defeatPenalty: -25,
} as const;
const PERSIST_INTERVAL_MS = 3000;

const state: RunScoreState = {
  score: 0,
  kills: 0,
  defeats: 0,
  poemsCollected: 0,
  poemPowersUsed: 0,
  questsCompleted: 0,
  achievementsUnlocked: 0,
  discoveredScenes: new Set(),
  streak: 0,
  maxStreak: 0,
  startedAt: 0,
  runId: '',
};

let lastKillAt = -Infinity;
let persistTimer: number | undefined;
let dirtySincePersist = false;

function newRunId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function toEntry(): HallOfFameEntry {
  return {
    runId: state.runId,
    score: state.score,
    kills: state.kills,
    poemsCollected: state.poemsCollected,
    questsCompleted: state.questsCompleted,
    achievementsUnlocked: state.achievementsUnlocked,
    maxStreak: state.maxStreak,
    playSeconds: state.startedAt > 0
      ? Math.max(0, Math.round((Date.now() - state.startedAt) / 1000))
      : 0,
    dateISO: null,
  };
}

function schedulePersist(): void {
  dirtySincePersist = true;
  if (persistTimer !== undefined) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = undefined;
    if (!dirtySincePersist) return;
    dirtySincePersist = false;
    upsertLiveEntry(toEntry());
  }, PERSIST_INTERVAL_MS);
}

function grant(delta: number, reason: string, label?: string): void {
  state.score = Math.max(0, state.score + delta);
  eventBus.emit('score:changed', { score: state.score, delta, reason, label });
  schedulePersist();
}

/** Текущий счёт забега (для первого рендера HUD). */
export function getRunScore(): number {
  return state.score;
}

/** Снапшот стейта для панелей (Зал славы, статистика). */
export function getRunScoreSnapshot(): Readonly<RunScoreState> {
  return state;
}

/** Ранг текущего забега в Зале славы: 1-based, 0 — не в таблице. */
export function getCurrentRunRank(): number {
  return state.runId ? getEntryRank(state.runId) : 0;
}

/**
 * Новый забег: текущая запись финализируется (получает дату), стейт — в ноль.
 * Вызывается по 'game:playthrough_reset' и на первом импорте модуля.
 */
export function resetRunScore(): void {
  if (state.runId) {
    finalizeEntry(state.runId);
  }
  state.score = 0;
  state.kills = 0;
  state.defeats = 0;
  state.poemsCollected = 0;
  state.poemPowersUsed = 0;
  state.questsCompleted = 0;
  state.achievementsUnlocked = 0;
  state.discoveredScenes = new Set();
  state.streak = 0;
  state.maxStreak = 0;
  state.startedAt = Date.now();
  state.runId = newRunId();
  lastKillAt = -Infinity;
  eventBus.emit('score:changed', { score: 0, delta: 0, reason: 'reset' });
}

/* ─── Подписки (module-scope, как player:roll → roll_whoosh) ─── */

if (typeof window !== 'undefined') {
  eventBus.on('combat:victory', ({ xpGained }) => {
    const now = Date.now();
    if (now - lastKillAt <= STREAK_WINDOW_MS) {
      state.streak = Math.min(STREAK_MAX_MULTIPLIER, state.streak + 1);
    } else {
      state.streak = 1;
    }
    lastKillAt = now;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    state.kills += 1;
    const multiplier = state.streak;
    const points = (SCORE.kill + Math.min(50, Math.floor(xpGained / 4))) * multiplier;
    grant(
      points,
      'kill',
      multiplier > 1 ? `Враг повержен ×${multiplier}` : 'Враг повержен',
    );
  });

  eventBus.on('combat:defeat', () => {
    state.defeats += 1;
    state.streak = 0;
    grant(SCORE.defeatPenalty, 'defeat', 'Тьма сильнее');
  });

  eventBus.on('poem:collected', () => {
    state.poemsCollected += 1;
    grant(SCORE.poem, 'poem', 'Строка возвращена миру');
  });

  eventBus.on('poem:power_used', () => {
    state.poemPowersUsed += 1;
    grant(SCORE.power, 'power', 'Сила стиха');
  });

  eventBus.on('quest:completed', () => {
    state.questsCompleted += 1;
    grant(SCORE.quest, 'quest', 'Дело сделано');
  });

  eventBus.on('achievement:unlocked', () => {
    state.achievementsUnlocked += 1;
    grant(SCORE.achievement, 'achievement', 'Достижение');
  });

  eventBus.on('scene:enter', ({ sceneId }) => {
    if (state.discoveredScenes.has(sceneId)) return;
    state.discoveredScenes.add(sceneId);
    grant(SCORE.discover, 'discover', 'Новое место');
  });

  eventBus.on('game:playthrough_reset', () => {
    resetRunScore();
  });

  // Страховка: закрыли вкладку — живой забег сохранён последним состоянием.
  window.addEventListener('pagehide', () => {
    if (state.runId && state.score > 0) {
      upsertLiveEntry(toEntry());
    }
  });

  // Первый забег сеанса.
  resetRunScore();
}
