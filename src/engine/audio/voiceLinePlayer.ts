/**
 * VO playback — plays shipped audioUrl when present; no-op otherwise.
 *
 * v4.8.5: добавлены (а) события eventBus для субтитров голосовых линий
 * (audio:voice_line_start / audio:voice_line_end) и (б) opt-in озвучка через
 * Web Speech API, когда VO-файл недоступен (public/audio/vo/ не поставляется).
 * Синтез речи включается настройкой readVoiceOverEnabled() — см.
 * voiceOverSettings.ts; без неё поведение прежнее (тихий skip).
 */

import { eventBus } from '@/engine/EventBus';
import { readVoiceOverEnabled } from './voiceOverSettings';
import {
  getVoiceLine,
  registerVoiceLine,
  type VoiceLineEntry,
} from './VoiceLineRegistry';

export interface VoiceLinePlayOptions {
  /** Текст реплики для субтитра/синтеза (уже resolved, локализован). */
  text?: string;
  /** Имя говорящего для субтитра (локализованное; null → «Голос»). */
  speaker?: string | null;
}

let activeAudio: HTMLAudioElement | null = null;
let activeNodeId: string | null = null;

/* ─── Web Speech API state ─── */

let activeUtterance: SpeechSynthesisUtterance | null = null;
/** lang начинается с 'ru' — не ограничиваем конкретным регионом (ru-RU/ru-BY…). */
let cachedRuVoice: SpeechSynthesisVoice | null = null;
let voicesWarmedUp = false;

function getRuVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (voicesWarmedUp && cachedRuVoice) return cachedRuVoice;
  try {
    const voices = window.speechSynthesis.getVoices();
    voicesWarmedUp = voices.length > 0;
    cachedRuVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('ru')) ?? null;
    return cachedRuVoice;
  } catch {
    return null;
  }
}

/* Прогрев списка голосов: в Chrome getVoices() пуст до первого voiceschanged. */
function warmUpVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    if (voicesWarmedUp) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        voicesWarmedUp = voices.length > 0;
        cachedRuVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('ru')) ?? null;
      } catch {
        /* ignore */
      }
    };
  } catch {
    /* ignore */
  }
}

/** Подать реплику синтезатором речи. true — речь реально началась. */
function speakWithSpeechSynthesis(nodeId: string, text: string, emotion: VoiceLineEntry['emotion']): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const voice = getRuVoice();
  const voices = (() => {
    try {
      return window.speechSynthesis.getVoices();
    } catch {
      return [] as SpeechSynthesisVoice[];
    }
  })();
  /* Голоса уже перечислены, но русского нет — говорим русской фразы
   * английским голосом? Нет. Тихо пропускаем: субтитр тоже не нужен,
   * текст реплики и так виден в диалоговом окне. */
  if (voices.length > 0 && !voice) return false;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    if (voice) utterance.voice = voice;
    utterance.rate = emotion === 'angry' ? 1.05 : emotion === 'whisper' ? 0.9 : 1;
    utterance.pitch = emotion === 'angry' ? 0.85 : emotion === 'happy' ? 1.1 : emotion === 'sad' ? 0.9 : 1;
    utterance.volume = emotion === 'whisper' ? 0.55 : 0.95;
    utterance.onend = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      emitVoiceLineEnd(nodeId);
    };
    utterance.onerror = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      emitVoiceLineEnd(nodeId);
    };
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    activeUtterance = null;
    return false;
  }
}

/* ─── Subtitle events (eventBus) ─── */

function emitVoiceLineStart(nodeId: string, speaker: string | null, text?: string): void {
  try {
    eventBus.emit('audio:voice_line_start', { nodeId, speaker, text });
  } catch {
    /* eventBus не готов — субтитры не критичны */
  }
}

function emitVoiceLineEnd(nodeId: string): void {
  try {
    eventBus.emit('audio:voice_line_end', { nodeId });
  } catch {
    /* ignore */
  }
}

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
  const endedNode = activeNodeId;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  /* Синтез речи живёт своей жизнью — глушим и его. */
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
  activeUtterance = null;
  if (endedNode) {
    activeNodeId = null;
    emitVoiceLineEnd(endedNode);
  }
}

/** Play VO when registered; silent skip when the file is missing on disk. */
export async function playVoiceLineForNode(nodeId: string, options?: VoiceLinePlayOptions): Promise<void> {
  const url = resolveVoiceLineAudioUrl(nodeId);
  if (!url) return;

  const entry = getVoiceLine(nodeId);
  const speaker = options?.speaker ?? null;
  const text = options?.text;

  const available = await ensureVoAvailable(url);
  if (!available) {
    /* VO-файла нет. Fallback v4.8.5: opt-in синтез речи + субтитр. */
    if (readVoiceOverEnabled() && text) {
      warmUpVoices();
      const spoken = speakWithSpeechSynthesis(nodeId, text, entry?.emotion);
      if (spoken) {
        activeNodeId = nodeId;
        emitVoiceLineStart(nodeId, speaker, text);
      }
    }
    return;
  }

  stopVoiceLinePlayback();

  const audio = new Audio(url);
  activeAudio = audio;
  activeNodeId = nodeId;
  audio.volume = 0.9;
  /* Субтитр — на старт воспроизведения (реальный VO может грузиться). */
  emitVoiceLineStart(nodeId, speaker, text);
  audio.onended = () => {
    if (activeAudio === audio) activeAudio = null;
    if (activeNodeId === nodeId) {
      activeNodeId = null;
      emitVoiceLineEnd(nodeId);
    }
  };
  void audio.play().catch(() => {
    if (activeAudio === audio) activeAudio = null;
    if (activeNodeId === nodeId) {
      activeNodeId = null;
      emitVoiceLineEnd(nodeId);
    }
  });
}

export function registerSpineVoiceLineSeeds(entries: readonly VoiceLineEntry[]): void {
  for (const entry of entries) {
    if (!getVoiceLine(entry.nodeId)) {
      registerVoiceLine(entry);
    }
  }
}
