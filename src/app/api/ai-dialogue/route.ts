// ============================================
// AI DIALOGUE ROUTE — NPC Dialogue Generator
// ============================================
// Generates dynamic NPC responses and player
// dialogue choices for ВОЛОДЬКА.
// Uses z-ai-web-dev-sdk (backend only!).

import { NextRequest, NextResponse } from 'next/server';
import type { DialogueRequest, DialogueResponse } from '../../../lib/ai-types';
import { parseDialogueFromModelRaw, withAbortTimeout, AI_DIALOGUE_SDK_TIMEOUT_MS } from '@/services/ai-service';
import type { PlayerState, NPCRelation } from '../../../data/types';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';
import { isFeatureFlagEnabled, MAX_AI_DIALOGUE_BODY_BYTES } from '@/lib/apiRouteSecurity';
import { safeParseDialogueRequest } from '@/validation/aiDialogueRequestSchema';

type ZAIClient = {
  chat: {
    completions: {
      create: (args: { messages: Array<{ role: string; content: string }> }) => Promise<unknown>;
    };
  };
};

// Lazy singleton for the AI client (SDK default export is a class, not a callable type for ReturnType<>)
let zaiInstance: ZAIClient | null = null;

async function getAIClient(): Promise<ZAIClient> {
  if (!zaiInstance) {
    const mod = await import('z-ai-web-dev-sdk');
    const ZAI = mod.default as unknown as { create: () => Promise<ZAIClient> };
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
9. Каждый NPC уникален: Заремушка (Зарема) — энергичная и заботливая; Альберт — саркастичный технарь; Виктория в кафе — открытая, филфак; Александр/Дмитрий/Артём/Андрей (офис) — разные роли; Лилиан — загадочная; бариста — дружелюбный; и т.д.
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
    personality: 'Энергичная, заботливая, «Заремушка» для своих; немного навязчивая, как старшая сестра.',
    speechStyle: 'Быстрая речь, уменьшительные, может крикнуть с балкона; часто «Володька!» с беспокойством.',
    background: 'Соседка по району и дому, фрилансер-дизайнер; на Зелёнке и у подъезда её знают все.',
  },
  albert: {
    personality: 'Саркастичный, интровертный, но надёжный. Скрывает заботу за иронией.',
    speechStyle: 'Короткие фразы, технические метафоры, сухой юмор. Часто отшучивается.',
    background:
      'Сосед и бэкенд; вечерами — бар «Синяя яма» через дорогу от панельки: стойка, гитара, вокал. С Заремушкой — «семейный бизнес» и лучший друг Володьки на земле.',
  },
  maria: {
    personality: 'Та, с кем копятся отношения id «maria»: в кафе это Виктория после open mic — тёплая, внимательная; в памяти — тяжесть старого имени и старой боли.',
    speechStyle: 'Живая речь в кафе; если контекст прошлого — тише, короче фразы.',
    background: 'В игре шкала «maria» связывает новую Викторию из «Синей Ямы» с сюжетной линией доверия; не путать с офисным Андреем из compliance.',
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
    personality: 'Тот же Альберт (legacy id в запросах): бармен, гитарист, технарь.',
    speechStyle: 'Как у Альберта, плюс барные короткие реплики между «заказами».',
    background: 'Хозяин бара «Синяя яма» напротив панельки; Заремушка рядом как жена и «мама зала».',
  },
  pit_timur: {
    personality: 'Ударник, ироничный, свой в доску.',
    speechStyle: 'Короткие фразы, метафоры про ритм и репетиции.',
    background: 'Завсегдатай бара «Синяя яма», кавер-группа с Альбертом.',
  },
  cafe_college_girl: {
    personality: 'Любопытная, открытая, слушает всерьёз. Студентка филфака.',
    speechStyle: 'Живая речь, вопросы, искренний интерес; может назваться «Вика», в паспорте — Виктория.',
    background: 'Виктория из «Синей Ямы» — новая связь после чтения; эссе про сны и творчество; не «Алиса».',
  },
  office_alexander: {
    personality: 'Техлид, ответственный, без лишней сентиментальности.',
    speechStyle: 'Коротко, по делу, метафоры про прод и контуры.',
    background: 'Коллега Володьки в облачном офисе.',
  },
  office_dmitry: {
    personality: 'DevOps, устойчивый к ночным инцидентам, самоирония.',
    speechStyle: '«Дима» в быту, в паспорте Дмитрий; шутит про Grafana и откаты.',
    background: 'Коллега из DevOps, помогает в авариях.',
  },
  office_andrey: {
    personality: 'Compliance, вежливо обозначает границы; понимает, что имя у многих.',
    speechStyle: 'Нейтрально-деловой тон, одна фраза про «другой Андрей» при знакомстве.',
    background: 'Не тот Андрей из личной истории Володьки.',
  },
  office_artyom: {
    personality: 'ИБ, внимателен к утечкам и токенам.',
    speechStyle: 'Предупреждает сухо, без морализаторства.',
    background: 'Коллега из информационной безопасности.',
  },
  district_vika: {
    personality: 'Соседка с Зелёнки, тёплая, память на общее детство.',
    speechStyle: 'На «ты», шутит, может напомнить про старый двор.',
    background: 'Вика с Зелёнки.',
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
    const rawText = await request.text();
    if (rawText.length > MAX_AI_DIALOGUE_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Слишком большое тело запроса', code: 'DIALOGUE_PAYLOAD_TOO_LARGE' },
        { status: 413 },
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(rawText) as unknown;
    } catch {
      return NextResponse.json(
        { error: 'Ожидался JSON', code: 'DIALOGUE_INVALID_JSON' },
        { status: 400 },
      );
    }

    const parsed = safeParseDialogueRequest(json);
    if (!parsed.ok) {
      return NextResponse.json(
        {
          error: 'Неверная структура запроса диалога',
          code: 'DIALOGUE_VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    const body: DialogueRequest = parsed.data;

    if (!isFeatureFlagEnabled(process.env.ENABLE_AI_DIALOGUE_API)) {
      return NextResponse.json(getFallbackDialogue(body));
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

      const messages = [
        { role: 'system' as const, content: DIALOGUE_SYSTEM_PROMPT },
        { role: 'user' as const, content: contextPrompt },
      ];

      let completion: unknown;
      try {
        completion = await withAbortTimeout(
          zai.chat.completions.create({ messages }),
          AI_DIALOGUE_SDK_TIMEOUT_MS,
        );
      } catch (timeoutOrSdkErr) {
        const msg = timeoutOrSdkErr instanceof Error ? timeoutOrSdkErr.message : String(timeoutOrSdkErr);
        console.warn('[AI Dialogue] SDK call failed or timed out, using mock fallback:', msg);
        aiResponse = getFallbackDialogue(body);
        return NextResponse.json(aiResponse);
      }

      const c = completion as { choices?: Array<{ message?: { content?: unknown } }> };
      const rawContent = c.choices?.[0]?.message?.content;

      if (!rawContent || typeof rawContent !== 'string') {
        console.warn('[AI Dialogue] Empty or invalid AI response, using fallback');
        aiResponse = getFallbackDialogue(body);
      } else {
        aiResponse = parseDialogueFromModelRaw(rawContent);
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
