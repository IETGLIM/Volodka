import { motion } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, Feather, Lock, Sparkles } from 'lucide-react';
import { POEMS } from '@/data/poems';
import type { Poem } from '@/shared/types/game';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import { POETRY_BOOK_LABELS } from '@/engine/poetryBook/poetryBookConstants';
import { getPoemLineClass } from '@/engine/poetryBook/poetryBookPresentation';
import { PoemPowerCard } from '@/components/game/poetryBook/PoemPowerCard';
import { PoemThemeTag } from '@/components/game/poetryBook/PoemThemeTag';
import type { PoetryBookController } from '@/components/game/poetryBook/usePoetryBookController';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNewlyCollectedPoemIds } from '@/hooks/useNewlyCollectedPoemIds';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

type PoemDetailViewProps = Pick<
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
>;

export function PoemDetailView({
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
}: PoemDetailViewProps) {
  if (!selectedPoem) return null;

  const liveText = displayedLines.filter(Boolean).join('\n');

  return (
    <div className="h-full">
      <ScrollArea className="h-[calc(90vh-170px)]">
        <div
          ref={contentRef}
          tabIndex={-1}
          role="region"
          aria-label={POETRY_BOOK_LABELS.poemViewRegion(selectedPoem.title)}
          className="px-6 py-5 outline-none"
          onClick={!done ? skipAll : undefined}
          onKeyDown={(event) => {
            if (!done && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              skipAll();
            }
          }}
        >
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
            <h3 className="text-xl font-semibold text-amber-100/90 mb-1 font-serif">{selectedPoem.title}</h3>
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

          {selectedPoem.intro && (
            <div className="mb-4 px-4 py-3 rounded border border-amber-900/25 bg-amber-950/10">
              <p className="text-sm text-amber-200/50 italic leading-relaxed font-serif">{selectedPoem.intro}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mb-4" aria-hidden="true">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-600/30" />
            <Feather className="size-3.5 text-amber-600/30" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-600/30" />
          </div>

          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {POETRY_BOOK_LABELS.typewriterLive(selectedPoem.title)}
            {liveText ? `: ${liveText}` : ''}
          </div>

          <div className="space-y-0.5 max-w-md mx-auto" aria-hidden={!done}>
            {displayedLines.map((line, index) => (
              <p
                key={index}
                className={`text-center leading-relaxed font-serif ${getPoemLineClass(line)}`}
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
              className="flex items-center justify-center gap-3 mt-5 mb-2"
              aria-hidden="true"
            >
              <div className="h-px w-8 bg-amber-700/20" />
              <span className="text-amber-600/25 text-xs">✦</span>
              <div className="h-px w-8 bg-amber-700/20" />
            </motion.div>
          )}

          {done && marginNote && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 0.9 }}
              className="max-w-md mx-auto mt-4 pl-4 border-l border-dashed border-stone-500/30"
            >
              <p className="text-[10px] uppercase tracking-widest text-stone-500/60 mb-1.5 font-serif">
                {POETRY_BOOK_LABELS.marginNoteHeading}
              </p>
              <p className="text-sm text-stone-400/80 italic leading-relaxed font-serif">{marginNote.text}</p>
            </motion.div>
          )}

          <PoemPowerCard poemId={selectedPoem.id} variant="inline" reducedMotion={reducedMotion} />
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between px-6 py-2.5 border-t border-amber-800/15 shrink-0">
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
      </div>
    </div>
  );
}

type PoemListViewProps = Pick<
  PoetryBookController,
  | 'collectedMain'
  | 'collectedHidden'
  | 'collectedCount'
  | 'totalPoems'
  | 'collectedPoems'
  | 'contentRef'
  | 'handleSelectPoem'
>;

function PoemListButton({
  poem,
  onSelect,
  isNewlyCollected,
  reducedMotion,
}: {
  poem: Poem;
  onSelect: (id: string) => void;
  isNewlyCollected?: boolean;
  reducedMotion?: boolean;
}) {
  const power = getPoemPower(poem.id);
  const isHidden = poem.bonus;
  const enterClass = isNewlyCollected && !reducedMotion
    ? 'animate-in fade-in slide-in-from-bottom-2 duration-300'
    : '';

  return (
    <button
      type="button"
      role="listitem"
      onClick={() => onSelect(poem.id)}
      aria-label={POETRY_BOOK_LABELS.selectPoemAria(poem.title)}
      className={`group text-left px-4 py-3 rounded-lg border transition-all duration-200 ${enterClass} ${
        isHidden
          ? 'border-cyan-900/15 bg-cyan-950/5 hover:bg-cyan-950/15 hover:border-cyan-800/25'
          : 'border-amber-900/15 bg-amber-950/5 hover:bg-amber-950/15 hover:border-amber-800/25'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles
              className={`size-3 shrink-0 transition-colors ${
                isHidden
                  ? 'text-cyan-500/30 group-hover:text-cyan-400/60'
                  : 'text-amber-500/30 group-hover:text-amber-400/60'
              }`}
              aria-hidden="true"
            />
            <span
              className={`text-sm truncate font-serif transition-colors ${
                isHidden
                  ? 'text-cyan-100/80 group-hover:text-cyan-100'
                  : 'text-amber-100/80 group-hover:text-amber-100'
              }`}
            >
              {poem.title}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 ml-5 items-center">
            {poem.themes.slice(0, 3).map((theme) => (
              <span
                key={theme}
                className={`text-[10px] font-serif ${isHidden ? 'text-cyan-600/40' : 'text-amber-600/40'}`}
              >
                {theme}
              </span>
            ))}
            {power && (
              <span className={`text-[10px] ml-1 ${isHidden ? 'text-cyan-400/40' : 'text-amber-400/40'}`}>
                ⚡ {power.name}
              </span>
            )}
          </div>
        </div>
        {!isHidden && (
          <span className="text-[10px] text-amber-700/30 shrink-0 mt-0.5 font-serif">#{poem.order}</span>
        )}
      </div>
    </button>
  );
}

export function PoemListView({
  collectedMain,
  collectedHidden,
  collectedCount,
  totalPoems,
  collectedPoems,
  contentRef,
  handleSelectPoem,
}: PoemListViewProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const newlyCollected = useNewlyCollectedPoemIds(collectedPoems);
  const lockedPreview = POEMS.filter((poem) => !collectedPoems.includes(poem.id)).slice(0, 5);
  const lockedRemaining = totalPoems - collectedCount - lockedPreview.length;

  return (
    <div className="h-full">
      <ScrollArea className="h-[calc(90vh-170px)]">
        <div
          ref={contentRef}
          tabIndex={-1}
          role="region"
          aria-label={POETRY_BOOK_LABELS.poemListRegion}
          className="px-5 py-4 outline-none"
        >
          {collectedMain.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[11px] font-medium text-amber-500/50 uppercase tracking-widest mb-3 flex items-center gap-2 font-serif">
                <Feather className="size-3" aria-hidden="true" />
                {POETRY_BOOK_LABELS.mainPoemsSection}
              </h3>
              <div className="flex flex-col gap-2" role="list">
                {collectedMain.map((poem) => (
                  <PoemListButton
                    key={poem.id}
                    poem={poem}
                    onSelect={handleSelectPoem}
                    isNewlyCollected={newlyCollected.has(poem.id)}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </div>
          )}

          {collectedHidden.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[11px] font-medium text-cyan-500/50 uppercase tracking-widest mb-3 flex items-center gap-2 font-serif">
                <Sparkles className="size-3" aria-hidden="true" />
                {POETRY_BOOK_LABELS.hiddenPoemsSection}
              </h3>
              <div className="flex flex-col gap-2" role="list">
                {collectedHidden.map((poem) => (
                  <PoemListButton
                    key={poem.id}
                    poem={poem}
                    onSelect={handleSelectPoem}
                    isNewlyCollected={newlyCollected.has(poem.id)}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </div>
          )}

          {collectedCount < totalPoems && (
            <div className="mt-4">
              <h3 className="text-[11px] font-medium text-stone-600 uppercase tracking-widest mb-3 font-serif">
                {POETRY_BOOK_LABELS.lockedSection}
              </h3>
              <div className="flex flex-col gap-1.5" role="list">
                {lockedPreview.map((poem) => (
                  <div
                    key={poem.id}
                    role="listitem"
                    aria-label={POETRY_BOOK_LABELS.lockedPoemAria}
                    className="flex items-center gap-2.5 px-3 py-2 rounded border border-amber-900/10 bg-amber-950/5 opacity-40"
                  >
                    <Lock className="size-3 text-amber-700/40" aria-hidden="true" />
                    <span className="text-xs text-amber-700/40 truncate font-serif">{poem.title}</span>
                  </div>
                ))}
                {lockedRemaining > 0 && (
                  <p className="text-[10px] text-amber-800/30 text-center mt-1 font-serif">
                    {POETRY_BOOK_LABELS.lockedMore(lockedRemaining)}
                  </p>
                )}
              </div>
            </div>
          )}

          {collectedCount === 0 && (
            <div className="text-center py-12">
              <BookOpen className="size-10 text-amber-700/30 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-amber-500/40 mb-1 font-serif">{POETRY_BOOK_LABELS.emptyPoemsTitle}</p>
              <p className="text-xs text-amber-700/30 font-serif">{POETRY_BOOK_LABELS.emptyPoemsHint}</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center justify-center py-2 border-t border-amber-800/15 shrink-0">
        <span className="text-[10px] text-amber-600/30 font-serif">{POETRY_BOOK_LABELS.tableOfContents}</span>
      </div>
    </div>
  );
}
