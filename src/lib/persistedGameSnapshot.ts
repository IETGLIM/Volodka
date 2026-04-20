/**
 * Компактный снимок для localStorage / облака: без «тяжёлых» transient-полей обхода,
 * обрезка журналов и пустых квестовых счётчиков — меньше JSON и риск упереться в ~5MB.
 */
import type { PlayerState, ChoiceLogEntry, InventoryItem, NPCRelation } from '@/data/types';
import type { ExplorationState, GameMode, TriggerState } from '@/data/rpgTypes';
import type { FactionId, FactionReputation } from '@/data/factions';

export const PERSIST_SNAPSHOT_VERSION = 5;

/** Макс. строк в localStorage-сохранении (облако — тот же объект). */
export const LOCAL_SAVE_WARN_BYTES = 3_500_000;
/** Лимит тела `data` для POST /api/save (UTF-8 байты). */
export const CLOUD_SAVE_MAX_DATA_BYTES = 4_500_000;

const CHOICE_LOG_MAX = 28;
const MORAL_CHOICES_MAX = 24;
const NPC_INTERACTIONS_MAX = 6;

/** Transient: позиции NPC в обходе пересчитываются из расписания; не тащим в сейв. */
export type ExplorationPersisted = Omit<ExplorationState, 'npcStates'>;

export function compactExplorationForSave(ex: ExplorationState): ExplorationPersisted {
  const triggerStates: Record<string, TriggerState> = {};
  for (const [id, st] of Object.entries(ex.triggerStates)) {
    if (st.triggered) triggerStates[id] = st;
  }
  return {
    playerPosition: { ...ex.playerPosition },
    currentSceneId: ex.currentSceneId,
    timeOfDay: ex.timeOfDay,
    triggerStates,
    worldItems: ex.worldItems.map((w) => ({ ...w })),
    exploredAreas: ex.exploredAreas.length ? [...ex.exploredAreas] : [],
    lastSceneTransition: ex.lastSceneTransition,
  };
}

export function compactNpcRelationsForSave(rels: NPCRelation[]): NPCRelation[] {
  return rels.map((r) => ({
    ...r,
    interactions: Array.isArray(r.interactions)
      ? r.interactions.slice(-NPC_INTERACTIONS_MAX)
      : [],
  }));
}

export function compactPlayerStateForSave(ps: PlayerState): PlayerState {
  return {
    ...ps,
    statistics: {
      ...ps.statistics,
      moralChoices: Array.isArray(ps.statistics.moralChoices)
        ? ps.statistics.moralChoices.slice(-MORAL_CHOICES_MAX)
        : [],
    },
  };
}

export function compactQuestProgressForSave(
  q: Record<string, Record<string, number>>,
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const [questId, objectives] of Object.entries(q)) {
    const inner: Record<string, number> = {};
    for (const [oid, val] of Object.entries(objectives)) {
      if (typeof val === 'number' && val > 0) inner[oid] = val;
    }
    if (Object.keys(inner).length) out[questId] = inner;
  }
  return out;
}

export function compactChoiceLogForSave(log: ChoiceLogEntry[]): ChoiceLogEntry[] {
  return log.slice(-CHOICE_LOG_MAX);
}

export function estimateJsonUtf8Bytes(value: unknown): number {
  try {
    const s = JSON.stringify(value);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(s).length;
    }
    return s.length * 2;
  } catch {
    return 0;
  }
}

/** Поля стора, нужные для записи в localStorage / облако (без actions и UI phase). */
export interface GameSaveSource {
  playerState: PlayerState;
  currentNodeId: string;
  npcRelations: NPCRelation[];
  inventory: InventoryItem[];
  collectedPoemIds: string[];
  unlockedAchievementIds: string[];
  unlockedLocations: string[];
  gameMode: GameMode;
  exploration: ExplorationState;
  activeQuestIds: string[];
  completedQuestIds: string[];
  questProgress: Record<string, Record<string, number>>;
  factionReputations: Record<FactionId, FactionReputation>;
  choiceLog: ChoiceLogEntry[];
}

/** Компактный JSON-serializable объект (без `npcStates` в exploration, обрезанные журналы). */
export function buildLocalSavePayload(src: GameSaveSource): Record<string, unknown> {
  const inv = src.inventory.map((i) => ({
    itemId: i.item.id,
    quantity: i.quantity,
    obtainedAt: i.obtainedAt,
  }));

  const payload: Record<string, unknown> = {
    version: PERSIST_SNAPSHOT_VERSION,
    playerState: compactPlayerStateForSave(src.playerState),
    currentNodeId: src.currentNodeId,
    npcRelations: compactNpcRelationsForSave(src.npcRelations),
    inventory: inv,
    exploration: compactExplorationForSave(src.exploration),
    activeQuestIds: src.activeQuestIds,
    questProgress: compactQuestProgressForSave(src.questProgress),
    factionReputations: src.factionReputations,
    choiceLog: compactChoiceLogForSave(src.choiceLog),
    savedAt: Date.now(),
  };

  if (src.gameMode !== 'exploration') {
    payload.gameMode = src.gameMode;
  }
  if (src.completedQuestIds.length > 0) {
    payload.completedQuestIds = src.completedQuestIds;
  }
  if (src.collectedPoemIds.length > 0) {
    payload.collectedPoemIds = src.collectedPoemIds;
  }
  if (src.unlockedAchievementIds.length > 0) {
    payload.unlockedAchievementIds = src.unlockedAchievementIds;
  }
  if (src.unlockedLocations.length > 0) {
    payload.unlockedLocations = src.unlockedLocations;
  }

  return payload;
}
