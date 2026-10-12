import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Feather, NotebookPen, ScrollText } from 'lucide-react';
import { toRoman } from '@/components/game/intro/introNotebookMeta';
import { POETRY_BOOK_LABELS } from '@/engine/poetryBook/poetryBookConstants';
import { getPoemLineClass } from '@/engine/poetryBook/poetryBookPresentation';
import { PoemPowerCard } from '@/components/game/poetryBook/PoemPowerCard';
import { PoemThemeTag } from '@/components/game/poetryBook/PoemThemeTag';
import type { PoetryBookController } from '@/components/game/poetryBook/usePoetryBookController';

type PoemSpreadViewProps = Pick<
  PoetryBookController,
  | 'selectedPoem'
  | 'displayedLines'
  | 'done'
  | 'skipAll'
  | 'marginNote'
  | 'pageNumber'
  | 'totalPages'
  | 'currentPoemIndex'
  | 'reducedMotion'
  | 'contentRef'
  | 'handleBack'
  | 'handlePrevPoem'
  | 'handleNextPoem'
> & {
  /** Текущий вид — рисует иконку переключателя (в развороте он предложит свиток). */
  viewMode: 'spread' | 'scroll';
  onToggleViewMode: () => void;
};

/* ─── Разворот «Ночной тетради» в панели «Собрание стихов» (v4.48.9) ───
 * Левая страница — титул: название, автор, темы, вступление и сила стиха.
 * Правая — текст у янтарной линии полей; буквы пишутся тем же машинописцем,
 * что и в свитке (клик по странице — дописать сразу). Заметка Володьки
 * «на полях» живёт под левой страницей (lg+) или после текста (узко).
 * Стилистически — те же классы .vk-intro-*, что и в интро-стихе.
 */
export function PoemSpreadView({
  selectedPoem,
  displayedLines,
  done,
  skipAll,
  marginNote,
  pageNumber,
  totalPages,
  currentPoemIndex,
  reducedMotion,
  contentRef,
  handleBack,
  handlePrevPoem,
  handleNextPoem,
  viewMode,
  onToggleViewMode,
}: PoemSpreadViewProps) {
  if (!selectedPoem) return null;

  const liveText = displayedLines.filter(Boolean).join('\n');
  const leaf = toRoman(selectedPoem.order || currentPoemIndex + 1);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Ночной стол + лист тетради */}
      <div className="relative flex-1 min-h-0 m-1.5 mb-0 rounded-sm overflow-hidden vk-intro-night">
        {!reducedMotion && <div className="vk-intro-lantern" aria-hidden="true" />}

        <div className="vk-intro-sheet vk-book-sheet">
          <div className="vk-intro-sheethead">
            <span className="vk-intro-sheetlabel">
              {POETRY_BOOK_LABELS.spreadSheetLabel(leaf)}
            </span>
            <span className="vk-intro-sheetlabel vk-book-sheetlabel-dim">
              {selectedPoem.author}
            </span>
          </div>

          <div className="vk-intro-spread">
            {/* ЛЕВАЯ СТРАНИЦА — титул и сила */}
            <div className="vk-intro-page vk-intro-page--left">
              <div className="vk-book-page">
                <div className="my-auto w-full">
                  <button
                    type="button"
                    onClick={handleBack}
                    aria-label={POETRY_BOOK_LABELS.backToList}
                    className="flex items-center gap-1.5 text-xs text-amber-500/60 hover:text-amber-300 mb-4 transition-colors font-serif"
                  >
                    <ChevronLeft className="size-3.5" aria-hidden="true" />
                    {POETRY_BOOK_LABELS.backToList}
                  </button>

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-amber-100/90 mb-1 font-serif vk-book-ink">
                      {selectedPoem.title}
                    </h3>
                    {selectedPoem.subtitle && (
                      <p className="text-sm text-amber-300/50 italic font-serif">{selectedPoem.subtitle}</p>
                    )}
                    <p className="text-xs text-amber-600/50 mt-1.5 font-serif">{selectedPoem.author}</p>
                  </div>

                  {selectedPoem.themes.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                      {selectedPoem.themes.map((theme) => (
                        <PoemThemeTag key={theme} theme={theme} />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 mb-4" aria-hidden="true">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-600/30" />
                    <Feather className="size-3.5 text-amber-600/30" />
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-600/30" />
                  </div>

                  {selectedPoem.intro && (
                    <div className="mb-4 px-4 py-3 rounded border border-amber-900/25 bg-amber-950/10">
                      <p className="text-sm text-amber-200/50 italic leading-relaxed font-serif">
                        {selectedPoem.intro}
                      </p>
                    </div>
                  )}

                  <PoemPowerCard poemId={selectedPoem.id} variant="inline" reducedMotion={reducedMotion} />
                </div>
              </div>
            </div>

            <div className="vk-intro-spine" aria-hidden="true" />

            {/* ПРАВАЯ СТРАНИЦА — текст у линии полей */}
            <div className="vk-intro-page vk-intro-page--right">
              <div className="vk-intro-marginline" aria-hidden="true" />
              <div
                className="vk-book-page cursor-pointer"
                onClick={!done ? skipAll : undefined}
                onKeyDown={(event) => {
                  if (!done && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    skipAll();
                  }
                }}
              >
                <div
                  ref={contentRef}
                  tabIndex={-1}
                  role="region"
                  aria-label={POETRY_BOOK_LABELS.spreadRegion(selectedPoem.title)}
                  className="my-auto w-full pl-7 pr-5 outline-none"
                >
                  <div aria-live="polite" aria-atomic="true" className="sr-only">
                    {POETRY_BOOK_LABELS.typewriterLive(selectedPoem.title)}
                    {liveText ? `: ${liveText}` : ''}
                  </div>

                  <div className="space-y-0.5 max-w-md" aria-hidden={!done}>
                    {displayedLines.map((line, index) => (
                      <p
                        key={index}
                        className={`leading-relaxed font-serif vk-book-ink ${getPoemLineClass(line)}`}
                      >
                        {line}
                        {index === displayedLines.length - 1 && !done && line !== '' && (
                          <span
                            className={`inline-block w-0.5 h-4 bg-amber-400/80 ml-0.5 align-middle ${
                              reducedMotion ? '' : 'animate-pulse'
                            }`}
                          />
                        )}
                      </p>
                    ))}
                  </div>

                  {done && (
                    <motion.div
                      initial={reducedMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.5 }}
                      className="flex items-center justify-center gap-3 mt-5"
                      aria-hidden="true"
                    >
                      <div className="h-px w-8 bg-amber-700/20" />
                      <span className="text-amber-600/25 text-xs">✦</span>
                      <div className="h-px w-8 bg-amber-700/20" />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Заметка на полях — под левой страницей (lg+) / после текста (узко) */}
            {done && marginNote && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 0.9 }}
                className="vk-intro-note-row"
              >
                <p className="vk-intro-note-label mb-1.5">{POETRY_BOOK_LABELS.marginNoteHeading}</p>
                <p className="vk-intro-note">{marginNote.text}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Навигатор: пред/след, номер листа, переключатель вида */}
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-amber-800/15 shrink-0 gap-2">
        <button
          type="button"
          onClick={handlePrevPoem}
          disabled={currentPoemIndex <= 0}
          aria-label={POETRY_BOOK_LABELS.prevPoem}
          className="flex items-center gap-1 text-xs text-amber-500/50 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-serif"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          {POETRY_BOOK_LABELS.prevPoem}
        </button>
        <span className="text-[10px] text-amber-600/40 font-serif">
          {POETRY_BOOK_LABELS.pageNumber(pageNumber, totalPages)}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNextPoem}
            disabled={currentPoemIndex >= totalPages - 1}
            aria-label={POETRY_BOOK_LABELS.nextPoem}
            className="flex items-center gap-1 text-xs text-amber-500/50 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-serif"
          >
            {POETRY_BOOK_LABELS.nextPoem}
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </button>
          <span className="w-px h-4 bg-amber-800/20" aria-hidden="true" />
          <button
            type="button"
            onClick={onToggleViewMode}
            aria-label={POETRY_BOOK_LABELS.viewModeToggleAria(viewMode === 'spread')}
            aria-pressed={viewMode === 'spread'}
            title={POETRY_BOOK_LABELS.viewModeToggleAria(viewMode === 'spread')}
            className="flex items-center gap-1.5 text-xs text-amber-500/50 hover:text-amber-300 transition-colors font-serif"
          >
            {viewMode === 'spread' ? (
              <ScrollText className="size-3.5" aria-hidden="true" />
            ) : (
              <NotebookPen className="size-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {viewMode === 'spread' ? POETRY_BOOK_LABELS.viewModeScroll : POETRY_BOOK_LABELS.viewModeSpread}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
