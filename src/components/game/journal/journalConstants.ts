import type { JournalTab } from '@/store/gameStore';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import {
  BookOpen,
  Feather,
  FileText,
  Swords,
  BrainCircuit,
  Brain,
  Shirt,
} from 'lucide-react';

export const JOURNAL_TABS: { id: JournalTab; label: string; icon: typeof FileText }[] = [
  { id: 'notes', label: 'Записи', icon: FileText },
  { id: 'skills', label: 'Навыки', icon: Swords },
  { id: 'poems', label: 'Стихи', icon: Feather },
  { id: 'lore', label: 'Лор', icon: BookOpen },
  { id: 'thoughts', label: 'Мысли', icon: BrainCircuit },
  { id: 'cabinet', label: 'Кабинет Мыслей', icon: Brain },
  { id: 'clothing', label: 'Одежда', icon: Shirt },
];

/** Skill bar fill uses this as 100% reference in the skills tab. */
export const JOURNAL_SKILL_BAR_MAX = 50;

export const JOURNAL_LIST_ROW_HEIGHT = 56;
export const JOURNAL_VIRTUALIZE_THRESHOLD = 40;

export const JOURNAL_SKILL_LABELS: Record<TrainablePlayerSkill, { name: string; color: string; description: string }> = {
  logic: { name: 'Логика', color: 'from-cyan-600 to-cyan-400', description: 'Аналитическое мышление, решение головоломок' },
  coding: { name: 'Кодинг', color: 'from-emerald-600 to-emerald-400', description: 'Программирование, работа с терминалами' },
  empathy: { name: 'Эмпатия', color: 'from-rose-600 to-rose-400', description: 'Понимание чужих чувств, поддержка' },
  persuasion: { name: 'Убеждение', color: 'from-amber-600 to-amber-400', description: 'Дипломатия, переговоры, влияние' },
  intuition: { name: 'Интуиция', color: 'from-purple-600 to-purple-400', description: 'Чутьё на скрытое, предчувствие' },
  writing: { name: 'Письмо', color: 'from-pink-600 to-pink-400', description: 'Сила поэтического слова, творчество' },
  rhythm: { name: 'Ритм', color: 'from-orange-600 to-orange-400', description: 'Музыкальность, чувство ритма, координация' },
};

export const JOURNAL_THEME_COLORS: Record<string, string> = {
  смерть: 'bg-slate-800/60 text-slate-300 border-slate-600/40',
  любовь: 'bg-rose-950/50 text-rose-300 border-rose-700/30',
  отчаяние: 'bg-violet-950/50 text-violet-300 border-violet-700/30',
  надежда: 'bg-amber-950/50 text-amber-300 border-amber-700/30',
  коррупция: 'bg-red-950/50 text-red-300 border-red-700/30',
  память: 'bg-cyan-950/50 text-cyan-300 border-cyan-700/30',
  культура: 'bg-indigo-950/50 text-indigo-300 border-indigo-700/30',
  путь: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/30',
  душа: 'bg-purple-950/50 text-purple-300 border-purple-700/30',
  судьба: 'bg-teal-950/50 text-teal-300 border-teal-700/30',
  одиночество: 'bg-gray-950/50 text-gray-300 border-gray-700/30',
  рождество: 'bg-green-950/50 text-green-300 border-green-700/30',
  дружба: 'bg-amber-950/50 text-amber-300 border-amber-700/30',
  море: 'bg-sky-950/50 text-sky-300 border-sky-700/30',
  поэзия: 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-700/30',
  ирония: 'bg-orange-950/50 text-orange-300 border-orange-700/30',
  детство: 'bg-lime-950/50 text-lime-300 border-lime-700/30',
  творчество: 'bg-pink-950/50 text-pink-300 border-pink-700/30',
  космос: 'bg-blue-950/50 text-blue-300 border-blue-700/30',
  город: 'bg-zinc-950/50 text-zinc-300 border-zinc-700/30',
  вечность: 'bg-stone-950/50 text-stone-300 border-stone-700/30',
  звёзды: 'bg-yellow-950/50 text-yellow-300 border-yellow-700/30',
  мечта: 'bg-sky-950/50 text-sky-300 border-sky-700/30',
  прощание: 'bg-rose-950/50 text-rose-300 border-rose-700/30',
  добро: 'bg-amber-950/50 text-amber-300 border-amber-700/30',
  клевета: 'bg-red-950/50 text-red-300 border-red-700/30',
  прощение: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/30',
  семья: 'bg-orange-950/50 text-orange-300 border-orange-700/30',
  шут: 'bg-orange-950/50 text-orange-300 border-orange-700/30',
  лицемерие: 'bg-red-950/50 text-red-300 border-red-700/30',
  разрушение: 'bg-red-950/50 text-red-300 border-red-700/30',
  альтруизм: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/30',
};

export function getJournalSkillBarWidth(value: number): string {
  return `${Math.min((value / JOURNAL_SKILL_BAR_MAX) * 100, 100)}%`;
}
