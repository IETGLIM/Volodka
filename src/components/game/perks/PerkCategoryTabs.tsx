import { PERK_CATEGORY_META, type PerkCategory } from '@/data/perks';
import {
  PERK_CATEGORIES,
  PERK_CATEGORY_TAB_LABELS,
  PERKS_PANEL_LABELS,
} from '@/engine/perks/perksPanelConstants';
import type { CategoryCounts } from '@/engine/perks/perksPanelPresentation';
import { PERK_CATEGORY_TAB_ICONS } from '@/components/game/perks/perkIcons';

type PerkCategoryTabsProps = {
  activeCategory: PerkCategory | 'all';
  categoryCounts: CategoryCounts;
  onSelect: (category: PerkCategory | 'all') => void;
};

export function PerkCategoryTabs({ activeCategory, categoryCounts, onSelect }: PerkCategoryTabsProps) {
  return (
    <div
      className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/40 overflow-x-auto"
      role="tablist"
      aria-label={PERKS_PANEL_LABELS.listAria}
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeCategory === 'all'}
        onClick={() => onSelect('all')}
        className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/70 ${
          activeCategory === 'all'
            ? 'bg-slate-800/60 text-slate-100'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
        }`}
      >
        {PERKS_PANEL_LABELS.tabAll}
      </button>
      {PERK_CATEGORIES.map((category) => {
        const meta = PERK_CATEGORY_META[category];
        const isActive = activeCategory === category;
        const count = categoryCounts[category];
        const TabIcon = PERK_CATEGORY_TAB_ICONS[category];
        const label = PERK_CATEGORY_TAB_LABELS[category];

        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={PERKS_PANEL_LABELS.tabCategoryAria(label, count.acquired, count.total)}
            onClick={() => onSelect(category)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/70 ${
              isActive ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
            style={
              isActive
                ? {
                    background: `${meta.color}15`,
                    boxShadow: `0 0 10px ${meta.color}20, inset 0 0 6px ${meta.color}08`,
                  }
                : undefined
            }
          >
            <TabIcon className="size-3.5 shrink-0" style={{ color: isActive ? meta.color : undefined }} aria-hidden="true" />
            <span style={{ color: isActive ? meta.color : undefined }}>{label}</span>
            <span className="text-[8px] opacity-50" aria-hidden="true">
              {count.acquired}/{count.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
