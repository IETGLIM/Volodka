/* ─── Volodka RPG – Matrix Quotes ───
 * A collection of Matrix-rain animated quotes for story events.
 * Each quote is tied to a trigger (story node, quest, or event),
 * has a mood, act, and primary glow color.
 */

export interface MatrixQuote {
  id: string
  text: string
  /** Story node ID, quest ID, or event name that triggers this quote */
  trigger: string
  /** Which act this quote belongs to (1-5) */
  act: number
  /** Emotional tone of the quote */
  mood: 'hope' | 'danger' | 'revelation' | 'loss' | 'triumph'
  /** Primary glow color for the animated display */
  color: string
}

export const MATRIX_QUOTES: MatrixQuote[] = [
  /* ═══════════════════════════════════════════════════════════
     Act 1 — Пробуждение (Awakening)
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'mq_start',
    text: 'Каждый код — это стихотворение, которое ещё не дописано',
    trigger: 'start',
    act: 1,
    mood: 'hope',
    color: '#00ff41',
  },
  {
    id: 'mq_first_reading',
    text: 'Слова — это протокол. Стихи — это его взлом',
    trigger: 'first_reading',
    act: 1,
    mood: 'revelation',
    color: '#00e5ff',
  },
  {
    id: 'mq_incident',
    text: 'Ошибка #4729: не баг, а дверь',
    trigger: 'incident_scroll_4729',
    act: 1,
    mood: 'danger',
    color: '#d4920a',
  },
  {
    id: 'mq_vault',
    text: 'В хранилище — не данные. В хранилище — души',
    trigger: 'vault_backup_trial',
    act: 1,
    mood: 'revelation',
    color: '#00e5ff',
  },

  /* ═══════════════════════════════════════════════════════════
     Act 2 — Сеть (The Network)
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'mq_network',
    text: 'Сеть помнит тех, кто не боится задавать вопросы',
    trigger: 'network_initiation',
    act: 2,
    mood: 'hope',
    color: '#00ff41',
  },
  {
    id: 'mq_dmitry',
    text: 'Предательство — это просто рефакторинг верности',
    trigger: 'dmitry_defection',
    act: 2,
    mood: 'loss',
    color: '#cc2020',
  },
  {
    id: 'mq_smuggling',
    text: 'Контрабанда стихов — самый честный бизнес',
    trigger: 'poetry_smuggling',
    act: 2,
    mood: 'revelation',
    color: '#d4920a',
  },

  /* ═══════════════════════════════════════════════════════════
     Act 3 — Война (War)
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'mq_zarema',
    text: 'Дружба — единственный протокол, который нельзя взломать',
    trigger: 'zarema_rescue',
    act: 3,
    mood: 'danger',
    color: '#cc2020',
  },
  {
    id: 'mq_defense',
    text: 'Хранилище падёт, но стихи останутся',
    trigger: 'vault_defense',
    act: 3,
    mood: 'danger',
    color: '#cc2020',
  },
  {
    id: 'mq_maria_truth',
    text: 'Она — не машина. Она — стихотворение в двоичном коде',
    trigger: 'maria_truth',
    act: 3,
    mood: 'revelation',
    color: '#00e5ff',
  },

  /* ═══════════════════════════════════════════════════════════
     Act 4 — Революция (Revolution)
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'mq_infiltration',
    text: 'Революция начинается со слова',
    trigger: 'guild_infiltration',
    act: 4,
    mood: 'triumph',
    color: '#d4920a',
  },
  {
    id: 'mq_broadcast',
    text: 'Один эфир — и тишина станет громом',
    trigger: 'poetry_broadcast',
    act: 4,
    mood: 'triumph',
    color: '#00ff41',
  },

  /* ═══════════════════════════════════════════════════════════
     Act 5 — Финал (Finale)
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'mq_creator',
    text: 'В каждом сервере живёт чья-то душа',
    trigger: 'ending_creator',
    act: 5,
    mood: 'triumph',
    color: '#00ff41',
  },
  {
    id: 'mq_poet',
    text: 'Последнее стихотворение — это первое дыхание свободы',
    trigger: 'ending_poet',
    act: 5,
    mood: 'triumph',
    color: '#d4920a',
  },
  {
    id: 'mq_rebel',
    text: 'Повстанец — это программист, который переписал систему',
    trigger: 'ending_rebel',
    act: 5,
    mood: 'triumph',
    color: '#cc2020',
  },
  {
    id: 'mq_exile',
    text: 'Изгнанник — это тот, кто выбрал правду вместо комфорта',
    trigger: 'ending_exile',
    act: 5,
    mood: 'loss',
    color: '#cc2020',
  },
  {
    id: 'mq_machine',
    text: 'Машина не знает слёз. Но ты — знаешь',
    trigger: 'ending_machine',
    act: 5,
    mood: 'loss',
    color: '#6a8a30',
  },
]

/* ─── Lookup helpers ─── */

/** Build a trigger → quote lookup map */
const TRIGGER_MAP = new Map<string, MatrixQuote>()
for (const quote of MATRIX_QUOTES) {
  TRIGGER_MAP.set(quote.trigger, quote)
}

/** Get a quote by its trigger (story node, quest, or event name) */
export function getQuoteByTrigger(trigger: string): MatrixQuote | undefined {
  return TRIGGER_MAP.get(trigger)
}

/** Get all quotes for a given act */
export function getQuotesByAct(act: number): MatrixQuote[] {
  return MATRIX_QUOTES.filter((q) => q.act === act)
}

/** Get all quotes with a specific mood */
export function getQuotesByMood(mood: MatrixQuote['mood']): MatrixQuote[] {
  return MATRIX_QUOTES.filter((q) => q.mood === mood)
}

/** Get a random quote for a given act */
export function getRandomQuoteForAct(act: number): MatrixQuote | undefined {
  const actQuotes = getQuotesByAct(act)
  if (actQuotes.length === 0) return undefined
  return actQuotes[Math.floor(Math.random() * actQuotes.length)]
}
