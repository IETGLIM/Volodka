/* ─── Volodka RPG – Matrix Quotes ───
 * A collection of Matrix-rain animated quotes for story events.
 * Each quote is tied to a trigger (story node, quest, or event),
 * has a mood, act, and primary glow color.
 */

import { CYBER_CYAN } from '@/shared/constants/cyberPalette';

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
    color: CYBER_CYAN,
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
    color: CYBER_CYAN,
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
    color: CYBER_CYAN,
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

  /* ═══════════════════════════════════════════════════════════
     WS18-D — Philosophical ambient fragments (11 new quotes)
     Themes: code as poetry, systems as gods, memory as currency,
     sleep as defragmentation, errors as prophecies, recursion,
     stack overflow, binary tree of choices, mutable identity.
     Shown in HUD tickers, terminal logs, matrix-style overlays.
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'mq_ws18d_code_poetry',
    text: 'Код — это поэзия, в которой каждое двоеточие — пауза для дыхания',
    trigger: 'ws18d_code_poetry',
    act: 1,
    mood: 'hope',
    color: '#00ff41',
  },
  {
    id: 'mq_ws18d_sleep_defrag',
    text: 'Сон — это дефрагментация. Те, кто не спят, фрагментированы и медленно сходят с ума',
    trigger: 'ws18d_sleep_defrag',
    act: 1,
    mood: 'loss',
    color: '#6a8a30',
  },
  {
    id: 'mq_ws18d_gods_silent',
    text: 'Боги не умерли. Они переписали себя на C++ и забыли добавить README',
    trigger: 'ws18d_gods_silent',
    act: 2,
    mood: 'revelation',
    color: CYBER_CYAN,
  },
  {
    id: 'mq_ws18d_memory_currency',
    text: 'Валюта будущего — не биткоин, а байт нетронутой памяти',
    trigger: 'ws18d_memory_currency',
    act: 2,
    mood: 'revelation',
    color: '#d4920a',
  },
  {
    id: 'mq_ws18d_errors_prophecy',
    text: 'Ошибка 0xDEADBEEF — не сбой, а пророчество. Машина знает то, что мы отказываемся слышать',
    trigger: 'ws18d_errors_prophecy',
    act: 3,
    mood: 'danger',
    color: '#cc2020',
  },
  {
    id: 'mq_ws18d_tree_choice',
    text: 'Каждый выбор — узел в дереве. Каждый отказ — лист, который всё ещё помнит, что мог быть',
    trigger: 'ws18d_tree_choice',
    act: 3,
    mood: 'revelation',
    color: CYBER_CYAN,
  },
  {
    id: 'mq_ws18d_stack_overflow_soul',
    text: 'Стек переполнился — и душа ушла в адресное пространство, которого нет на карте',
    trigger: 'ws18d_stack_overflow_soul',
    act: 4,
    mood: 'loss',
    color: '#6a8a30',
  },
  {
    id: 'mq_ws18d_kolyadka',
    text: 'Код-Колядка поётся шёпотом: кто услышит — напишет; кто напишет — предскажет',
    trigger: 'ws18d_kolyadka',
    act: 4,
    mood: 'revelation',
    color: '#d4920a',
  },
  {
    id: 'mq_ws18d_rain_corpuscles',
    text: 'Дождь в Уфе — не вода. Это сервер Сети потеет избыточными данными',
    trigger: 'ws18d_rain_corpuscles',
    act: 4,
    mood: 'danger',
    color: '#cc2020',
  },
  {
    id: 'mq_ws18d_recursion_dream',
    text: 'Сон внутри сна внутри сна — это не баг рекурсии, это её финал',
    trigger: 'ws18d_recursion_dream',
    act: 5,
    mood: 'danger',
    color: '#cc2020',
  },
  {
    id: 'mq_ws18d_ash_variables',
    text: 'Переменная переписана. Старое значение — пепел. Пепел помнит форму огня',
    trigger: 'ws18d_ash_variables',
    act: 5,
    mood: 'loss',
    color: '#6a8a30',
  },

  /* ═══════════════════════════════════════════════════════════
     WS19-D — Systems-decay ambient fragments (8 new quotes)
     Themes: phantom processes, null references, dead locks,
     memory leaks, orphaned connections, zombie threads,
     signal decay, bit rot.
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'mq_ws19d_phantom_process',
    text: 'Процесс-фантом не умирает — он ждёт, когда кто-нибудь обратится по его PID',
    trigger: 'ws19d_phantom_process',
    act: 2,
    mood: 'danger',
    color: '#cc2020',
  },
  {
    id: 'mq_ws19d_null_reference',
    text: 'Нулевая ссылка — это не отсутствие. Это точка, где всё сходится и ничто не удерживается',
    trigger: 'ws19d_null_reference',
    act: 3,
    mood: 'loss',
    color: '#6a8a30',
  },
  {
    id: 'mq_ws19d_dead_lock',
    text: 'Дедлок — когда два процесса вечно ждут друг друга, как два стихотворения на одной странице',
    trigger: 'ws19d_dead_lock',
    act: 3,
    mood: 'danger',
    color: '#cc2020',
  },
  {
    id: 'mq_ws19d_memory_leak',
    text: 'Утечка памяти — не баг. Это система, которая не умеет забывать',
    trigger: 'ws19d_memory_leak',
    act: 2,
    mood: 'loss',
    color: '#6a8a30',
  },
  {
    id: 'mq_ws19d_orphaned_connection',
    text: 'Осиротевшее соединение всё ещё слушает порт, на котором никто не говорит',
    trigger: 'ws19d_orphaned_connection',
    act: 4,
    mood: 'loss',
    color: '#6a8a30',
  },
  {
    id: 'mq_ws19d_zombie_thread',
    text: 'Зомби-поток вернулся из kill(). У сигнала SIGTERM нет власти над тем, кто уже не жив',
    trigger: 'ws19d_zombie_thread',
    act: 4,
    mood: 'danger',
    color: '#cc2020',
  },
  {
    id: 'mq_ws19d_signal_decay',
    text: 'Сигнал угасает, но затухание — не тишина. Каждый децибел — эхо того, что было сказано',
    trigger: 'ws19d_signal_decay',
    act: 5,
    mood: 'revelation',
    color: CYBER_CYAN,
  },
  {
    id: 'mq_ws19d_bit_rot',
    text: 'Гниение битов — медленная энтропия. Ни один бит не вечен, даже ноль',
    trigger: 'ws19d_bit_rot',
    act: 5,
    mood: 'danger',
    color: '#cc2020',
  },
]

/* ─── Lookup helpers ─── */

/** Get all quotes for a given act */
export function getQuotesByAct(act: number): MatrixQuote[] {
  return MATRIX_QUOTES.filter((q) => q.act === act)
}

/** Lookup a matrix quote by story node, quest, or event trigger id */
export function getQuoteByTrigger(trigger: string): MatrixQuote | undefined {
  return MATRIX_QUOTES.find((q) => q.trigger === trigger)
}
