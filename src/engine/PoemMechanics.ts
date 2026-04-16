// ============================================
// POEM MECHANICS — Стихи как игровые механики
// ============================================
// Стихи НЕ просто коллекционные предметы — это МЕХАНИКИ.
// При сборе стиха:
//   1. Грантит "поэтическое озарение" — бафф к статам
//   2. Разблокирует новые диалоговые опции с NPC
//   3. Раскрывает скрытые ветки истории
//   4. Меняет визуальную атмосферу

import { eventBus } from './EventBus';
import { POEMS, getPoemById, type Poem } from '@/data/poems';
import type { PlayerSkills } from '@/data/types';

// ============================================
// ТИПЫ
// ============================================

export interface PoemInsight {
  poemId: string;
  title: string;
  /** Stat bonuses from this poem */
  statBonuses: Record<string, number>;
  /** Skill bonuses from this poem */
  skillBonuses: Partial<Record<keyof PlayerSkills, number>>;
  /** Themes this poem covers */
  themes: string[];
  /** Description of the insight */
  description: string;
}

export interface PoemDialogueUnlock {
  poemId: string;
  /** NPC ID that gets new dialogue options */
  npcId: string;
  /** Flag that gets set, enabling new dialogue branches */
  flag: string;
  /** Description of what unlocks */
  description: string;
}

export interface PoemAtmosphereEffect {
  poemId: string;
  /** CSS class or gradient modification */
  tint: string;
  /** Intensity 0-1 */
  intensity: number;
  /** Description */
  description: string;
}

// ============================================
// ТЕМАТИЧЕСКИЕ БОНУСЫ
// ============================================

const THEME_STAT_BONUSES: Record<string, { stats: Record<string, number>; skills: Partial<Record<keyof PlayerSkills, number>> }> = {
  'одиночество': { stats: { mood: -3 }, skills: { empathy: 5, introspection: 3 } },
  'любовь': { stats: { mood: 5 }, skills: { empathy: 3 } },
  'смерть': { stats: { stability: -3 }, skills: { introspection: 5 } },
  'надежда': { stats: { selfEsteem: 5, mood: 5 }, skills: {} },
  'город': { stats: { mood: -2 }, skills: { perception: 3 } },
  'космос': { stats: { creativity: 3 }, skills: { imagination: 5 } },
  'память': { stats: { stability: 2 }, skills: { introspection: 3 } },
  'путь': { stats: { stability: 3 }, skills: { intuition: 3 } },
  'душа': { stats: { creativity: 3 }, skills: { imagination: 3, empathy: 2 } },
  'судьба': { stats: { stability: 2 }, skills: { intuition: 5 } },
  'коррупция': { stats: { karma: 3 }, skills: { perception: 3 } },
  'детство': { stats: { mood: 3 }, skills: { imagination: 3 } },
  'творчество': { stats: { creativity: 5 }, skills: { writing: 3 } },
  'ирония': { stats: { mood: 2 }, skills: { perception: 2 } },
  'отчаяние': { stats: { stability: -5, mood: -5 }, skills: { introspection: 5 } },
  'шут': { stats: { selfEsteem: -3 }, skills: { resilience: 5 } },
  'вечность': { stats: { stability: 5 }, skills: { introspection: 3 } },
  'звёзды': { stats: { creativity: 5 }, skills: { imagination: 5 } },
  'поэзия': { stats: { creativity: 5, mood: 3 }, skills: { writing: 5 } },
  'письмо': { stats: { creativity: 5 }, skills: { writing: 3 } },
  'семья': { stats: { mood: -5, stability: -3 }, skills: { empathy: 5 } },
  'альтруизм': { stats: { karma: 5 }, skills: { empathy: 3 } },
  'клевета': { stats: { stability: -3 }, skills: { resilience: 3 } },
  'прощание': { stats: { stability: -5, mood: -5 }, skills: { introspection: 5 } },
  'фантазия': { stats: { creativity: 5 }, skills: { imagination: 5 } },
  'лицемерие': { stats: { karma: -3 }, skills: { perception: 5 } },
  'гордость': { stats: { selfEsteem: 5 }, skills: { resilience: 3 } },
  'наблюдатель': { stats: { stability: 3 }, skills: { perception: 5 } },
  'преображение': { stats: { creativity: 5, stability: 5 }, skills: { imagination: 3 } },
  'мечта': { stats: { creativity: 5, mood: 5 }, skills: { imagination: 3 } },
  'взросление': { stats: { stability: 3 }, skills: { introspection: 3 } },
  'отпуск': { stats: { mood: 3 }, skills: { perception: 2 } },
  'разочарование': { stats: { mood: -5, stability: -3 }, skills: { introspection: 3 } },
  'прощение': { stats: { stability: 5, karma: 5 }, skills: { empathy: 3 } },
  'покой': { stats: { stability: 5, mood: 3 }, skills: { introspection: 3 } },
  'дружба': { stats: { mood: 3 }, skills: { empathy: 3 } },
  'дверь': { stats: { creativity: 3 }, skills: { intuition: 3 } },
  'море': { stats: { mood: 3 }, skills: { imagination: 3 } },
  'серебряный век': { stats: { creativity: 5 }, skills: { writing: 3, perception: 2 } },
  'странствия': { stats: { stability: 3 }, skills: { resilience: 3 } },
  'разрушение': { stats: { stability: -5 }, skills: { perception: 5 } },
  'культура': { stats: { karma: 5 }, skills: { perception: 3 } },
  'борьба': { stats: { stability: 3 }, skills: { resilience: 5 } },
  'вселенная': { stats: { creativity: 5 }, skills: { imagination: 5 } },
  'дерзость': { stats: { selfEsteem: 3 }, skills: { resilience: 3 } },
  'самопожертвование': { stats: { karma: 5, stability: -3 }, skills: { empathy: 5 } },
  'рождество': { stats: { mood: 3 }, skills: { empathy: 3 } },
  'добро': { stats: { karma: 5, selfEsteem: 3 }, skills: { empathy: 3 } },
};

// ============================================
// РАЗБЛОКИРОВКИ ДИАЛОГОВ
// ============================================

const POEM_DIALOGUE_UNLOCKS: PoemDialogueUnlock[] = [
  {
    poemId: 'poem_2',
    npcId: 'maria',
    flag: 'poem_insight_existential',
    description: 'Можно обсуждать экзистенциальные темы с Марией',
  },
  {
    poemId: 'poem_5',
    npcId: 'maria',
    flag: 'poem_insight_moving_forward',
    description: 'Можно говорить о движении вперёд',
  },
  {
    poemId: 'poem_7',
    npcId: 'dream_lillian',
    flag: 'poem_insight_dreamers',
    description: 'Новые темы для разговора с Лилиан о крылатых детях',
  },
  {
    poemId: 'poem_8',
    npcId: 'dream_quester',
    flag: 'poem_insight_path',
    description: 'Можно говорить о пути со Странником',
  },
  {
    poemId: 'poem_10',
    npcId: 'park_elder',
    flag: 'poem_insight_eternity',
    description: 'Новый диалог со Стариком о вечности',
  },
  {
    poemId: 'poem_11',
    npcId: 'maria',
    flag: 'poem_insight_city_door',
    description: 'Можно говорить с Марией о городе и одиночестве',
  },
  {
    poemId: 'poem_12',
    npcId: 'dream_galaxy',
    flag: 'poem_insight_stars',
    description: 'Новые темы со звёздами и мечтами',
  },
];

// ============================================
// АТМОСФЕРНЫЕ ЭФФЕКТЫ
// ============================================

const POEM_ATMOSPHERE: PoemAtmosphereEffect[] = [
  { poemId: 'poem_2', tint: 'rgba(139, 0, 0, 0.05)', intensity: 0.2, description: 'Тень отчаяния' },
  { poemId: 'poem_3', tint: 'rgba(139, 90, 43, 0.05)', intensity: 0.15, description: 'Дорожная пыль' },
  { poemId: 'poem_4', tint: 'rgba(100, 149, 237, 0.05)', intensity: 0.2, description: 'Зимняя тоска' },
  { poemId: 'poem_5', tint: 'rgba(0, 100, 200, 0.05)', intensity: 0.2, description: 'Морской бриз' },
  { poemId: 'poem_7', tint: 'rgba(138, 43, 226, 0.08)', intensity: 0.3, description: 'Крылатая грусть' },
  { poemId: 'poem_8', tint: 'rgba(255, 215, 0, 0.05)', intensity: 0.2, description: 'Звёздный путь' },
  { poemId: 'poem_10', tint: 'rgba(101, 67, 33, 0.05)', intensity: 0.15, description: 'Каменная вечность' },
  { poemId: 'poem_11', tint: 'rgba(34, 139, 34, 0.05)', intensity: 0.2, description: 'Зелёная дверь' },
  { poemId: 'poem_12', tint: 'rgba(30, 144, 255, 0.05)', intensity: 0.2, description: 'Космическая мечта' },
];

// ============================================
// POEM MECHANICS CLASS
// ============================================

class PoemMechanicsClass {
  private collectedPoems: Set<string> = new Set();

  /** Collect a poem and get the insight */
  collectPoem(poemId: string): PoemInsight | null {
    const poem = getPoemById(poemId);
    if (!poem) return null;

    this.collectedPoems.add(poemId);
    const insight = this.getPoemInsight(poemId);

    // Emit event
    eventBus.emit('poem:collected', { poemId });

    return insight;
  }

  /** Get the insight for a poem (without collecting it) */
  getPoemInsight(poemId: string): PoemInsight {
    const poem = getPoemById(poemId);
    if (!poem) {
      return {
        poemId,
        title: 'Неизвестно',
        statBonuses: {},
        skillBonuses: {},
        themes: [],
        description: '',
      };
    }

    // Aggregate bonuses from all themes
    const statBonuses: Record<string, number> = {};
    const skillBonuses: Partial<Record<keyof PlayerSkills, number>> = {};

    for (const theme of poem.themes) {
      const bonus = THEME_STAT_BONUSES[theme];
      if (bonus) {
        for (const [stat, value] of Object.entries(bonus.stats)) {
          statBonuses[stat] = (statBonuses[stat] || 0) + value;
        }
        for (const [skill, value] of Object.entries(bonus.skills)) {
          if (value) {
            skillBonuses[skill as keyof PlayerSkills] = 
              (skillBonuses[skill as keyof PlayerSkills] || 0) + value;
          }
        }
      }
    }

    return {
      poemId,
      title: poem.title,
      statBonuses,
      skillBonuses,
      themes: poem.themes,
      description: this.generateInsightDescription(poem),
    };
  }

  /** Get dialogue unlocks for a poem */
  getUnlockedChoices(poemId: string): PoemDialogueUnlock[] {
    return POEM_DIALOGUE_UNLOCKS.filter(u => u.poemId === poemId);
  }

  /** Get all dialogue unlocks for collected poems */
  getAllUnlockedChoices(): PoemDialogueUnlock[] {
    return POEM_DIALOGUE_UNLOCKS.filter(u => this.collectedPoems.has(u.poemId));
  }

  /** Get atmosphere effect for a poem */
  getAtmosphereEffect(poemId: string): PoemAtmosphereEffect | undefined {
    return POEM_ATMOSPHERE.find(a => a.poemId === poemId);
  }

  /** Get combined atmosphere effects for all collected poems */
  getCombinedAtmosphereEffects(): PoemAtmosphereEffect[] {
    return POEM_ATMOSPHERE.filter(a => this.collectedPoems.has(a.poemId));
  }

  /** Set collected poems (for loading save) */
  setCollectedPoems(poemIds: string[]): void {
    this.collectedPoems = new Set(poemIds);
  }

  /** Generate a human-readable insight description */
  private generateInsightDescription(poem: Poem): string {
    const themes = poem.themes.slice(0, 3).join(', ');
    return `Озарение: стихи о "${themes}" открыли новые грани восприятия`;
  }
}

// Singleton instance
export const poemMechanics = new PoemMechanicsClass();
