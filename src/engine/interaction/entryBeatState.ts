/**
 * Tracks door/arrival entry beats (e.g. corridor_door) through zone interaction,
 * cutscene playback, and hub promotion — prevents hub↔entry re-arm races.
 */
export type EntryBeatPhase = 'idle' | 'pendingFromZone' | 'playingCutscene' | 'hubPromoted';

let phase: EntryBeatPhase = 'idle';
let activeEntryNodeId: string | null = null;

export function getEntryBeatPhase(): EntryBeatPhase {
  return phase;
}

export function getActiveEntryBeatNodeId(): string | null {
  return activeEntryNodeId;
}

/** Trigger zone called openLinkedStory for a door/arrival entry beat. */
export function armEntryBeatFromZone(nodeId: string): void {
  phase = 'pendingFromZone';
  activeEntryNodeId = nodeId;
}

/** Cutscene controller started playback for an entry beat node. */
export function markEntryBeatCutscenePlaying(nodeId: string): void {
  if (activeEntryNodeId === nodeId || phase === 'pendingFromZone') {
    activeEntryNodeId = nodeId;
    phase = 'playingCutscene';
  }
}

/** Post-cutscene hub promotion completed for the entry beat. */
export function markEntryBeatHubPromoted(): void {
  phase = 'hubPromoted';
  activeEntryNodeId = null;
}

export function resetEntryBeatState(): void {
  phase = 'idle';
  activeEntryNodeId = null;
}

/** True while zone-armed or cutscene entry beat is in flight (not yet hub-promoted). */
export function isEntryBeatInFlight(nodeId?: string): boolean {
  if (phase === 'idle' || phase === 'hubPromoted') return false;
  if (nodeId != null) return activeEntryNodeId === nodeId;
  return phase === 'pendingFromZone' || phase === 'playingCutscene';
}

/**
 * Consume zone-arm marker when scene transition handler acknowledges the beat.
 * Returns the armed node id or null.
 */
export function consumeEntryBeatFromZone(): string | null {
  if (phase !== 'pendingFromZone' || !activeEntryNodeId) return null;
  const nodeId = activeEntryNodeId;
  phase = 'playingCutscene';
  return nodeId;
}

/** @deprecated Use consumeEntryBeatFromZone — kept for tests migrating off string flag. */
export function peekPendingEntryBeatFromZoneInteraction(): string | null {
  return phase === 'pendingFromZone' ? activeEntryNodeId : null;
}

/** @deprecated Use consumeEntryBeatFromZone */
export function consumePendingEntryBeatFromZoneInteraction(): string | null {
  return consumeEntryBeatFromZone();
}

/** @deprecated Use resetEntryBeatState */
export function resetPendingEntryBeatFromZoneInteraction(): void {
  resetEntryBeatState();
}
