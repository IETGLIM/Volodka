/**
 * Квестовая логика — состояние мира и вычисление текущей цели.
 * Принцип «показывай, не рассказывай»: цель ведёт огонёк-проводник,
 * световой луч и компас в HUD. Здесь — только логика.
 */
import { v3 } from './utils';
import type { V3 } from './utils';

export interface GameState {
  stanzas: number[];        // индексы собранных строф
  fireflies: number;        // пойманные светлячки
  lanterns: number;         // зажжённые фонари
  metStarets: boolean;
  catQuestStarted: boolean; // Милица попросила найти Барсика
  catBack: boolean;         // Барсик возвращён Милице
  fireflyReward: boolean;
  finale: boolean;
}

export interface Objective {
  title: string;
  text: string;
  target: V3 | null;
  lead: boolean; // огонёк ведёт игрока (в отличие от «отметить цель»)
}

export const TARGETS = {
  starets: v3(17.5, 0, -13.5),
  well: v3(3.5, 0, 1.8),
  cat: v3(30.5, 0, -17.5),
  milica: v3(6.2, 0, 3.4),
  glade: v3(-20, 0, 25),
  mill: v3(-32, 0, -38),
  pond: v3(32, 0, -16),
  oakScroll: v3(17.2, 0, -12.6),
  hill: v3(2, 0, 62),
} as const;

export const hasStanza = (s: GameState, i: number) => s.stanzas.includes(i);

export function computeObjective(s: GameState): Objective {
  if (!s.metStarets) {
    return { title: 'Пролог', text: 'Следуй за огоньком — Старец ждёт у старого дуба', target: TARGETS.starets, lead: true };
  }
  if (!hasStanza(s, 0)) {
    return { title: 'Глава I — Колодец строк', text: 'Возьми первую строку у колодца', target: TARGETS.well, lead: false };
  }
  if (!s.catQuestStarted) {
    return { title: 'Глава II — Светлячковая поляна', text: 'Поговори с Милицей — у неё просьба', target: TARGETS.milica, lead: true };
  }
  if (!s.catBack) {
    return { title: 'Глава II — Светлячковая поляна', text: 'Найди Барсика у пруда и верни его Милице', target: TARGETS.cat, lead: true };
  }
  if (!hasStanza(s, 1)) {
    return { title: 'Глава II — Светлячковая поляна', text: 'Собери строку на поляне за деревней', target: TARGETS.glade, lead: false };
  }
  if (s.lanterns < 5) {
    return { title: 'Глава III — Мельница ветров', text: `Зажги фонари вдоль дороги к мельнице (${s.lanterns}/5)`, target: TARGETS.mill, lead: false };
  }
  if (!hasStanza(s, 2)) {
    return { title: 'Глава III — Мельница ветров', text: 'Ветер вернулся — возьми строку в мельнице', target: TARGETS.mill, lead: false };
  }
  if (!hasStanza(s, 3)) {
    return { title: 'Глава IV — Зеркало пруда', text: 'Достань строку из отражения пруда', target: TARGETS.pond, lead: false };
  }
  if (!hasStanza(s, 4)) {
    return { title: 'Глава V — Старый дуб', text: 'Строка ждёт под корнями дуба', target: TARGETS.oakScroll, lead: false };
  }
  if (!hasStanza(s, 5)) {
    return { title: 'Глава VI — Лунная поляна', text: 'Поднимись на поляну — луна уже близко', target: TARGETS.hill, lead: true };
  }
  if (!s.finale) {
    return { title: 'Финал', text: 'Открой журнал (J) — сказка рассказана', target: null, lead: false };
  }
  return { title: 'Сказка рассказана', text: 'Долина свободна — гуляй, лови светлячков, говори с жителями', target: null, lead: false };
}

export const DEFAULT_STATE: GameState = {
  stanzas: [],
  fireflies: 0,
  lanterns: 0,
  metStarets: false,
  catQuestStarted: false,
  catBack: false,
  fireflyReward: false,
  finale: false,
};
