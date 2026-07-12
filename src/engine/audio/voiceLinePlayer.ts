/**
 * VO playback — plays shipped audioUrl when present; no-op otherwise.
 */

import {
  getVoiceLine,
  registerVoiceLine,
  type VoiceLineEntry,
} from './VoiceLineRegistry';

let activeAudio: HTMLAudioElement | null = null;

export function resolveVoiceLineAudioUrl(nodeId: string): string | undefined {
  const entry = getVoiceLine(nodeId);
  if (!entry) return undefined;
  if (entry.audioUrl) return entry.audioUrl;
  return `/audio/vo/${nodeId}.ogg`;
}

export function stopVoiceLinePlayback(): void {
  if (!activeAudio) return;
  activeAudio.pause();
  activeAudio.src = '';
  activeAudio = null;
}

/** Play VO when registered; silent skip when the file is missing on disk. */
export function playVoiceLineForNode(nodeId: string): void {
  const url = resolveVoiceLineAudioUrl(nodeId);
  if (!url) return;

  stopVoiceLinePlayback();

  const audio = new Audio(url);
  activeAudio = audio;
  audio.volume = 0.9;
  void audio.play().catch(() => {
    if (activeAudio === audio) activeAudio = null;
  });
}

export function registerSpineVoiceLineSeeds(entries: readonly VoiceLineEntry[]): void {
  for (const entry of entries) {
    if (!getVoiceLine(entry.nodeId)) {
      registerVoiceLine(entry);
    }
  }
}
