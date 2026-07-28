import type { BuffEffect } from '@/shared/types/game';

export function getBuffEffectDescription(effect: BuffEffect): string {
  switch (effect.type) {
    case 'defense_reduction': return `Защита -${Math.round(effect.value * 100)}%`;
    case 'damage_multiplier': return `Урон ×${effect.value}`;
    case 'damage_reduction': return `Получаемый урон -${Math.round(effect.value * 100)}%`;
    case 'skip_turn': return 'Пропускает ход';
    case 'stat_drain': return `${effect.stat} -${effect.value}`;
    case 'defense_boost': return `Защита +${effect.value}`;
    case 'attack_boost': return `Атака +${effect.value}`;
    case 'hp_drain_percent': return `HP -${Math.round(effect.value * 100)}%/ход`;
    case 'silence_specials': return 'Спецатаки заблокированы';
    case 'defensive_verse': return 'Защитный стих: -30% урона';
    case 'stun_immune': return 'Иммунитет к оглушению';
    default: return '';
  }
}
