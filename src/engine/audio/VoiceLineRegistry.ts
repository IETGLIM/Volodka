/**
 * VO-ready voice line registry — maps dialogue/story nodes to future audio URLs.
 * Until VO files ship, renderer falls back to typewriter + procedural SFX.
 */

export interface VoiceLineEntry {
  nodeId: string;
  speaker: string;
  /** Stable hash of canonical line text for cache busting */
  lineHash: string;
  audioUrl?: string;
  emotion?: 'calm' | 'angry' | 'sad' | 'happy' | 'whisper';
}

const registry = new Map<string, VoiceLineEntry>();

export function registerVoiceLine(entry: VoiceLineEntry): void {
  registry.set(entry.nodeId, entry);
}

export function getVoiceLine(nodeId: string): VoiceLineEntry | undefined {
  return registry.get(nodeId);
}

export function hasVoiceLine(nodeId: string): boolean {
  return registry.has(nodeId);
}

export function hasShippedVoiceAudio(nodeId: string): boolean {
  const entry = registry.get(nodeId);
  return Boolean(entry?.audioUrl);
}

/** Golden-path story + dialogue nodes — metadata only until VO files land under public/audio/vo/. */
const SPINE_VOICE_LINE_SEEDS: VoiceLineEntry[] = [
  { nodeId: 'start', speaker: 'narrator', lineHash: 'start', emotion: 'calm' },
  { nodeId: 'corridor_door', speaker: 'solnysh', lineHash: 'corridor_door', emotion: 'calm' },
  { nodeId: 'cafe_barista', speaker: 'cafe_barista', lineHash: 'cafe_barista', emotion: 'calm' },
  { nodeId: 'cafe_barista_dialogue', speaker: 'cafe_barista', lineHash: 'barista_dialogue', emotion: 'calm' },
  { nodeId: 'office_alexander', speaker: 'office_alexander', lineHash: 'alex_open', emotion: 'angry' },
  { nodeId: 'maria_introduction', speaker: 'maria', lineHash: 'maria_intro', emotion: 'calm' },
  { nodeId: 'act2_transition', speaker: 'narrator', lineHash: 'act2_transition', emotion: 'whisper' },
  { nodeId: 'act2_albert_hint', speaker: 'albert', lineHash: 'albert_hint', emotion: 'calm' },
  { nodeId: 'act3_zarema_warning', speaker: 'zarema', lineHash: 'zarema_warn', emotion: 'whisper' },
  { nodeId: 'fix_success', speaker: 'narrator', lineHash: 'fix_success', emotion: 'happy' },
];

/** Bootstrap metadata for key story beats (no audio yet). */
export function initVoiceLineRegistry(): void {
  for (const entry of SPINE_VOICE_LINE_SEEDS) {
    registerVoiceLine(entry);
  }
}
