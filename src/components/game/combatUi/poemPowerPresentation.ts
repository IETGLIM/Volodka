import { HeartPulse, ShieldPlus, Skull, Sparkles, Swords, type LucideIcon } from 'lucide-react';

export type PoemEffectCategory = 'damage' | 'heal' | 'buff' | 'debuff' | 'mixed';

export function getPoemEffectCategory(poemId: string): PoemEffectCategory {
  switch (poemId) {
    case 'poem_1': return 'debuff';
    case 'poem_2': return 'heal';
    case 'poem_3': return 'debuff';
    case 'poem_4': return 'heal';
    case 'poem_5': return 'damage';
    case 'poem_6': return 'buff';
    case 'poem_7': return 'debuff';
    case 'poem_8': return 'damage';
    case 'poem_9': return 'damage';
    case 'poem_10': return 'buff';
    case 'poem_11': return 'damage';
    case 'poem_12': return 'damage';
    case 'poem_13': return 'mixed';
    case 'poem_14': return 'heal';
    case 'poem_15': return 'mixed';
    case 'poem_16': return 'mixed';
    case 'poem_17': return 'mixed';
    case 'poem_18': return 'damage';
    case 'poem_19': return 'buff';
    case 'poem_20': return 'mixed';
    case 'poem_21': return 'damage';
    case 'poem_22': return 'mixed';
    case 'poem_23': return 'damage';
    default: return 'mixed';
  }
}

export function getPoemEffectLabel(category: PoemEffectCategory): string {
  switch (category) {
    case 'damage': return 'Урон';
    case 'heal': return 'Лечение';
    case 'buff': return 'Усиление';
    case 'debuff': return 'Ослабление';
    case 'mixed': return 'Комбо';
  }
}

export function getPoemEffectIcon(category: PoemEffectCategory): LucideIcon {
  switch (category) {
    case 'damage': return Swords;
    case 'heal': return HeartPulse;
    case 'buff': return ShieldPlus;
    case 'debuff': return Skull;
    case 'mixed': return Sparkles;
  }
}

export function getPoemCategoryColor(category: PoemEffectCategory): string {
  switch (category) {
    case 'damage': return 'text-red-400 bg-red-950/50 border-red-800/40';
    case 'heal': return 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40';
    case 'buff': return 'text-cyan-400 bg-cyan-950/50 border-cyan-800/40';
    case 'debuff': return 'text-amber-400 bg-amber-950/50 border-amber-800/40';
    case 'mixed': return 'text-fuchsia-400 bg-fuchsia-950/50 border-fuchsia-800/40';
  }
}
