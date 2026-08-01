import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlayerState } from '@/store/selectors';
import {
  getJournalSkillBarWidth,
  JOURNAL_SKILL_LABELS,
} from '@/components/game/journal/journalConstants';
import type { TrainablePlayerSkill } from '@/shared/types/game';

interface SkillsTabProps {
  searchQuery: string;
}

export function SkillsTab({ searchQuery }: SkillsTabProps) {
  const playerState = usePlayerState();
  const { skills, progression } = playerState;

  const filteredSkills = useMemo(() => {
    const entries = Object.entries(skills) as [TrainablePlayerSkill, number][];
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      ([skill]) =>
        JOURNAL_SKILL_LABELS[skill].name.toLowerCase().includes(query)
        || JOURNAL_SKILL_LABELS[skill].description.toLowerCase().includes(query),
    );
  }, [skills, searchQuery]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/40 border border-cyan-900/25 shadow-[inset_0_1px_0_rgb(var(--cyber-cyan-rgb) / 0.05)]">
          <div>
            <p className="text-sm text-slate-200 font-medium">Уровень {progression.level}</p>
            <p className="text-xs text-slate-500">
              {progression.xp} / {progression.xpToNextLevel} XP
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-cyan-400/80">
              {progression.skillPoints} очков навыков
            </p>
          </div>
        </div>

        <div className="px-4">
          <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] data-bar">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.3)] data-bar-fill"
              style={{ width: `${(progression.xp / progression.xpToNextLevel) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-3" role="list" aria-label="Навыки игрока">
          {filteredSkills.map(([skill, value]) => {
            const info = JOURNAL_SKILL_LABELS[skill];
            return (
              <div
                key={skill}
                role="listitem"
                className="px-4 py-3.5 rounded-xl bg-slate-900/30 border border-cyan-900/15 hover:border-cyan-800/30 transition-colors shadow-[inset_0_1px_0_rgb(var(--cyber-cyan-rgb) / 0.03)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`size-2.5 rounded-full bg-gradient-to-r ${info.color} shadow-[0_0_6px_currentColor]`} aria-hidden />
                    <span className="text-sm text-slate-200 font-medium">{info.name}</span>
                  </div>
                  <span className="text-sm font-mono text-cyan-300 data-bar-label">{value}</span>
                </div>
                <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden mb-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] data-bar">
                  <div
                    className={`h-full bg-gradient-to-r ${info.color} rounded-full transition-all duration-500 shadow-[0_0_6px_rgb(var(--cyber-cyan-rgb) / 0.2)] data-bar-fill`}
                    style={{ width: getJournalSkillBarWidth(value) }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 break-words">{info.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
