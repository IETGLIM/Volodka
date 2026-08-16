/**
 * VO playback — plays shipped audioUrl when present; no-op otherwise.
 */

import {
  getVoiceLine,
  registerVoiceLine,
  type VoiceLineEntry,
} from './VoiceLineRegistry';

let activeAudio: HTMLAudioElement | null = null;

/* ─── VO availability cache ───
 * /public/audio/vo/ doesn't ship with the project, so every fallback URL
 * (`/audio/vo/${nodeId}.ogg`) would 404 and trigger a noisy console error
 * per dialogue node. We do a single HEAD probe on the first call, cache the
 * result, and short-circuit all subsequent calls when VO isn't served.
 */
let voAvailableChecked = false;
let voAvailable = false;
let voCheckPromise: Promise<boolean> | null = null;

async function ensureVoAvailable(url: string): Promise<boolean> {
  if (voAvailableChecked) return voAvailable;
  if (voCheckPromise) return voCheckPromise;
  voCheckPromise = (async () => {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      voAvailable = res.ok;
    } catch {
      voAvailable = false;
    } finally {
      voAvailableChecked = true;
      voCheckPromise = null;
    }
    return voAvailable;
  })();
  return voCheckPromise;
}

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
export async function playVoiceLineForNode(nodeId: string): Promise<void> {
  const url = resolveVoiceLineAudioUrl(nodeId);
  if (!url) return;

  const available = await ensureVoAvailable(url);
  if (!available) return;

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
