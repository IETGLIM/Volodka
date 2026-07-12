import { Feather, Zap } from 'lucide-react';
import type { PoetryBookTab } from '@/engine/poetryBook/poetryBookConstants';
import { POETRY_BOOK_LABELS } from '@/engine/poetryBook/poetryBookConstants';

type PoetryBookTabsProps = {
  activeTab: PoetryBookTab;
  collectedPowersCount: number;
  onTabChange: (tab: PoetryBookTab) => void;
};

export function PoetryBookTabs({
  activeTab,
  collectedPowersCount,
  onTabChange,
}: PoetryBookTabsProps) {
  return (
    <div className="flex shrink-0 border-b border-amber-800/20" role="tablist" aria-label={POETRY_BOOK_LABELS.title}>
      <button
        type="button"
        role="tab"
        id="poetry-book-tab-poems"
        aria-selected={activeTab === 'poems'}
        aria-controls="poetry-book-panel-poems"
        onClick={() => onTabChange('poems')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-serif transition-all duration-200 ${
          activeTab === 'poems'
            ? 'text-amber-200 border-b-2 border-amber-500/60 bg-amber-950/10'
            : 'text-amber-600/50 hover:text-amber-400/70 border-b-2 border-transparent'
        }`}
      >
        <Feather className="size-3.5" aria-hidden="true" />
        {POETRY_BOOK_LABELS.tabPoems}
        <span className="sr-only">{POETRY_BOOK_LABELS.tabPoemsAria}</span>
      </button>
      <button
        type="button"
        role="tab"
        id="poetry-book-tab-powers"
        aria-selected={activeTab === 'powers'}
        aria-controls="poetry-book-panel-powers"
        onClick={() => onTabChange('powers')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-serif transition-all duration-200 ${
          activeTab === 'powers'
            ? 'text-amber-200 border-b-2 border-amber-500/60 bg-amber-950/10'
            : 'text-amber-600/50 hover:text-amber-400/70 border-b-2 border-transparent'
        }`}
      >
        <Zap className="size-3.5" aria-hidden="true" />
        {POETRY_BOOK_LABELS.tabPowers}
        {collectedPowersCount > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-800/30 text-amber-400/60" aria-hidden="true">
            {collectedPowersCount}
          </span>
        )}
        <span className="sr-only">{POETRY_BOOK_LABELS.tabPowersAria}</span>
      </button>
    </div>
  );
}
