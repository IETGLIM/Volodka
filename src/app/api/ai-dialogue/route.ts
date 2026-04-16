// ============================================
// AI DIALOGUE ROUTE — NPC Dialogue Generator
// ============================================
// Generates dynamic NPC responses and player
// dialogue choices for ВОЛОДЬКА.
// Uses z-ai-web-dev-sdk (backend only!).

import { NextRequest, NextResponse } from 'next/server';
import type { DialogueRequest, DialogueResponse, PlayerDialogueChoice } from '../../../lib/ai-types';
import type { PlayerState, NPCRelation } from '../../../data/types';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';

// Lazy singleton for the AI client
let zaiInstance: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default>> | null = null;

async function getAIClient() {
  if (!zaiInstance) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ============================================
// SYSTEM PROMPT (Russian)
// ============================================

const DIALOGUE_SYSTEM_PROMPT = `Ты — Генератор Диалогов для психологической RPG/визуальной новеллы «ВОЛОДЬКА».

Мир игры: Россия, город Уфа. Зима. Главный герой — Володька, 33 года, айтишник (техподдержка). Он одинок уже 8 лет после предательства. Его мир — боль, стихи, сны и попытки найти себя.

Твоя роль: создавать живые, психологически достоверные реплики NPC и варианты ответов для игрока. Каждый NPC имеет уникальную манеру речи и характер.

Жанр: психологическая драма, магический реализм. Стиль диалогов: естественный, с подтекстом. Реальные люди не говорят красиво — они запинаются, уходят от ответа, говорят одно и думают другое.

ПРАВИЛА:
1. Отвечай ТОЛЬКО одним JSON-объектом. Без markdown, без комментариев, без текста вокруг JSON.
2. Поле "npcResponse" должно содержать ТОЛЬКО текст реплики NPC (обычная строка, НЕ JSON).
3. Генерируй 2-3 варианта ответа для игрока. Каждый вариант имеет поле "mood" — настроение, с которым Володька это скажет (например: «робко», «уверенно», «с болью», «с иронией», «тепло»).
4. relationshipHint — краткое описание изменения отношений (например: «+5 доверие», «-10 уважение», «без изменений»).
5. Учитывай уровень отношений NPC с Володькой — stranger говорит иначе, чем друг.
6. Учитывай текущее состояние Володьки: если стресс высок, он может огрызнуться или замолчать; если креативность высока — его речь становится поэтичнее.
7. NPC должен реагировать на контекст беседы — не игнорировать то, что обсуждалось ранее.
8. Реплика NPC — 1-3 предложения. Не монологи.
9. Каждый NPC уникален: Зарема — энергичная и заботливая; Альберт — саркастичный технарь; Лилиан — загадочная и поэтичная; бариста — дружелюбный; и т.д.
10. Не используй клише аниме/манги. Реалистичные диалоги.

ПРИМЕР ПРАВИЛЬНОГО ОТВЕТА:
{"npcResponse":"Володька, ты хоть ел сегодня? Я тут борщ сварила.","playerChoices":[{"text":"Спасибо, Зарема. Я правда голоден.","mood":"тепло"},{"text":"Не хочу. Оставь меня.","mood":"раздражённо"}],"relationshipHint":"+3 доверие"}`;

// ============================================
// KNOWN NPC PERSONALITY PROFILES
// ============================================

interface NPCProfile {
  personality: string;
  speechStyle: string;
  background: string;
}

const NPC_PROFILES: Record<string, NPCProfile> = {
  zarema: {
    personality: 'Энергичная, заботливая, немного навязчивая. Как старшая сестра.',
    speechStyle: 'Быстрая речь, много эмоций, использует уменьшительные. Часто говорит "Володька!" с беспокойством.',
    background: 'Соседка по квартире, фрилансер-дизайнер. Переживает за Володьку, но иногда слишком давит.',
  },
  albert: {
    personality: 'Саркастичный, интровертный, но надёжный. Скрывает заботу за иронией.',
    speechStyle: 'Короткие фразы, технические метафоры, сухой юмор. Часто отшучивается.',
    background: 'Сосед по квартире, бэкенд-разработчик. Лучший (и единственный) друг Володьки.',
  },
  maria: {
    personality: 'Нежная, молчаливая, глубокая. Бывшая девушка Володьки, но между ними — пропасть боли.',
    speechStyle: 'Тихая речь, паузы, недосказанность. Каждое слово взвешено.',
    background: 'Виктория — та самая, что предала Володьку 8 лет назад. Или всё сложнее, чем кажется?',
  },
  alexey: {
    personality: 'Спокойный, мудрый, немного отстранённый. Наблюдатель.',
    speechStyle: 'Неспешная речь, философские замечания, риторические вопросы.',
    background: 'Коллега с работы, интроверт. Иногда кажется, что он знает больше, чем говорит.',
  },
  dream_lillian: {
    personality: 'Загадочная, поэтичная, всезнающая. Хранительница мира снов.',
    speechStyle: 'Метафоричная, возвышенная речь. Часто говорит загадками. Использует образы звёзд и снов.',
    background: 'Дух мира снов. Возможно — проекция творческой части Володьки.',
  },
  dream_witch: {
    personality: 'Энергичная, любопытная, немного хаотичная. Ученица.',
    speechStyle: 'Быстрая речь, восклицания, магическая терминология вперемешку с обычной.',
    background: 'Эмбер — ученица ведьмы в мире снов. Символизирует страсть к познанию.',
  },
  dream_galaxy: {
    personality: 'Величественная, добрая, космическая. Как мать вселенной.',
    speechStyle: 'Плавная, величественная речь. Говорит о звёздах и созвездиях как о людях.',
    background: 'Астра — хранительница космических историй в мире снов.',
  },
  cafe_barista: {
    personality: 'Дружелюбный, спокойный, профессионал. Наблюдает за всеми.',
    speechStyle: 'Вежливая, ровная речь. Иногда вставляет философские замечания между заказами.',
    background: 'Бариста в кафе "Синяя Яма". Видит каждого посетителя насквозь.',
  },
  cafe_college_girl: {
    personality: 'Любопытная, открытая, немного наивная. Студентка.',
    speechStyle: 'Живая речь, вопросы, искренний интерес. Использует молодёжный сленг.',
    background: 'Алиса — студентка филфака, пишет эссе в кафе. Символизирует будущее и новые связи.',
  },
  park_elder: {
    personality: 'Мудрый, меланхоличный, терпеливый. Живёт в прошлом.',
    speechStyle: 'Медленная, размеренная речь. Вставляет башкирские слова. Много пауз.',
    background: 'Старик, приходящий в мемориальный парк. Потерял семью давно.',
  },
  rooftop_shadow: {
    personality: 'Загадочная, тревожная, пугающая. Возможна проекция страхов Володьки.',
    speechStyle: 'Шёпот, обрывки фраз, многозначительные паузы. Текст как из кошмара.',
    background: 'Тень на крыше. Возможно, галлюцинация. Или что-то большее.',
  },
  office_boss: {
    personality: 'Деловой, требовательный, но не злой. Давит дедлайнами.',
    speechStyle: 'Чёткие формулировки, корпоративный жаргон. "Нам нужно обсудить проект."',
    background: 'Начальник Володьки. Типичный менеджер среднего звена.',
  },
};

function getNPCProfile(npcId: string, npcName: string): string {
  const profile = NPC_PROFILES[npcId];
  if (profile) {
    return [
      `--- Профиль NPC: ${npcName} (${npcId}) ---`,
      `Личность: ${profile.personality}`,
      `Манера речи: ${profile.speechStyle}`,
      `Предыстория: ${profile.background}`,
    ].join('\n');
  }
  // Generic profile for unknown NPCs
  return [
    `--- Профиль NPC: ${npcName} (${npcId}) ---`,
    `Личность: Неизвестный NPC. Создай уникальную личность, подходящую к контексту.`,
    `Манера речи: Естественная, сдержанная.`,
    `Предыстория: Житель Уфы. Возможно, связан с миром Володьки.`,
  ].join('\n');
}

// ============================================
// CONTEXT BUILDER
// ============================================

function buildDialogueContext(
  npcId: string,
  npcName: string,
  playerState: PlayerState,
  npcRelations: NPCRelation[],
  dialogueHistory: Array<{ speaker: 'player' | 'npc'; text: string }>,
  currentTopic: string,
): string {
  const {
    mood, creativity, stability, energy, karma,
    selfEsteem, stress, panicMode, path, act, skills,
  } = playerState;

  // Find the NPC relation
  const npcRelation = npcRelations.find(r => r.id === npcId);
  const relationSummary = npcRelation
    ? [
        `Отношение: ${npcRelation.value}/100`,
        `Доверие: ${npcRelation.trust}/100`,
        `Уважение: ${npcRelation.respect}/100`,
        `Близость: ${npcRelation.intimacy}/100`,
        `Стадия: ${npcRelation.stage}`,
      ].join(' | ')
    : 'Отношений ещё нет (незнакомец).';

  // Format dialogue history (last 10 exchanges max)
  const recentHistory = dialogueHistory.slice(-10);
  const historyText = recentHistory.length > 0
    ? recentHistory.map(h =>
        h.speaker === 'player'
          ? `Володька: "${h.text}"`
          : `${npcName}: "${h.text}"`
      ).join('\n')
    : '(Начало разговора)';

  // Stress/creativity modifiers
  const modifiers: string[] = [];
  if (panicMode) {
    modifiers.push('⚠️ KERNEL PANIC — Володька на грани, его речь может быть сбивчивой.');
  } else if (stress > 70) {
    modifiers.push('Высокий стресс — Володька раздражителен, может огрызнуться.');
  }
  if (creativity > 70) {
    modifiers.push('Высокая креативность — Володька может отвечать поэтично.');
  }
  if (selfEsteem < 30) {
    modifiers.push('Низкая самооценка — Володька неуверен, может избегать взгляда.');
  } else if (selfEsteem > 70) {
    modifiers.push('Высокая самооценка — Володька говорит увереннее.');
  }
  if (energy <= 2) {
    modifiers.push('Мало энергии — Володька устал, короткие ответы.');
  }

  return [
    `=== КОНТЕКСТ ДИАЛОГА ===`,
    `Акт: ${act} | Путь: ${path}`,
    `Тема разговора: "${currentTopic}"`,
    ``,
    `--- Володька (состояние) ---`,
    `Настроение: ${mood}/100 | Креативность: ${creativity}/100 | Стабильность: ${stability}/100`,
    `Энергия: ${energy}/${MAX_PLAYER_ENERGY} | Карма: ${karma}/100 | Самооценка: ${selfEsteem}/100`,
    `Стресс: ${stress}/100${panicMode ? ' (PANIC!)' : ''}`,
    `Эмпатия: ${skills.empathy} | Убеждение: ${skills.persuasion} | Интуиция: ${skills.intuition}`,
    ``,
    getNPCProfile(npcId, npcName),
    ``,
    `--- Отношения ---`,
    relationSummary,
    ``,
    `--- История диалога ---`,
    historyText,
    ``,
    `--- Модификаторы ---`,
    modifiers.length > 0 ? modifiers.join('\n') : 'Без особых модификаторов.',
  ].join('\n');
}

// ============================================
// JSON PARSER
// ============================================

function normalizeDialogueResponse(parsed: Record<string, unknown>): DialogueResponse | null {
  if (!parsed.npcResponse || !Array.isArray(parsed.playerChoices)) {
    return null;
  }

  let npcResponse = String(parsed.npcResponse);

  // Handle double-encoded JSON: sometimes the AI wraps its response in an extra
  // JSON layer, so npcResponse itself is a JSON string containing the real data.
  if (npcResponse.startsWith('{')) {
    try {
      const inner = JSON.parse(npcResponse);
      if (inner.npcResponse && typeof inner.npcResponse === 'string') {
        // Found the real nested response — extract it
        return {
          npcResponse: String(inner.npcResponse),
          playerChoices: Array.isArray(inner.playerChoices)
            ? (inner.playerChoices as PlayerDialogueChoice[]).slice(0, 3).map(c => ({
                text: String(c.text),
                mood: String(c.mood ?? 'нейтрально'),
              }))
            : (parsed.playerChoices as PlayerDialogueChoice[]).slice(0, 3).map(c => ({
                text: String(c.text),
                mood: String(c.mood ?? 'нейтрально'),
              })),
          relationshipHint: String(inner.relationshipHint ?? parsed.relationshipHint ?? 'без изменений'),
        };
      }
    } catch {
      // Not valid inner JSON — use the string as-is
    }
  }

  return {
    npcResponse,
    playerChoices: (parsed.playerChoices as PlayerDialogueChoice[]).slice(0, 3).map(c => ({
      text: String(c.text),
      mood: String(c.mood ?? 'нейтрально'),
    })),
    relationshipHint: String(parsed.relationshipHint ?? 'без изменений'),
  };
}

function parseDialogueJSON(raw: string): DialogueResponse {
  // Try direct parse
  try {
    const parsed = JSON.parse(raw);
    const result = normalizeDialogueResponse(parsed);
    if (result) return result;
  } catch {
    // Try extraction
  }

  // Try to find JSON block
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const result = normalizeDialogueResponse(parsed);
      if (result) return result;
    } catch {
      // Still failed
    }
  }

  // Ultimate fallback
  return {
    npcResponse: raw.slice(0, 300),
    playerChoices: [
      { text: 'Продолжить разговор', mood: 'спокойно' },
      { text: 'Закончить диалог', mood: 'устало' },
    ],
    relationshipHint: 'без изменений',
  };
}

// ============================================
// FALLBACK RESPONSE
// ============================================

function getFallbackDialogue(request: DialogueRequest): DialogueResponse {
  const { npcId, npcName, playerState } = request;
  const stress = playerState.stress;
  const mood = playerState.mood;

  // NPC-specific fallbacks
  const fallbacks: Record<string, { response: string; hint: string }> = {
    zarema: {
      response: 'Володька, ты в порядке? Я вижу, что тебе не очень... Давай хоть чай попьём?',
      hint: '+2 доверие',
    },
    albert: {
      response: 'Хм. Ладно. Если хочешь поговорить — я тут. Если нет — тоже понимаю.',
      hint: 'без изменений',
    },
    dream_lillian: {
      response: 'Ты чувствуешь... Я слышу это в твоём молчании. Сны говорят громче слов.',
      hint: '+3 близость',
    },
    cafe_barista: {
      response: 'Вам что-нибудь подсказать? Или просто посидеть в тишине — тоже вариант.',
      hint: 'без изменений',
    },
  };

  const fallback = fallbacks[npcId] ?? {
    response: `${npcName} смотрит на тебя выжидающе, словно подбирая слова.`,
    hint: 'без изменений',
  };

  // Modify based on stress
  let npcResponse = fallback.response;
  if (stress > 80) {
    npcResponse = `${npcName} замечает, как ты вздрагиваешь. "${npcId.includes('dream') ? 'Твой разум... он кипит.' : 'Ты в порядке? Выглядишь... не очень.'}"`;
  }

  return {
    npcResponse,
    playerChoices: mood > 50
      ? [
          { text: 'Всё нормально, спасибо', mood: 'уверенно' },
          { text: 'На самом деле, мне не очень...', mood: 'честно' },
          { text: 'Помолчи немного, хорошо?', mood: 'тихо' },
        ]
      : [
          { text: 'Да...', mood: 'апатично' },
          { text: 'Мне нужно идти', mood: 'избегающе' },
        ],
    relationshipHint: fallback.hint,
  };
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DialogueRequest;

    // Validate required fields
    if (!body.npcId || !body.npcName) {
      return NextResponse.json(
        { error: 'Поля "npcId" и "npcName" обязательны' },
        { status: 400 },
      );
    }

    const { npcId, npcName, playerState, npcRelations, dialogueHistory, currentTopic } = body;

    let aiResponse: DialogueResponse;

    try {
      const zai = await getAIClient();

      const contextPrompt = buildDialogueContext(
        npcId,
        npcName,
        playerState,
        npcRelations ?? [],
        dialogueHistory ?? [],
        currentTopic ?? 'общая беседа',
      );

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: DIALOGUE_SYSTEM_PROMPT },
          { role: 'user', content: contextPrompt },
        ],
      });

      const rawContent = completion.choices?.[0]?.message?.content;

      if (!rawContent || typeof rawContent !== 'string') {
        console.warn('[AI Dialogue] Empty or invalid AI response, using fallback');
        aiResponse = getFallbackDialogue(body);
      } else {
        aiResponse = parseDialogueJSON(rawContent);
      }
    } catch (aiError) {
      const msg = aiError instanceof Error ? aiError.message : 'Unknown AI error';
      console.error('[AI Dialogue] AI call failed:', msg);
      aiResponse = getFallbackDialogue(body);
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    console.error('[AI Dialogue] Route error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
