'use client';

/* ─── Volodka RPG – Minigame Score Tracker ───
 * Displays best score, completion count, and personal best time
 * on the minigame hub cards. Reads from localStorage.
 */

import { useEffect, useState } from 'react';
import { MINIGAME_TYPES, type MinigameType } from '@/shared/constants/minigames';

const LS_PREFIX = 'volodka_minigame_stats_';

export interface MinigameStats {
  bestScore: number;
  completions: number;
  bestTimeMs: number | null;
  lastPlayed: number | null;
}

function loadStats(gameType: MinigameType): MinigameStats {
  if (typeof window === 'undefined') {
    return { bestScore: 0, completions: 0, bestTimeMs: null, lastPlayed: null };
  }
  try {
    const raw = localStorage.getItem(LS_PREFIX + gameType);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted data — ignore */
  }
  return { bestScore: 0, completions: 0, bestTimeMs: null, lastPlayed: null };
}

function saveStats(gameType: MinigameType, stats: MinigameStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_PREFIX + gameType, JSON.stringify(stats));
  } catch {
    /* quota exceeded — silent */
  }
}

/** Record a minigame play result — updates best score/time and completion count. */
export function recordMinigameResult(
  gameType: MinigameType,
  score: number,
  timeMs?: number,
): MinigameStats {
  const current = loadStats(gameType);
  const updated: MinigameStats = {
    bestScore: Math.max(current.bestScore, score),
    completions: current.completions + 1,
    bestTimeMs:
      timeMs !== undefined
        ? current.bestTimeMs !== null
          ? Math.min(current.bestTimeMs, timeMs)
          : timeMs
        : current.bestTimeMs,
    lastPlayed: Date.now(),
  };
  saveStats(gameType, updated);
  return updated;
}

/** Clear all minigame stats (for debug / reset). */
export function clearAllMinigameStats(): void {
  if (typeof window === 'undefined') return;
  for (const type of MINIGAME_TYPES) {
    localStorage.removeItem(LS_PREFIX + type);
  }
}

/** Hook to read minigame stats for a specific game. */
export function useMinigameStats(gameType: MinigameType): MinigameStats {
  const [stats, setStats] = useState<MinigameStats>(() => loadStats(gameType));

  useEffect(() => {
    // Re-read on mount (localStorage may have changed)
    setStats(loadStats(gameType));

    const interval = setInterval(() => {
      setStats(loadStats(gameType));
    }, 2000);

    return () => clearInterval(interval);
  }, [gameType]);

  return stats;
}

/** Format time in ms to mm:ss format. */
export function formatMinigameTime(ms: number | null): string {
  if (ms === null || ms <= 0) return '--:--';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

type MinigameScoreTrackerProps = {
  gameType: MinigameType;
  accentRgb: string;
  compact?: boolean;
};

/** Small inline stats display for the minigame hub cards. */
export function MinigameScoreTracker({ gameType, accentRgb, compact = false }: MinigameScoreTrackerProps) {
  const stats = useMinigameStats(gameType);

  if (stats.completions === 0 && compact) {
    return null;
  }

  if (compact) {
    return (
      <div
        className="minigame-score-tracker-compact"
        aria-label={`Рекорд: ${stats.bestScore}, Пройдено: ${stats.completions} раз`}
      >
        <span
          className="minigame-score-tracker-stat"
          style={{ color: `rgba(${accentRgb}, 0.6)` }}
        >
          ★ {stats.bestScore}
        </span>
        <span className="minigame-score-tracker-stat" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
          ×{stats.completions}
        </span>
      </div>
    );
  }

  return (
    <div className="minigame-score-tracker" aria-label={`Статистика: рекорд ${stats.bestScore}, пройдено ${stats.completions} раз, лучшее время ${formatMinigameTime(stats.bestTimeMs)}`}>
      <div className="minigame-score-tracker-row">
        <span className="minigame-score-tracker-label">Рекорд</span>
        <span className="minigame-score-tracker-value" style={{ color: `rgba(${accentRgb}, 0.85)` }}>
          {stats.bestScore || '—'}
        </span>
      </div>
      <div className="minigame-score-tracker-row">
        <span className="minigame-score-tracker-label">Пройдено</span>
        <span className="minigame-score-tracker-value" style={{ color: 'rgba(148, 163, 184, 0.6)' }}>
          {stats.completions} раз
        </span>
      </div>
      {stats.bestTimeMs !== null && (
        <div className="minigame-score-tracker-row">
          <span className="minigame-score-tracker-label">Лучшее время</span>
          <span className="minigame-score-tracker-value" style={{ color: `rgba(${accentRgb}, 0.6)` }}>
            {formatMinigameTime(stats.bestTimeMs)}
          </span>
        </div>
      )}
    </div>
  );
}
