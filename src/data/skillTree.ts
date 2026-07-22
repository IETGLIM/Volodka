/* ─── Volodka RPG – Skill Tree Data ─── */
/* Three branches × 5 tiers × (2 nodes per tier + 1 ultimate at tier 5) = 15 nodes per branch = 45 total */

import type { SkillTreeNode, SkillBranch } from '@/shared/types/game';

/* ══════════════════════════════════════════════════════════════
   TECHNICAL BRANCH (Техническая) — Color: #00ccff (Cyan)
   Skills: coding, logic
   ══════════════════════════════════════════════════════════════ */
const TECHNICAL_NODES: SkillTreeNode[] = [
  // Tier 1
  {
    id: 'tech_t1_coding',
    name: 'Базовый код',
    description: 'Основы программирования — первый шаг в мир машин',
    branch: 'technical',
    tier: 1,
    requires: [],
    effect: '+1 Взлом',
  },
  {
    id: 'tech_t1_logic',
    name: 'Логический анализ',
    description: 'Структурированное мышление и анализ данных',
    branch: 'technical',
    tier: 1,
    requires: [],
    effect: '+1 Интеллект',
  },
  // Tier 2
  {
    id: 'tech_t2_coding',
    name: 'Отладчик',
    description: 'Находить и устранять ошибки — вторая натура',
    branch: 'technical',
    tier: 2,
    requires: ['tech_t1_coding'],
    effect: '+2 Взлом',
  },
  {
    id: 'tech_t2_logic',
    name: 'Криптография',
    description: 'Искусство шифрования и дешифрования информации',
    branch: 'technical',
    tier: 2,
    requires: ['tech_t1_logic'],
    effect: '+2 Интеллект',
  },
  // Tier 3
  {
    id: 'tech_t3_coding',
    name: 'Сетевой архитектор',
    description: 'Проектирование и управление сетевыми структурами',
    branch: 'technical',
    tier: 3,
    requires: ['tech_t2_coding'],
    effect: '+3 Взлом',
  },
  {
    id: 'tech_t3_logic',
    name: 'Распределённые системы',
    description: 'Понимание сложных распределённых архитектур',
    branch: 'technical',
    tier: 3,
    requires: ['tech_t2_logic'],
    effect: '+3 Интеллект',
  },
  // Tier 4
  {
    id: 'tech_t4_coding',
    name: 'Мастер кода',
    description: 'Код подчиняется вашей воле без сопротивления',
    branch: 'technical',
    tier: 4,
    requires: ['tech_t3_coding'],
    effect: '+5 Взлом',
  },
  {
    id: 'tech_t4_logic',
    name: 'Абсолютная логика',
    description: 'Разум чист как кристалл — ни одной ошибки',
    branch: 'technical',
    tier: 4,
    requires: ['tech_t3_logic'],
    effect: '+5 Интеллект',
  },
  // Tier 5 — Ultimate
  {
    id: 'tech_t5_ultimate',
    name: 'Живой код',
    description: 'Стихи, встроенные в код, обретают двойную силу. Ваше искусство и техника сливаются воедино.',
    branch: 'technical',
    tier: 5,
    requires: ['tech_t4_coding', 'tech_t4_logic'],
    effect: 'Ультимативный: стихи в коде имеют двойной эффект',
  },
];

/* ══════════════════════════════════════════════════════════════
   SOCIAL BRANCH (Социальная) — Color: #ff00cc (Magenta)
   Skills: empathy, persuasion
   ══════════════════════════════════════════════════════════════ */
const SOCIAL_NODES: SkillTreeNode[] = [
  // Tier 1
  {
    id: 'social_t1_empathy',
    name: 'Активный слушатель',
    description: 'Умение слышать не только слова, но и чувства',
    branch: 'social',
    tier: 1,
    requires: [],
    effect: '+1 Эмпатия',
  },
  {
    id: 'social_t1_persuasion',
    name: 'Красноречие',
    description: 'Слово — ваш первый инструмент влияния',
    branch: 'social',
    tier: 1,
    requires: [],
    effect: '+1 Улица',
  },
  // Tier 2
  {
    id: 'social_t2_empathy',
    name: 'Эмпатический резонанс',
    description: 'Чувства других резонируют с вашими собственными',
    branch: 'social',
    tier: 2,
    requires: ['social_t1_empathy'],
    effect: '+2 Эмпатия',
  },
  {
    id: 'social_t2_persuasion',
    name: 'Манипуляция',
    description: 'Направлять разговор туда, куда вам нужно',
    branch: 'social',
    tier: 2,
    requires: ['social_t1_persuasion'],
    effect: '+2 Улица',
  },
  // Tier 3
  {
    id: 'social_t3_empathy',
    name: 'Душа компании',
    description: 'Люди тянутся к вам как к магниту',
    branch: 'social',
    tier: 3,
    requires: ['social_t2_empathy'],
    effect: '+3 Эмпатия',
  },
  {
    id: 'social_t3_persuasion',
    name: 'Великий оратор',
    description: 'Ваши речи меняют ход истории',
    branch: 'social',
    tier: 3,
    requires: ['social_t2_persuasion'],
    effect: '+3 Улица',
  },
  // Tier 4
  {
    id: 'social_t4_empathy',
    name: 'Чтец душ',
    description: 'Вы видите людей насквозь — их страхи и надежды',
    branch: 'social',
    tier: 4,
    requires: ['social_t3_empathy'],
    effect: '+5 Эмпатия',
  },
  {
    id: 'social_t4_persuasion',
    name: 'Мастер убеждения',
    description: 'Ни один разум не устоит перед вашей волей',
    branch: 'social',
    tier: 4,
    requires: ['social_t3_persuasion'],
    effect: '+5 Улица',
  },
  // Tier 5 — Ultimate
  {
    id: 'social_t5_ultimate',
    name: 'Поэт сердец',
    description: 'Ваши слова проникают в самые глубины души. Все отношения улучшаются на 50% быстрее.',
    branch: 'social',
    tier: 5,
    requires: ['social_t4_empathy', 'social_t4_persuasion'],
    effect: 'Ультимативный: отношения с NPC улучшаются на 50% быстрее',
  },
];

/* ══════════════════════════════════════════════════════════════
   SPIRITUAL BRANCH (Духовная) — Color: #ffaa00 (Amber)
   Skills: intuition, writing, rhythm
   ══════════════════════════════════════════════════════════════ */
const SPIRITUAL_NODES: SkillTreeNode[] = [
  // Tier 1
  {
    id: 'spirit_t1_intuition',
    name: 'Интуиция',
    description: 'Внутренний голос, ведущий сквозь тьму',
    branch: 'spiritual',
    tier: 1,
    requires: [],
    effect: '+1 Храбрость',
  },
  {
    id: 'spirit_t1_writing',
    name: 'Начальный стих',
    description: 'Первые строки — робкие, но искренние',
    branch: 'spiritual',
    tier: 1,
    requires: [],
    effect: '+1 Поэзия',
  },
  {
    id: 'spirit_t1_rhythm',
    name: 'Внутренний ритм',
    description: 'Пульс серверов совпадает с пульсом сердца. Вы чувствуете ритм кода.',
    branch: 'spiritual',
    tier: 1,
    requires: [],
    effect: '+1 Ритм',
  },
  // Tier 2
  {
    id: 'spirit_t2_intuition',
    name: 'Шестое чувство',
    description: 'Предчувствие опасности до того, как она возникнет',
    branch: 'spiritual',
    tier: 2,
    requires: ['spirit_t1_intuition'],
    effect: '+2 Храбрость',
  },
  {
    id: 'spirit_t2_writing',
    name: 'Рифмованные строки',
    description: 'Мастерство рифмы и ритма',
    branch: 'spiritual',
    tier: 2,
    requires: ['spirit_t1_writing'],
    effect: '+2 Поэзия',
  },
  {
    id: 'spirit_t2_rhythm',
    name: 'Кодовый метроном',
    description: 'Каждая строка кода имеет свой ритм. Вы научились слышать его.',
    branch: 'spiritual',
    tier: 2,
    requires: ['spirit_t1_rhythm'],
    effect: '+2 Ритм',
  },
  // Tier 3
  {
    id: 'spirit_t3_intuition',
    name: 'Провидец',
    description: 'Вы видите то, что скрыто от других',
    branch: 'spiritual',
    tier: 3,
    requires: ['spirit_t2_intuition'],
    effect: '+3 Храбрость',
  },
  {
    id: 'spirit_t3_writing',
    name: 'Мастер стиха',
    description: 'Ваши стихи трогают самые глубокие струны души',
    branch: 'spiritual',
    tier: 3,
    requires: ['spirit_t2_writing'],
    effect: '+3 Поэзия',
  },
  {
    id: 'spirit_t3_rhythm',
    name: 'Синхронизация пульса',
    description: 'Серверы и сердце — одна волна. Вы управляете ритмом реальности.',
    branch: 'spiritual',
    tier: 3,
    requires: ['spirit_t2_rhythm'],
    effect: '+3 Ритм',
  },
  // Tier 4
  {
    id: 'spirit_t4_intuition',
    name: 'Ясновидение',
    description: 'Реальность открывает вам свои тайны',
    branch: 'spiritual',
    tier: 4,
    requires: ['spirit_t3_intuition'],
    effect: '+5 Храбрость',
  },
  {
    id: 'spirit_t4_writing',
    name: 'Великий поэт',
    description: 'Ваши слова меняют мир вокруг вас',
    branch: 'spiritual',
    tier: 4,
    requires: ['spirit_t3_writing'],
    effect: '+5 Поэзия',
  },
  {
    id: 'spirit_t4_rhythm',
    name: 'Резонансный мастер',
    description: 'Ваш ритм резонирует с кодом, стихами и самой реальностью.',
    branch: 'spiritual',
    tier: 4,
    requires: ['spirit_t3_rhythm'],
    effect: '+5 Ритм',
  },
  // Tier 5 — Ultimate
  {
    id: 'spirit_t5_ultimate',
    name: 'Пророк кода',
    description: 'Стих и код сливаются в единое целое. Силы стихов длятся вдвое дольше.',
    branch: 'spiritual',
    tier: 5,
    requires: ['spirit_t4_intuition', 'spirit_t4_writing', 'spirit_t4_rhythm'],
    effect: 'Ультимативный: силы стихов длятся вдвое дольше, проверки ритма всегда +2',
  },
];

/* ── All nodes combined ── */
export const SKILL_TREE_NODES: SkillTreeNode[] = [
  ...TECHNICAL_NODES,
  ...SOCIAL_NODES,
  ...SPIRITUAL_NODES,
];

/* ── Lookup map by node ID ── */
export const SKILL_TREE_MAP: Record<string, SkillTreeNode> = Object.fromEntries(
  SKILL_TREE_NODES.map((n) => [n.id, n]),
);

/* ── Nodes grouped by branch ── */
export const SKILL_TREE_BY_BRANCH: Record<SkillBranch, SkillTreeNode[]> = {
  technical: TECHNICAL_NODES,
  social: SOCIAL_NODES,
  spiritual: SPIRITUAL_NODES,
};

/* ── Branch metadata ── */
export interface BranchMeta {
  id: SkillBranch;
  name: string;
  color: string;       // Primary color hex
  glowColor: string;   // Color for glow effects (with alpha)
  icon: string;        // Emoji icon
  skills: string[];    // Skill names this branch affects
}

export const BRANCH_META: Record<SkillBranch, BranchMeta> = {
  technical: {
    id: 'technical',
    name: 'Техническая',
    color: '#00ccff',
    glowColor: 'rgba(0,204,255,0.3)',
    icon: '⚙️',
    skills: ['Взлом', 'Интеллект'],
  },
  social: {
    id: 'social',
    name: 'Социальная',
    color: '#ff00cc',
    glowColor: 'rgba(255,0,204,0.3)',
    icon: '💬',
    skills: ['Эмпатия', 'Улица'],
  },
  spiritual: {
    id: 'spiritual',
    name: 'Духовная',
    color: '#ffaa00',
    glowColor: 'rgba(255,170,0,0.3)',
    icon: '✨',
    skills: ['Храбрость', 'Поэзия'],
  },
};

/* ── Skill effect mapping: node ID → skill key + value ── */
import type { TrainablePlayerSkill } from '@/shared/types/game';

export const SKILL_EFFECT_MAP: Record<string, { skill: TrainablePlayerSkill; value: number }> = {
  tech_t1_coding: { skill: 'coding', value: 1 },
  tech_t1_logic: { skill: 'logic', value: 1 },
  tech_t2_coding: { skill: 'coding', value: 2 },
  tech_t2_logic: { skill: 'logic', value: 2 },
  tech_t3_coding: { skill: 'coding', value: 3 },
  tech_t3_logic: { skill: 'logic', value: 3 },
  tech_t4_coding: { skill: 'coding', value: 5 },
  tech_t4_logic: { skill: 'logic', value: 5 },
  social_t1_empathy: { skill: 'empathy', value: 1 },
  social_t1_persuasion: { skill: 'persuasion', value: 1 },
  social_t2_empathy: { skill: 'empathy', value: 2 },
  social_t2_persuasion: { skill: 'persuasion', value: 2 },
  social_t3_empathy: { skill: 'empathy', value: 3 },
  social_t3_persuasion: { skill: 'persuasion', value: 3 },
  social_t4_empathy: { skill: 'empathy', value: 5 },
  social_t4_persuasion: { skill: 'persuasion', value: 5 },
  spirit_t1_intuition: { skill: 'intuition', value: 1 },
  spirit_t1_writing: { skill: 'writing', value: 1 },
  spirit_t2_intuition: { skill: 'intuition', value: 2 },
  spirit_t2_writing: { skill: 'writing', value: 2 },
  spirit_t3_intuition: { skill: 'intuition', value: 3 },
  spirit_t3_writing: { skill: 'writing', value: 3 },
  spirit_t4_intuition: { skill: 'intuition', value: 5 },
  spirit_t4_writing: { skill: 'writing', value: 5 },
  spirit_t1_rhythm: { skill: 'rhythm', value: 1 },
  spirit_t2_rhythm: { skill: 'rhythm', value: 2 },
  spirit_t3_rhythm: { skill: 'rhythm', value: 3 },
  spirit_t4_rhythm: { skill: 'rhythm', value: 5 },
};
