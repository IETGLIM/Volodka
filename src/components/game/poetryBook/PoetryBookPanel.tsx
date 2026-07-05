import { BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PanelWrapper } from '@/components/game/PanelWrapper';
import { PoemDetailView, PoemListView } from '@/components/game/poetryBook/PoemViews';
import { PoetryBookTabs } from '@/components/game/poetryBook/PoetryBookTabs';
import { PowersTab } from '@/components/game/poetryBook/PowersTab';
import { usePoetryBookController } from '@/components/game/poetryBook/usePoetryBookController';
import { POETRY_BOOK_LABELS } from '@/engine/poetryBook/poetryBookConstants';
import {
  getPageTurnTransition,
  getPageTurnVariants,
} from '@/engine/poetryBook/poetryBookPresentation';

export type PoetryBookProps = {
  open: boolean;
  onClose: () => void;
};

function PoetryBookInner({ open, onClose }: PoetryBookProps) {
  const book = usePoetryBookController(open, onClose);
  const pageTurnVariants = getPageTurnVariants(book.reducedMotion);

  return (
    <PanelWrapper
      open={open}
      onClose={book.handleClose}
      title={POETRY_BOOK_LABELS.title}
      urlPath={POETRY_BOOK_LABELS.urlPath}
      accentColor="amber"
      layout="centered"
      maxWidth="max-w-xl"
      icon={<BookOpen className="size-5 text-amber-400/80" aria-hidden="true" />}
      headerExtra={(
        <div className="flex flex-col items-end">
          <span className="text-xs text-amber-600/60">
            {POETRY_BOOK_LABELS.headerCount(book.collectedCount, book.totalPoems)}
          </span>
          <span className="text-[10px] text-amber-400/50">{POETRY_BOOK_LABELS.headerTagline}</span>
        </div>
      )}
    >
      <div
        className="scanline-overlay flex flex-col max-h-[70vh] overflow-hidden relative"
        style={{
          background: `
            linear-gradient(135deg, rgba(45,35,20,0.97) 0%, rgba(55,42,25,0.95) 30%, rgba(50,38,22,0.96) 70%, rgba(40,30,18,0.97) 100%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(139,109,63,0.03) 3px,
              rgba(139,109,63,0.03) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 5px,
              rgba(139,109,63,0.02) 5px,
              rgba(139,109,63,0.02) 6px
            )
          `,
          boxShadow: `
            inset 0 1px 0 rgba(255,220,150,0.08),
            inset 0 -1px 0 rgba(0,0,0,0.3)
          `,
        }}
      >
        {!book.reducedMotion && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 scanline-overlay" />
        )}

        <PoetryBookTabs
          activeTab={book.activeTab}
          collectedPowersCount={book.collectedPowersCount}
          onTabChange={book.handleTabChange}
        />

        <div className="flex-1 overflow-hidden">
          {book.activeTab === 'powers' && !book.selectedPoemId ? (
            <PowersTab />
          ) : (
            <AnimatePresence mode="wait" custom={book.pageDirection}>
              {book.selectedPoem ? (
                <motion.div
                  key={`poem-${book.selectedPoem.id}`}
                  custom={book.pageDirection}
                  variants={pageTurnVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={getPageTurnTransition(book.reducedMotion)}
                  className="h-full"
                  style={book.reducedMotion ? undefined : { perspective: '800px' }}
                  role="tabpanel"
                  id="poetry-book-panel-poems"
                  aria-labelledby="poetry-book-tab-poems"
                >
                  <PoemDetailView
                    selectedPoem={book.selectedPoem}
                    displayedLines={book.displayedLines}
                    done={book.done}
                    skipAll={book.skipAll}
                    marginNote={book.marginNote}
                    pageNumber={book.pageNumber}
                    totalPages={book.totalPages}
                    currentPoemIndex={book.currentPoemIndex}
                    reducedMotion={book.reducedMotion}
                    contentRef={book.contentRef}
                    handleBack={book.handleBack}
                    handlePrevPoem={book.handlePrevPoem}
                    handleNextPoem={book.handleNextPoem}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="poem-list"
                  custom={0}
                  variants={pageTurnVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={getPageTurnTransition(book.reducedMotion, 0.25)}
                  className="h-full"
                  role="tabpanel"
                  id="poetry-book-panel-poems"
                  aria-labelledby="poetry-book-tab-poems"
                >
                  <PoemListView
                    collectedMain={book.collectedMain}
                    collectedHidden={book.collectedHidden}
                    collectedCount={book.collectedCount}
                    totalPoems={book.totalPoems}
                    collectedPoems={book.collectedPoems}
                    contentRef={book.contentRef}
                    handleSelectPoem={book.handleSelectPoem}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </PanelWrapper>
  );
}

export function PoetryBook(props: PoetryBookProps) {
  return (
    <ErrorBoundary name="PoetryBook" fallback={null}>
      <PoetryBookInner {...props} />
    </ErrorBoundary>
  );
}
