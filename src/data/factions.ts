// ============================================
// СИСТЕМА ФРАКЦИЙ — «Володька» 3D RPG
// ============================================

// ============================================
// ТИПЫ
// ============================================

export type FactionId = 
  | 'poets'        // Поэты и творческие люди
  | 'it_workers'   // IT-специалисты, техподдержка
  | 'dreamers'     // Мир снов (Лилиан, Астра, Странник)
  | 'locals'       // Местные жители района
  | 'shadow_network'; // Тёмная сеть, андеграунд

export type StandingLevel = 
  | 'hostile'      // Враждебный (-100 до -50)
  | 'unfriendly'   // Недружелюбный (-49 до -10)
  | 'neutral'      // Нейтральный (-9 до 9)
  | 'friendly'     // Дружелюбный (10 до 49)
  | 'trusted'      // Доверенный (50 до 79)
  | 'ally';        // Союзник (80 до 100)

export interface Faction {
  id: FactionId;
  name: string;
  icon: string;
  color: string;          // Tailwind gradient colors
  description: string;
  headquarters?: string;  // SceneId основной локации
  leader?: string;        // NPC ID лидера
  alliedFactions: FactionId[];
  enemyFactions: FactionId[];
  
  // Что даёт высокая репутация
  benefits: {
    trusted: string[];    // Разблокировки при trusted
    ally: string[];       // Разблокировки при ally
  };
  
  // Квесты фракции
  quests: string[];
}

export interface FactionReputation {
  factionId: FactionId;
  value: number;          // -100 до 100
  standing: StandingLevel;
  questsCompleted: string[];
  interactions: number;   // Количество взаимодействий
  lastInteraction: number; // Timestamp
}

// ============================================
// ОПРЕДЕЛЕНИЯ ФРАКЦИЙ
// ============================================

export const FACTIONS: Record<FactionId, Faction> = {
  poets: {
    id: 'poets',
    name: 'Поэты',
    icon: '📜',
    color: 'from-purple-500 to-pink-500',
    description: 'Творческие души у бара «Синяя яма» через дорогу от панельки: стихи, кавер, свои столы.',
    headquarters: 'cafe_evening',
    leader: 'albert',
    alliedFactions: ['dreamers', 'locals'],
    enemyFactions: ['shadow_network'],
    benefits: {
      trusted: ['poetry_workshop_access', 'exclusive_readings'],
      ally: ['publishing_connection', 'mentor_poet'],
    },
    quests: ['first_words', 'first_reading', 'poetry_collection', 'night_owl'],
  },
  
  it_workers: {
    id: 'it_workers',
    name: 'IT-отдел',
    icon: '💻',
    color: 'from-cyan-500 to-blue-500',
    description: 'Коллеги по техподдержке. Понимают боль ночного деплоя и горят от мониторинга.',
    headquarters: 'office_morning',
    leader: 'kirill',
    alliedFactions: ['locals'],
    enemyFactions: ['shadow_network'],
    benefits: {
      trusted: ['server_access', 'after_hours_office'],
      ally: ['admin_privileges', 'remote_work_approval'],
    },
    quests: ['openstack_server_find', 'rabbitmq_overflow', 'kubernetes_orchestrator', 'auth_crisis', 'database_pool_exhausted', 'ssl_certificate_renewal', 'microservice_memory_leak'],
  },
  
  dreamers: {
    id: 'dreamers',
    name: 'Странники снов',
    icon: '🌙',
    color: 'from-indigo-500 to-violet-500',
    description: 'Обитатели мира снов. Хранители потерянных воспоминаний и звёздных связей.',
    headquarters: 'dream',
    leader: 'lillian',
    alliedFactions: ['poets'],
    enemyFactions: [],
    benefits: {
      trusted: ['lucid_dreaming', 'memory_recovery'],
      ally: ['dream_navigation', 'cosmic_awareness'],
    },
    quests: ['lost_memories', 'star_connection'],
  },
  
  locals: {
    id: 'locals',
    name: 'Местные',
    icon: '🏘️',
    color: 'from-amber-500 to-orange-500',
    description: 'Жители района. Знают все слухи и истории. Сергеич — их негласный лидер.',
    headquarters: 'street_night',
    leader: 'sergeich',
    alliedFactions: ['poets', 'it_workers'],
    enemyFactions: ['shadow_network'],
    benefits: {
      trusted: ['local_secrets', 'neighbor_help'],
      ally: ['safe_house_access', 'street_wisdom'],
    },
    quests: ['coffee_affair'],
  },
  
  shadow_network: {
    id: 'shadow_network',
    name: 'Тень',
    icon: '👁️',
    color: 'from-slate-600 to-slate-800',
    description: 'Андеграунд. Те, кто работает в тени. Доступ к запрещённой информации.',
    headquarters: undefined,
    leader: undefined,
    alliedFactions: [],
    enemyFactions: ['poets', 'it_workers', 'locals'],
    benefits: {
      trusted: ['hidden_market', 'black_info'],
      ally: ['shadow_influence', 'secret_paths'],
    },
    quests: [],
  },
};

// ============================================
// ФУНКЦИИ
// ============================================

export function getStandingLevel(value: number): StandingLevel {
  if (value >= 80) return 'ally';
  if (value >= 50) return 'trusted';
  if (value >= 10) return 'friendly';
  if (value >= -9) return 'neutral';
  if (value >= -49) return 'unfriendly';
  return 'hostile';
}

export function getStandingColor(standing: StandingLevel): string {
  switch (standing) {
    case 'ally': return 'text-amber-400';
    case 'trusted': return 'text-emerald-400';
    case 'friendly': return 'text-cyan-400';
    case 'neutral': return 'text-slate-400';
    case 'unfriendly': return 'text-orange-400';
    case 'hostile': return 'text-red-400';
  }
}

export function getStandingIcon(standing: StandingLevel): string {
  switch (standing) {
    case 'ally': return '⭐';
    case 'trusted': return '🤝';
    case 'friendly': return '😊';
    case 'neutral': return '😐';
    case 'unfriendly': return '😤';
    case 'hostile': return '💀';
  }
}

export function getStandingName(standing: StandingLevel): string {
  switch (standing) {
    case 'ally': return 'Союзник';
    case 'trusted': return 'Доверенный';
    case 'friendly': return 'Дружелюбный';
    case 'neutral': return 'Нейтральный';
    case 'unfriendly': return 'Недружелюбный';
    case 'hostile': return 'Враждебный';
  }
}

export function createInitialReputation(factionId: FactionId): FactionReputation {
  return {
    factionId,
    value: 0,
    standing: 'neutral',
    questsCompleted: [],
    interactions: 0,
    lastInteraction: 0,
  };
}

export function updateReputationValue(
  current: number, 
  change: number,
  faction: Faction,
  alliedFactionReps: Record<FactionId, number>
): number {
  let adjustedChange = change;
  
  // Альянсы влияют на изменение репутации
  for (const allyId of faction.alliedFactions) {
    const allyRep = alliedFactionReps[allyId] || 0;
    if (allyRep > 50) adjustedChange *= 1.2;
    else if (allyRep > 20) adjustedChange *= 1.1;
  }
  
  // Враги влияют на изменение репутации
  for (const enemyId of faction.enemyFactions) {
    const enemyRep = alliedFactionReps[enemyId] || 0;
    if (enemyRep > 50) adjustedChange *= 0.8;
    else if (enemyRep > 20) adjustedChange *= 0.9;
  }
  
  return Math.max(-100, Math.min(100, current + Math.round(adjustedChange)));
}

// Получить фракцию по NPC ID
export function getFactionByNPC(npcId: string): FactionId | null {
  // Поэты и творческие
  const poetNPCs = ['poet', 'alisa', 'maria', 'cafe_college_girl'];
  if (poetNPCs.includes(npcId)) return 'poets';
  
  // IT-коллеги
  const itNPCs = [
    'kirill',
    'office_colleague',
    'office_boss',
    'office_alexander',
    'office_dmitry',
    'office_andrey',
    'office_artyom',
    'albert',
  ];
  if (itNPCs.includes(npcId)) return 'it_workers';
  
  // Странники снов
  const dreamerNPCs = ['lillian', 'witch', 'galaxy', 'quester'];
  if (dreamerNPCs.includes(npcId)) return 'dreamers';
  
  // Местные
  const localNPCs = [
    'sergeich',
    'barista',
    'zarema',
    'district_vika',
    'district_renata',
    'district_damien',
    'district_konstantin',
    'district_timur',
    'district_polikarp',
    'district_polikarp_night',
    'district_rimma',
    'district_rimma_night',
    'district_nastya',
    'pit_timur',
  ];
  if (localNPCs.includes(npcId)) return 'locals';
  
  return null;
}

// Получить бонус к взаимодействию от фракции
export function getInteractionBonus(
  factionId: FactionId, 
  reputation: number
): { dialogueBonus: number; discountBonus: number; questBonus: number } {
  const standing = getStandingLevel(reputation);
  
  switch (standing) {
    case 'ally':
      return { dialogueBonus: 25, discountBonus: 30, questBonus: 20 };
    case 'trusted':
      return { dialogueBonus: 15, discountBonus: 20, questBonus: 10 };
    case 'friendly':
      return { dialogueBonus: 10, discountBonus: 10, questBonus: 5 };
    case 'neutral':
      return { dialogueBonus: 0, discountBonus: 0, questBonus: 0 };
    case 'unfriendly':
      return { dialogueBonus: -10, discountBonus: -10, questBonus: -5 };
    case 'hostile':
      return { dialogueBonus: -25, discountBonus: -20, questBonus: -15 };
  }
}

// Проверить доступность квеста по репутации
export function isQuestAvailableByReputation(
  questId: string,
  factionReputations: Record<FactionId, FactionReputation>
): { available: boolean; reason?: string } {
  // Найти квест в какой фракции он принадлежит
  for (const [factionId, faction] of Object.entries(FACTIONS)) {
    if (faction.quests.includes(questId)) {
      const rep = factionReputations[factionId as FactionId];
      if (!rep) {
        return { available: false, reason: `Требуется знакомство с фракцией "${faction.name}"` };
      }
      
      // Специальные квесты требуют определённой репутации
      if (questId.includes('lost_') || questId.includes('star_')) {
        if (rep.value < 30) {
          return { available: false, reason: `Требуется репутация "Дружелюбный" со фракцией "${faction.name}"` };
        }
      }
      
      return { available: true };
    }
  }
  
  // Квест не принадлежит ни одной фракции — доступен всем
  return { available: true };
}
