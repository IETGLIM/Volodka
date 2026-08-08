'use client';

/* ─── Volodka RPG – Minigame Result Screen ───
 * Enhanced win/lose screen with stats, rewards preview, retry button.
 * Can wrap any minigame result with a unified chrome.
 */

import { memo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { GamepadButtonPrompt } from '@/components/game/GamepadButtonPrompt';
import { recordMinigameResult, formatMinigameTime } from '@/components/game/minigameHub/MinigameScoreTracker';
import type { MinigameType } from '@/shared/constants/minigames';

export type MinigameResultOutcome = 'won' | 'lost';

export interface MinigameResultReward {
  label: string;
  value: string;
  color: string;
}

export interface MinigameResultStat {
  label: string;
  value: string;
  color?: string;
}

export interface MinigameResultScreenProps {
  /** 'won' or 'lost' */
  outcome: MinigameResultOutcome;
  /** Minigame type for score tracking */
  gameType?: MinigameType;
  /** Score achieved this round */
  score?: number;
  /** Time taken this round (ms) */
  timeMs?: number;
  /** Quality rating label (e.g. "Отлично") */
  rating?: string;
  /** Rating color CSS */
  ratingColor?: string;
  /** Icon to display */
  icon?: string;
  /** Title text (e.g. "Взлом завершён") */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Stats rows to display */
  stats?: MinigameResultStat[];
  /** Reward rows to display */
  rewards?: MinigameResultReward[];
  /** Claim rewards button handler */
  onClaimRewards?: () => void;
  /** Whether rewards have been claimed */
  rewardsClaimed?: boolean;
  /** Retry button handler */
  onRetry?: () => void;
  /** Close / back button handler */
  onClose?: () => void;
  /** Back to difficulty setup handler */
  onBackToSetup?: () => void;
  /** Accent color for the result chrome */
  accentColor: string;
  /** Accent RGB values (e.g. "239, 68, 68") */
  accentRgb: string;
}

export const MinigameResultScreen = memo(function MinigameResultScreen({
  outcome,
  gameType,
  score,
  timeMs,
  rating,
  ratingColor,
  icon,
  title,
  subtitle,
  stats = [],
  rewards = [],
  onClaimRewards,
  rewardsClaimed = false,
  onRetry,
  onClose,
  onBackToSetup,
  accentColor,
  accentRgb,
}: MinigameResultScreenProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const gamepadConnected = useGamepadConnected();
  const claimRef = useRef<HTMLButtonElement>(null);

  const isWin = outcome === 'won';
  const displayIcon = icon ?? (isWin ? '✅' : '💀');
  const delay = reducedMotion ? 0 : undefined;

  // Record result when component mounts with a win + gameType
  useEffect(() => {
    if (gameType && isWin && score !== undefined) {
      recordMinigameResult(gameType, score, timeMs);
    }
  }, [gameType, isWin, score, timeMs]);

  // Focus claim button on mount
  useEffect(() => {
    if (claimRef.current) {
      claimRef.current.focus({ preventScroll: true });
    }
  }, []);

  return (
    <motion.div
      className="minigame-result-screen"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
      role="region"
      aria-label={`Результат: ${isWin ? 'Победа' : 'Поражение'}. ${title}`}
      aria-live="polite"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="assertive">
        {isWin ? 'Победа!' : 'Поражение.'} {title}. {score !== undefined ? `Очки: ${score}` : ''} {rating ?? ''} {subtitle ?? ''}
      </div>

      {/* Icon */}
      <motion.div
        className="minigame-result-icon"
        initial={reducedMotion ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay ?? 0.1, type: 'spring', stiffness: 200 }}
        aria-hidden="true"
      >
        {displayIcon}
      </motion.div>

      {/* Title */}
      <h3
        className="minigame-result-title"
        style={{ color: isWin ? 'rgba(34, 197, 94, 0.9)' : accentColor }}
      >
        {title}
      </h3>

      {/* Rating badge */}
      {rating && (
        <motion.div
          className="minigame-result-rating"
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay ?? 0.2 }}
        >
          <span
            className="minigame-result-rating-badge"
            style={{
              background: `rgba(${accentRgb}, 0.1)`,
              border: `1px solid rgba(${accentRgb}, 0.3)`,
              color: ratingColor ?? accentColor,
              textShadow: `0 0 10px ${ratingColor ?? accentColor}`,
            }}
          >
            {rating}
          </span>
        </motion.div>
      )}

      {/* Score */}
      {score !== undefined && (
        <motion.div
          className="minigame-result-score"
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay ?? 0.25 }}
        >
          <span className="minigame-result-score-label">Итоговый счёт</span>
          <motion.span
            className="minigame-result-score-value"
            initial={reducedMotion ? false : { scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay ?? 0.35, type: 'spring', stiffness: 150 }}
            style={{
              color: accentColor,
              textShadow: `0 0 20px rgba(${accentRgb}, 0.4)`,
            }}
          >
            {score}
          </motion.span>
        </motion.div>
      )}

      {/* Subtitle / description */}
      {subtitle && (
        <motion.p
          className="minigame-result-subtitle"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay ?? 0.2 }}
        >
          {subtitle}
        </motion.p>
      )}

      {/* Stats rows */}
      {stats.length > 0 && (
        <motion.div
          className="minigame-result-stats"
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay ?? 0.3 }}
          aria-label="Подробная статистика"
          role="list"
        >
          {stats.map((stat, i) => (
            <div key={`stat-${i}`} className="minigame-result-stats-row" role="listitem">
              <span className="minigame-result-stats-label">{stat.label}</span>
              <span className="minigame-result-stats-value" style={{ color: stat.color ?? `rgba(${accentRgb}, 0.8)` }}>
                {stat.value}
              </span>
            </div>
          ))}
          {timeMs !== undefined && (
            <div className="minigame-result-stats-row" role="listitem">
              <span className="minigame-result-stats-label">Время</span>
              <span className="minigame-result-stats-value" style={{ color: 'rgba(148, 163, 184, 0.6)' }}>
                {formatMinigameTime(timeMs)}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Rewards section */}
      {isWin && rewards.length > 0 && (
        <motion.div
          className="minigame-result-rewards"
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay ?? 0.4 }}
          aria-label="Награды"
        >
          <span className="minigame-result-rewards-label">Награды</span>
          <div className="minigame-result-rewards-list">
            {rewards.map((reward, i) => (
              <span
                key={`reward-${i}`}
                className="minigame-result-rewards-item"
                style={{ color: reward.color }}
              >
                {reward.value}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="minigame-result-actions">
        {/* Win: claim rewards */}
        {isWin && onClaimRewards && (
          <motion.button
            ref={claimRef}
            type="button"
            className="minigame-result-btn minigame-result-btn--primary"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay ?? 0.5 }}
            onClick={onClaimRewards}
            disabled={rewardsClaimed}
            aria-label={rewardsClaimed ? 'Награды получены' : 'Забрать награды'}
            style={{
              background: rewardsClaimed ? 'rgba(71, 85, 105, 0.1)' : `rgba(${accentRgb}, 0.15)`,
              border: `1px solid ${rewardsClaimed ? 'rgba(71, 85, 105, 0.2)' : `rgba(${accentRgb}, 0.4)`}`,
              color: rewardsClaimed ? 'rgba(148, 163, 184, 0.3)' : accentColor,
            }}
          >
            {rewardsClaimed ? 'Награды получены' : 'Забрать награды'}
          </motion.button>
        )}

        {/* Loss: retry + back to setup */}
        {!isWin && (
          <>
            {onRetry && (
              <motion.button
                type="button"
                className="minigame-result-btn minigame-result-btn--primary"
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay ?? 0.4 }}
                onClick={onRetry}
                aria-label="Повторить"
                style={{
                  background: `rgba(${accentRgb}, 0.15)`,
                  border: `1px solid rgba(${accentRgb}, 0.4)`,
                  color: accentColor,
                }}
              >
                Повторить
              </motion.button>
            )}
            {onBackToSetup && (
              <motion.button
                type="button"
                className="minigame-result-btn"
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay ?? 0.5 }}
                onClick={onBackToSetup}
                aria-label="Выбор сложности"
              >
                Выбор сложности
              </motion.button>
            )}
          </>
        )}

        {/* Always: retry button (when win) and close */}
        {isWin && onRetry && (
          <motion.button
            type="button"
            className="minigame-result-btn"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay ?? 0.6 }}
            onClick={onRetry}
            aria-label="Играть снова"
          >
            Играть снова
          </motion.button>
        )}
        {onClose && (
          <motion.button
            type="button"
            className="minigame-result-btn"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay ?? 0.65 }}
            onClick={onClose}
            aria-label="Закрыть"
          >
            Закрыть
          </motion.button>
        )}
      </div>

      {/* Gamepad hint */}
      {gamepadConnected && (
        <div className="minigame-result-gamepad-hint" aria-hidden="true">
          <GamepadButtonPrompt action="confirm" />
        </div>
      )}
    </motion.div>
  );
});
