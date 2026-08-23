/* ─── useCityWhisper — «Шёпот города» при высоком стрессе ───
 *
 * Клиентская интеграция серверного режима `/api/matrix-quote?mode=whisper`
 * (edge-функция, FreeRouter; см. api/lib/matrixWhisperLogic.ts).
 *
 * Механика: когда стресс игрока поднимается ≥ WHISPER_STRESS_THRESHOLD (70),
 * город «шепчет» — короткая тревожная строка от первого лица выводится
 * кинематографичным оверлеем (CityWhisperOverlay). Частота ограничена:
 *   - один шёпот на «эпизод» высокого стресса (новый эпизод начинается
 *     только после падения стресса ≤ WHISPER_STRESS_RESET — гистерезис
 *     против дребезга на границе 70);
 *   - глобальный кулдаун WHISPER_COOLDOWN_MS между шёпотами (переживает
 *     перезагрузку через localStorage).
 *
 * Graceful degradation: сервер при отсутствии ключа/сети сам возвращает
 * fallback-шёпот; при полном отказе fetch — тихо ничего не показываем.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

/* ─── Чистая логика гейтинга (юнит-тестируется) ─── */

export const WHISPER_STRESS_THRESHOLD = 70;
export const WHISPER_STRESS_RESET = 60;
export const WHISPER_COOLDOWN_MS = 8 * 60 * 1000;
export const WHISPER_DISPLAY_MS = 9000;
const LS_LAST_WHISPER_AT = 'whisper-last-at';
const FETCH_TIMEOUT_MS = 4500;

/** Разрешить ли запрос нового шёпота при текущем стрессе. */
export function shouldRequestWhisper(
  stress: number,
  episodeWhispered: boolean,
  lastWhisperAt: number,
  now: number,
): boolean {
  if (episodeWhispered) return false;
  if (stress < WHISPER_STRESS_THRESHOLD) return false;
  if (now - lastWhisperAt < WHISPER_COOLDOWN_MS) return false;
  return true;
}

/** Закончился ли эпизод высокого стресса (гистерезис — ниже RESET, не THRESHOLD). */
export function isWhisperEpisodeOver(stress: number): boolean {
  return stress <= WHISPER_STRESS_RESET;
}

function readLastWhisperAt(): number {
  try {
    const raw = localStorage.getItem(LS_LAST_WHISPER_AT);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeLastWhisperAt(at: number): void {
  try {
    localStorage.setItem(LS_LAST_WHISPER_AT, String(at));
  } catch {
    // private mode / quota — кулдаун просто не переживёт перезагрузку
  }
}

export interface CityWhisperState {
  /** Текст шёпота (показывается, пока не null и displayActive). */
  whisper: string | null;
  /** Оверлей видим (таймер жизни ещё не истёк). */
  displayActive: boolean;
}

/**
 * Слушает стресс игрока; на пороге 70+ (с кулдауном и гистерезисом)
 * запрашивает шёпот города и отдаёт его оверлею.
 */
export function useCityWhisper(): CityWhisperState {
  const stress = useGameStore((s) => s.playerState.stress);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [displayActive, setDisplayActive] = useState(false);

  const episodeWhisperedRef = useRef(false);
  const inFlightRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hideSoon = useCallback((): void => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setDisplayActive(false);
      // Текст держим до следующего шёпота — оверлей сам скрывается.
    }, WHISPER_DISPLAY_MS);
  }, []);

  useEffect(() => {
    const now = Date.now();

    // Эпизод закончен — разрешаем следующий шёпот при новом подъёме.
    if (isWhisperEpisodeOver(stress)) {
      episodeWhisperedRef.current = false;
      return;
    }

    if (!shouldRequestWhisper(stress, episodeWhisperedRef.current, readLastWhisperAt(), now)) {
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    episodeWhisperedRef.current = true;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const state = useGameStore.getState();
    const params = new URLSearchParams({
      mode: 'whisper',
      scene: (state.exploration.currentSceneId ?? 'street').slice(0, 64),
      karma: String(Math.trunc(state.playerState.karma ?? 50)),
      act: String(Math.max(1, Math.min(7, state.playerState.progression?.currentAct ?? 1))),
    });

    fetch(`/api/matrix-quote?${params.toString()}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { quote?: string } | null) => {
        const text = typeof data?.quote === 'string' && data.quote.trim().length >= 3
          ? data.quote.trim()
          : null;
        writeLastWhisperAt(Date.now());
        if (!text) return; // полный отказ — тишина, игра не ломается
        setWhisper(text);
        setDisplayActive(true);
        hideSoon();
      })
      .catch(() => {
        writeLastWhisperAt(Date.now()); // не дёргаем API чаще кулдауна и при ошибках
      })
      .finally(() => {
        clearTimeout(timeout);
        inFlightRef.current = false;
      });
  }, [stress, hideSoon]);

  // Размонтирование — убрать таймер скрытия.
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return { whisper, displayActive };
}
