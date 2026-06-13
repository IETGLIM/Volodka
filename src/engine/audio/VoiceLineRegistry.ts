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
  const entry = registry.get(nodeId);
  return Boolean(entry?.audioUrl);
}

/** Bootstrap metadata for key story beats (no audio yet). */
export function initVoiceLineRegistry(): void {
  const seeds: VoiceLineEntry[] = [
    { nodeId: 'maria_introduction', speaker: 'maria', lineHash: 'maria_intro', emotion: 'calm' },
    { nodeId: 'act3_zarema_warning', speaker: 'zarema', lineHash: 'zarema_warn', emotion: 'whisper' },
    { nodeId: 'cafe_barista', speaker: 'cafe_barista', lineHash: 'barista_greet', emotion: 'calm' },
    { nodeId: 'office_alexander', speaker: 'office_alexander', lineHash: 'alex_open', emotion: 'angry' },
  ];
  for (const entry of seeds) {
    registerVoiceLine(entry);
  }
}
