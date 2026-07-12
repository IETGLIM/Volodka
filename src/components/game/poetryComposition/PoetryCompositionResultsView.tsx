import { motion } from 'framer-motion';
import {
  POETRY_COMPOSITION_ACCENT_COLOR,
  POETRY_COMPOSITION_ACCENT_RGB,
  POETRY_COMPOSITION_LABELS,
} from '@/engine/minigame/poetryComposition/poetryCompositionConstants';
import {
  buildResultsAnnouncement,
  getResultsTransition,
} from '@/engine/minigame/poetryComposition/poetryCompositionPresentation';
import type { PoetryCompositionGameController } from '@/components/game/poetryComposition/usePoetryCompositionGame';

type PoetryCompositionResultsViewProps = Pick<
  PoetryCompositionGameController,
  | 'score'
  | 'roundScores'
  | 'rewards'
  | 'qualityRating'
  | 'reducedMotion'
  | 'handleClaimRewards'
>;

export function PoetryCompositionResultsView({
  score,
  roundScores,
  rewards,
  qualityRating,
  reducedMotion,
  handleClaimRewards,
}: PoetryCompositionResultsViewProps) {
  const resultsTransition = getResultsTransition(reducedMotion);
  const delay = reducedMotion ? 0 : undefined;

  return (
    <motion.div
      key="results"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={resultsTransition}
      className="text-center py-4"
      role="region"
      aria-label={POETRY_COMPOSITION_LABELS.poemComplete}
    >
      <div className="sr-only" aria-live="polite">
        {buildResultsAnnouncement(score, qualityRating.label)}
      </div>

      <motion.div
        initial={reducedMotion ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={reducedMotion ? { duration: 0 } : { delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-3xl mb-3"
        aria-hidden="true"
      >
        ✨
      </motion.div>

      <h3
        className="text-lg font-bold font-mono tracking-widest uppercase mb-2"
        style={{ color: POETRY_COMPOSITION_ACCENT_COLOR }}
      >
        {POETRY_COMPOSITION_LABELS.poemComplete}
      </h3>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...resultsTransition, delay: delay ?? 0.2 }}
        className="mb-4"
      >
        <span className="text-xs font-mono block" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
          {POETRY_COMPOSITION_LABELS.totalScore}
        </span>
        <span
          className="text-3xl font-bold font-mono"
          style={{ color: POETRY_COMPOSITION_ACCENT_COLOR, textShadow: `0 0 20px rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.4)` }}
        >
          {score}
        </span>
      </motion.div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...resultsTransition, delay: delay ?? 0.4 }}
        className="mb-4"
      >
        <span
          className="px-3 py-1 rounded-full font-mono text-xs font-bold tracking-wider uppercase"
          style={{
            background: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.1)`,
            border: `1px solid rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.3)`,
            color: qualityRating.color,
          }}
        >
          {qualityRating.label}
        </span>
      </motion.div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...resultsTransition, delay: delay ?? 0.5 }}
        className="mb-4 space-y-1"
      >
        {roundScores.map((roundScore, index) => (
          <div
            key={`round-score-${index}`}
            className="text-xs font-mono"
            style={{ color: 'rgba(148, 163, 184, 0.5)' }}
          >
            {POETRY_COMPOSITION_LABELS.roundScore(index + 1, roundScore)}
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...resultsTransition, delay: delay ?? 0.6 }}
        className="rounded-md p-3 mb-4"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.1)`,
        }}
      >
        <span
          className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-2"
          style={{ color: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.4)` }}
        >
          {POETRY_COMPOSITION_LABELS.rewards}
        </span>
        <div className="flex items-center justify-center gap-4 text-xs font-mono">
          <span style={{ color: '#00ffee' }}>{POETRY_COMPOSITION_LABELS.rewardXp(rewards.xpReward)}</span>
          <span style={{ color: '#ffcc00' }}>{POETRY_COMPOSITION_LABELS.rewardKarma(rewards.karmaReward)}</span>
          <span style={{ color: POETRY_COMPOSITION_ACCENT_COLOR }}>{POETRY_COMPOSITION_LABELS.rewardWriting}</span>
        </div>
      </motion.div>

      <motion.button
        type="button"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...resultsTransition, delay: delay ?? 0.7 }}
        onClick={handleClaimRewards}
        className="poetry-claim-btn px-6 py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
        style={{
          background: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.15)`,
          border: `1px solid rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.4)`,
          color: POETRY_COMPOSITION_ACCENT_COLOR,
          boxShadow: `0 0 15px rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.1)`,
        }}
      >
        {POETRY_COMPOSITION_LABELS.claimRewards}
      </motion.button>
    </motion.div>
  );
}
