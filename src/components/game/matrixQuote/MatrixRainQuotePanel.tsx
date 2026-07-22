import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MatrixRainColumns } from '@/components/game/matrixQuote/MatrixRainColumns';
import { useMatrixQuoteDismiss } from '@/components/game/matrixQuote/useMatrixQuoteDismiss';
import {
  MATRIX_QUOTE_CLOSE_LABEL,
  MATRIX_QUOTE_DEFAULT_DURATION_MS,
  MATRIX_QUOTE_DISMISS_HINT,
  MATRIX_QUOTE_TYPE_SPEED,
} from '@/engine/matrixQuote/matrixQuoteConstants';
import {
  buildActFooterLabel,
  buildChapterSubtitle,
  buildQuoteAriaLabel,
  getActThemeColor,
} from '@/engine/matrixQuote/matrixQuotePresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export interface MatrixRainQuoteProps {
  text: string;
  actNumber?: number;
  chapterTitle?: string;
  duration?: number;
  onDismiss: () => void;
}

function MatrixRainQuotePanel({
  text,
  actNumber = 1,
  chapterTitle,
  duration = MATRIX_QUOTE_DEFAULT_DURATION_MS,
  onDismiss,
}: MatrixRainQuoteProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const [visible, setVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  const bodyText = text.trim() || chapterTitle?.trim() || '';
  const showChapterSubtitle = Boolean(chapterTitle?.trim() && text.trim());
  const typeSpeed = reducedMotion ? 0 : MATRIX_QUOTE_TYPE_SPEED;
  const { displayed, done, skip } = useTypewriter(bodyText, typeSpeed);

  useEffect(() => {
    if (reducedMotion && bodyText) skip();
  }, [reducedMotion, bodyText, skip]);

  const { handleInteraction } = useMatrixQuoteDismiss({
    done,
    skip,
    onDismiss,
    reducedMotion,
    duration,
    enabled: visible,
    setVisible,
  });

  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  const themeColor = useMemo(() => getActThemeColor(actNumber), [actNumber]);
  const fadeDuration = reducedMotion ? 0 : 0.5;
  const ariaLabel = buildQuoteAriaLabel(actNumber, chapterTitle?.trim() || undefined);

  if (!bodyText) return null;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fadeDuration }}
          className="fixed inset-0 flex items-center justify-center cursor-pointer outline-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION, background: 'rgba(0,0,0,0.92)' }}
          onClick={handleInteraction}
          onKeyDown={(event) => {
            if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleInteraction();
            }
          }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={MATRIX_QUOTE_CLOSE_LABEL}
          aria-labelledby="matrix-quote-title"
          aria-describedby="matrix-quote-body"
        >
          {!reducedMotion ? (
            <ErrorBoundary name="matrix-rain-quote" fallback={null}>
              <MatrixRainColumns color={themeColor} />
            </ErrorBoundary>
          ) : null}

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
            transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
            className="relative z-10 text-center px-8 max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div
              className="absolute inset-0 -m-8 rounded-xl pointer-events-none"
              style={{
                background: `radial-gradient(ellipse, ${themeColor}08 0%, transparent 70%)`,
                filter: 'blur(20px)',
              }}
            />

            {showChapterSubtitle ? (
              <p
                id="matrix-quote-title"
                className="mb-4 text-sm md:text-base font-mono tracking-[0.25em] uppercase"
                style={{ color: `${themeColor}cc` }}
              >
                {buildChapterSubtitle(actNumber, chapterTitle!.trim())}
              </p>
            ) : (
              <span id="matrix-quote-title" className="sr-only">
                {ariaLabel}
              </span>
            )}

            <p
              id="matrix-quote-body"
              className="text-xl md:text-2xl font-mono leading-relaxed tracking-wide"
              style={{
                color: themeColor,
                textShadow: `0 0 20px ${themeColor}66, 0 0 40px ${themeColor}33, 0 0 60px ${themeColor}11`,
              }}
            >
              {displayed}
              {!done && !reducedMotion ? (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={{ color: themeColor }}
                  aria-hidden="true"
                >
                  |
                </motion.span>
              ) : null}
            </p>

            {!showChapterSubtitle ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: reducedMotion ? 0 : 1 }}
                className="mt-6 text-xs font-mono tracking-[0.3em]"
                style={{ color: themeColor }}
              >
                {buildActFooterLabel(actNumber, chapterTitle?.trim() || undefined)}
              </motion.div>
            ) : null}

            {done ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: reducedMotion ? 0 : 0.5 }}
                className="mt-4 text-[10px] font-mono"
                style={{ color: '#666' }}
              >
                {MATRIX_QUOTE_DISMISS_HINT}
              </motion.div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MatrixRainQuote(props: MatrixRainQuoteProps) {
  return (
    <ErrorBoundary name="matrix-rain-quote-overlay" fallback={null}>
      <MatrixRainQuotePanel {...props} />
    </ErrorBoundary>
  );
}
