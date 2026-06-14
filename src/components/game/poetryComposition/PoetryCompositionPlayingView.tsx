import { AnimatePresence, motion } from 'framer-motion';
import {
  POETRY_COMPOSITION_ACCENT_COLOR,
  POETRY_COMPOSITION_ACCENT_RGB,
  POETRY_COMPOSITION_LABELS,
} from '@/engine/minigame/poetryComposition/poetryCompositionConstants';
import {
  buildBlankAriaLabel,
  buildWordAriaLabel,
  getFinishButtonVariants,
  getRoundEnterVariants,
  getRoundTransition,
} from '@/engine/minigame/poetryComposition/poetryCompositionPresentation';
import type { PoetryCompositionGameController } from '@/components/game/poetryComposition/usePoetryCompositionGame';

type PoetryCompositionPlayingViewProps = Pick<
  PoetryCompositionGameController,
  | 'round'
  | 'score'
  | 'totalRounds'
  | 'template'
  | 'parsedLines'
  | 'allWordOptions'
  | 'selectedBlank'
  | 'filledBlanks'
  | 'usedWords'
  | 'allBlanksFilled'
  | 'liveAnnouncement'
  | 'reducedMotion'
  | 'handleBlankClick'
  | 'handleWordClick'
  | 'handleFinishRound'
>;

export function PoetryCompositionPlayingView({
  round,
  score,
  totalRounds,
  template,
  parsedLines,
  allWordOptions,
  selectedBlank,
  filledBlanks,
  usedWords,
  allBlanksFilled,
  liveAnnouncement,
  reducedMotion,
  handleBlankClick,
  handleWordClick,
  handleFinishRound,
}: PoetryCompositionPlayingViewProps) {
  const roundVariants = getRoundEnterVariants(reducedMotion);
  const finishVariants = getFinishButtonVariants(reducedMotion);

  return (
    <motion.div
      key={`round-${round}`}
      initial={roundVariants.initial}
      animate={roundVariants.animate}
      exit={roundVariants.exit}
      transition={getRoundTransition(reducedMotion)}
    >
      <span className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </span>
      <p className="sr-only">{POETRY_COMPOSITION_LABELS.instructionSr}</p>

      <div className="text-center mb-4">
        <h3 className="text-lg font-bold font-mono tracking-wide" style={{ color: POETRY_COMPOSITION_ACCENT_COLOR }}>
          {template.title}
        </h3>
        <span
          className="text-[10px] font-mono uppercase tracking-[0.2em]"
          style={{ color: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.4)` }}
        >
          {POETRY_COMPOSITION_LABELS.themePrefix} {template.theme}
        </span>
      </div>

      <div
        className="rounded-md p-4 mb-4 space-y-3"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.1)`,
        }}
        role="group"
        aria-label={template.title}
      >
        {parsedLines.map((segments, lineIdx) => (
          <p
            key={`line-${lineIdx}`}
            className="font-mono text-sm leading-relaxed text-center"
            style={{ color: 'rgba(200, 200, 220, 0.85)' }}
          >
            {segments.map((segment, segIdx) => {
              if (segment.type === 'text') {
                return <span key={`seg-${lineIdx}-${segIdx}`}>{segment.content}</span>;
              }

              const blankIdx = segment.blankIndex!;
              const filledWord = filledBlanks.get(blankIdx);
              const isFilled = filledWord !== undefined;
              const isSelected = selectedBlank === blankIdx;
              const blankClass = isFilled
                ? 'poetry-blank-btn--filled'
                : isSelected
                  ? `poetry-blank-btn--selected${reducedMotion ? '' : ' poetry-blank-btn--pulse'}`
                  : 'poetry-blank-btn--empty';

              return (
                <button
                  key={`blank-${blankIdx}`}
                  type="button"
                  aria-label={buildBlankAriaLabel(blankIdx, filledWord)}
                  aria-pressed={isSelected}
                  onClick={() => handleBlankClick(blankIdx)}
                  className={`poetry-blank-btn inline-block mx-0.5 ${blankClass}`}
                >
                  {isFilled ? filledWord.word : '___'}
                </button>
              );
            })}
          </p>
        ))}
      </div>

      <div className="mb-4">
        <span
          className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-2"
          style={{ color: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.4)` }}
          id="poetry-word-bank-label"
        >
          {POETRY_COMPOSITION_LABELS.wordBank}
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="poetry-word-bank-label">
          {allWordOptions.map((option, index) => {
            const isUsed = usedWords.has(option.word);
            return (
              <button
                key={`word-${option.word}-${index}`}
                type="button"
                disabled={isUsed}
                aria-label={buildWordAriaLabel(option.word, isUsed)}
                aria-disabled={isUsed}
                onClick={() => handleWordClick(option)}
                className="poetry-word-btn px-3 py-1.5 rounded-md font-mono text-xs transition-all duration-150 disabled:cursor-default"
                style={{
                  background: isUsed ? 'rgba(0, 0, 0, 0.2)' : `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.06)`,
                  border: isUsed
                    ? '1px solid rgba(100, 116, 139, 0.1)'
                    : `1px solid rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.2)`,
                  color: isUsed ? 'rgba(100, 116, 139, 0.25)' : `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.85)`,
                  textDecoration: isUsed ? 'line-through' : 'none',
                }}
              >
                {option.word}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] font-mono mb-3" style={{ color: 'rgba(148, 163, 184, 0.4)' }} aria-hidden="true">
        {selectedBlank !== null
          ? POETRY_COMPOSITION_LABELS.instructionPickWord
          : POETRY_COMPOSITION_LABELS.instructionSelectBlank}
      </p>

      <AnimatePresence>
        {allBlanksFilled && (
          <motion.button
            type="button"
            key="finish-round"
            initial={finishVariants.initial}
            animate={finishVariants.animate}
            exit={finishVariants.exit}
            transition={getRoundTransition(reducedMotion)}
            onClick={handleFinishRound}
            className="poetry-finish-btn w-full py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
            style={{
              background: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.15)`,
              border: `1px solid rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.4)`,
              color: POETRY_COMPOSITION_ACCENT_COLOR,
              boxShadow: `0 0 15px rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.1)`,
            }}
          >
            {round + 1 < totalRounds
              ? POETRY_COMPOSITION_LABELS.nextRound
              : POETRY_COMPOSITION_LABELS.finish}
          </motion.button>
        )}
      </AnimatePresence>

      <div className="sr-only" aria-live="polite">
        {POETRY_COMPOSITION_LABELS.score} {score}.{' '}
        {POETRY_COMPOSITION_LABELS.roundCounter(round + 1, totalRounds)}
      </div>
    </motion.div>
  );
}
