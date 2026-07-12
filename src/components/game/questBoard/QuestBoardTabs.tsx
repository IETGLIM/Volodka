import { Clock, Star } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { QuestBoardTab } from '@/components/game/questBoard/useQuestBoardController';
import {
  QUEST_BOARD_LABELS,
  QUEST_BOARD_TAB_IDS,
} from '@/engine/questBoard/questBoardConstants';

type QuestBoardTabsProps = {
  activeTab: QuestBoardTab;
  dailyCount: number;
  weeklyCount: number;
  onTabChange: (tab: QuestBoardTab) => void;
  onTabListKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

export function QuestBoardTabs({
  activeTab,
  dailyCount,
  weeklyCount,
  onTabChange,
  onTabListKeyDown,
}: QuestBoardTabsProps) {
  return (
    <div
      className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/40"
      role="tablist"
      aria-label={QUEST_BOARD_LABELS.tabListRegion}
      onKeyDown={onTabListKeyDown}
    >
      <button
        type="button"
        role="tab"
        id={QUEST_BOARD_TAB_IDS.daily}
        aria-selected={activeTab === 'daily'}
        aria-controls={QUEST_BOARD_TAB_IDS.panel}
        tabIndex={activeTab === 'daily' ? 0 : -1}
        onClick={() => onTabChange('daily')}
        className={`quest-board-tab flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40 ${
          activeTab === 'daily' ? 'quest-board-tab--active quest-board-tab--active-text' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Clock className="size-3.5" aria-hidden="true" />
        {QUEST_BOARD_LABELS.tabDaily}
        <span className="text-[8px] opacity-50" aria-hidden="true">
          {dailyCount}
        </span>
        <span className="sr-only">{QUEST_BOARD_LABELS.tabDailyCount(dailyCount)}</span>
      </button>
      <button
        type="button"
        role="tab"
        id={QUEST_BOARD_TAB_IDS.weekly}
        aria-selected={activeTab === 'weekly'}
        aria-controls={QUEST_BOARD_TAB_IDS.panel}
        tabIndex={activeTab === 'weekly' ? 0 : -1}
        onClick={() => onTabChange('weekly')}
        className={`quest-board-tab flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40 ${
          activeTab === 'weekly' ? 'quest-board-tab--active quest-board-tab--active-text' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Star className="size-3.5" aria-hidden="true" />
        {QUEST_BOARD_LABELS.tabWeekly}
        <span className="text-[8px] opacity-50" aria-hidden="true">
          {weeklyCount}
        </span>
        <span className="sr-only">{QUEST_BOARD_LABELS.tabWeeklyCount(weeklyCount)}</span>
      </button>
    </div>
  );
}
