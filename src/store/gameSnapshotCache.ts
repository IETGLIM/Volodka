import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';
import type { GameStoreState } from './types';

/** Число полей в эталонном ключе кэша снапшота (см. collectSnapshotCacheKey). */
const SNAPSHOT_KEY_FIELDS = 44;

// perf (v4.25, этап 108): ключ кэша собирается в ПЕРЕИСПОЛЬЗУЕМЫЙ буфер.
// Раньше каждый вызов getCachedGameSnapshot аллоцировал массив из 44 полей
// (мост подписывается на каждый чейндж слайсов, минуя rAF-батчинг), плюс
// `?? []` на choiceLog/moralChoices давало ещё две аллокации на вызов.
// Теперь: keyBuffer заполняется по месту, сравнение с кэшем — поэлементное,
// при промахе буфер копируется в cachedKeyBuffer — всё без аллокаций.
const keyBuffer: unknown[] = new Array(SNAPSHOT_KEY_FIELDS);
const cachedKeyBuffer: unknown[] = new Array(SNAPSHOT_KEY_FIELDS);
let cachedKeyFilled = false;

let cachedSnapshot: GameStoreSnapshot | null = null;

// Стабильные пустые массивы — раньше `?? []` аллоцировал их на каждый вызов.
const EMPTY_CHOICE_LOG: readonly never[] = Object.freeze([]);
const EMPTY_MORAL_CHOICES: readonly never[] = Object.freeze([]);

function collectSnapshotCacheKey(state: GameStoreState, out: unknown[]): void {
  const progression = state.playerState.progression;
  out[0] = state.mainMenuOpen;
  out[1] = state.introActive;
  out[2] = state.combatActive;
  out[3] = state.activeCutsceneId;
  out[4] = state.currentNodeId;
  out[5] = state.showStoryOverlay;
  out[6] = state.exploration.currentSceneId;
  out[7] = state.exploration.playerPosition;
  out[8] = state.exploration.timeOfDay;
  out[9] = state.interactiveObjectStates;
  out[10] = state.playerState.flags;
  out[11] = state.playerState.inventory;
  out[12] = state.playerState.skills;
  out[13] = state.playerState.energy;
  out[14] = state.playerState.karma;
  out[15] = state.playerState.stress;
  out[16] = state.playerState.visitedNodes;
  out[17] = state.playerState.choiceLog ?? EMPTY_CHOICE_LOG;
  out[18] = state.playerState.moralChoices ?? EMPTY_MORAL_CHOICES;
  out[19] = progression?.level ?? 1;
  out[20] = progression?.currentAct ?? 1;
  out[21] = progression?.skillPoints ?? 0;
  out[22] = progression?.unlockedSkills;
  out[23] = state.collectedPoems;
  out[24] = state.quests;
  out[25] = state.activeTTLFlags;
  out[26] = state.poemPowers;
  out[27] = state.npcRelations;
  out[28] = state.unlockedAchievements;
  out[29] = state.achievementProgress;
  out[30] = state.triggeredCutscenes;
  out[31] = state.diegeticNarrative;
  out[32] = state.lastUsedPoemId;
  out[33] = state.lastUsedPoemTimestamp;
  out[34] = state.pendingPoemReadingId;
  // FIX (P2): эти поля публикуются buildGameSnapshot, но отсутствовали в ключе
  // кэша — изолированные изменения давали устаревшие движковые снапшоты.
  out[35] = state.difficultySettings;
  out[36] = state.playerState.equippedItems;
  out[37] = state.dialogueHistory;
  out[38] = state.trophyTracking;
  out[39] = state.weatherEnabled;
  out[40] = state.rainIntensity;
  out[41] = state.acquiredThoughtIds;
  out[42] = state.equippedThoughtIds;
  // v4.16: изолированные изменения очков проработки должны инвалидировать
  // снапшот движка (масштабированные боевые эффекты мыслей).
  out[43] = state.thoughtInternalizationPoints;
}

function snapshotCacheKeysEqual(a: unknown[], b: unknown[]): boolean {
  for (let i = 0; i < SNAPSHOT_KEY_FIELDS; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function getCachedGameSnapshot(
  state: GameStoreState,
  build: (state: GameStoreState) => GameStoreSnapshot,
): GameStoreSnapshot {
  collectSnapshotCacheKey(state, keyBuffer);
  if (cachedSnapshot && cachedKeyFilled && snapshotCacheKeysEqual(cachedKeyBuffer, keyBuffer)) {
    return cachedSnapshot;
  }
  for (let i = 0; i < SNAPSHOT_KEY_FIELDS; i++) {
    cachedKeyBuffer[i] = keyBuffer[i];
  }
  cachedKeyFilled = true;
  const snapshot = build(state);
  cachedSnapshot = snapshot;
  return snapshot;
}

/** Test harness — drop cached snapshot between cases. */
export function resetGameSnapshotCacheForTests(): void {
  cachedSnapshot = null;
  cachedKeyFilled = false;
}
