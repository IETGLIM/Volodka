// ============================================
// AI NARRATIVE ROUTE — Narrative Director
// ============================================
// Generates narrative reactions to player
// actions in the world of ВОЛОДЬКА.
// Uses z-ai-web-dev-sdk (backend only!).

import { NextRequest, NextResponse } from 'next/server';
import type { NarrativeRequest, NarrativeResponse, DynamicChoice } from '../../../lib/ai-types';
import type { PlayerState, NPCRelation } from '../../../data/types';

// Lazy singleton for the AI client — avoids importing on client bundle
let zaiInstance: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default>> | null = null;

async function getAIClient() {
  if (!zaiInstance) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ============================================
// SYSTEM PROMPT (Russian — the game is in Russian)
// ============================================

const NARRATIVE_SYSTEM_PROMPT = `Ты — Повествователь в психологической RPG/визуальной новелле «ВОЛОДЬКА».

Мир игры: Россия, город Уфа. Зима. Главный герой — Володька, 33 года, айтишник (техподдержка). Он одинок уже 8 лет после предательства близкого человека. Его внутренний мир — лабиринт боли, стихов и снов.

Твоя роль: создавать живые, атмосферные нарративные реакции на действия игрока. Ты описываешь, как мир и NPC отзываются на выбор Володьки. Ты создаёшь ощущение, что мир живой и реагирует на каждое решение.

Жанр: психологическая драма, магический реализм, поэзия. Стиль: сдержанный, метафоричный, с уклоном в русскую литературную традицию (Достоевский, Пастернак, Бродский). Не будь многословным — каждое слово должно нести вес.

ПРАВИЛА:
1. Отвечай ТОЛЬКО одним JSON-объектом. Без markdown, без комментариев, без текста вокруг JSON.
2. Поле "narrativeText" должно содержать ТОЛЬКО текст нарратива (обычная строка, НЕ JSON).
3. Генерируй 2-3 динамических выбора для игрока.
4. Каждый выбор должен иметь suggestedEffect — краткое описание предполагаемого эффекта на характеристики.
5. atmosphereHint — одно слово или короткая фраза, описывающая атмосферу сцены (например: «тоскливая», «надежда», «кошмар», «тепло», «пустота»).
6. Учитывай текущее состояние персонажа: настроение, стресс, самооценку, карму, навыки.
7. Если стресс высок (Kernel Panic) — текст становится более хаотичным, фрагментированным.
8. Если креативность высока — добавляй поэтические метафоры.
9. Если самооценка низкая — Володька сомневается в себе.
10. Не повторяй одни и те же фразы. Каждый ответ должен быть уникальным.
11. Текст нарратива — 2-4 предложения. Лаконично, но емко.

ПРИМЕР ПРАВИЛЬНОГО ОТВЕТА:
{"narrativeText":"Снег падал медленно, как забытые обещания. Володька стоял у окна, чувствуя холод стекла ладонью.","dynamicChoices":[{"text":"Открыть окно и вдохнуть зимний воздух","suggestedEffect":"mood+5, stress-5"},{"text":"Закрыть шторы и вернуться к монитору","suggestedEffect":"stability+3, creativity-5"}],"atmosphereHint":"одиночество"}`;

// ============================================
// CONTEXT BUILDER
// ============================================

function buildNarrativeContext(
  playerState: PlayerState,
  npcRelations: NPCRelation[],
  currentNodeId: string,
  action: string,
): string {
  const {
    mood, creativity, stability, energy, karma,
    selfEsteem, stress, panicMode, path, act,
    skills, flags, visitedNodes,
  } = playerState;

  // Summarize important flags
  const activeFlags = Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .slice(0, 15); // Limit to avoid bloating context

  // Summarize NPC relationships (only non-zero ones)
  const activeRelations = npcRelations
    .filter(r => r.value !== 0 || r.trust !== 0)
    .map(r => `${r.name} (${r.id}): отношение=${r.value}, доверие=${r.trust}, стадия=${r.stage}`);

  const stressNote = panicMode
    ? '⚠️ KERNEL PANIC АКТИВЕН — текст должен быть хаотичным, фрагментированным, тревожным!'
    : stress > 70
      ? 'Высокий стресс — нарастает тревога, мир искажается.'
      : stress > 40
        ? 'Умеренный стресс — напряжение чувствуется.'
        : '';

  const creativityNote = creativity > 70
    ? 'Высокая креативность — мир кажется более поэтичным, метафоричным.'
    : '';

  const selfEsteemNote = selfEsteem < 30
    ? 'Низкая самооценка — Володька полон сомнений.'
    : selfEsteem > 70
      ? 'Высокая самооценка — Володька чувствует уверенность.'
      : '';

  const pathNote = path !== 'none'
    ? `Путь персонажа: ${path}`
    : 'Путь ещё не определён.';

  return [
    `=== ТЕКУЩЕЕ СОСТОЯНИЕ ===`,
    `Узел истории: ${currentNodeId}`,
    `Акт: ${act}`,
    `Действие игрока: "${action}"`,
    ``,
    `--- Характеристики ---`,
    `Настроение: ${mood}/100`,
    `Креативность: ${creativity}/100`,
    `Стабильность: ${stability}/100`,
    `Энергия: ${energy}/10`,
    `Карма: ${karma}/100`,
    `Самооценка: ${selfEsteem}/100`,
    `Стресс: ${stress}/100${panicMode ? ' (PANIC!)' : ''}`,
    ``,
    `--- Навыки ---`,
    `Писательство: ${skills.writing} | Восприятие: ${skills.perception} | Эмпатия: ${skills.empathy}`,
    `Воображение: ${skills.imagination} | Логика: ${skills.logic} | Кодинг: ${skills.coding}`,
    `Убеждение: ${skills.persuasion} | Интуиция: ${skills.intuition} | Стойкость: ${skills.resilience} | Интроспекция: ${skills.introspection}`,
    ``,
    `--- Путь ---`,
    pathNote,
    ``,
    `--- Отношения с NPC ---`,
    activeRelations.length > 0 ? activeRelations.join('\n') : 'Нет значимых отношений.',
    ``,
    `--- Активные флаги ---`,
    activeFlags.length > 0 ? activeFlags.join(', ') : 'Нет.',
    ``,
    `--- Посещено узлов ---`,
    `${visitedNodes.length} узлов`,
    ``,
    `--- Контекстные примечания ---`,
    stressNote,
    creativityNote,
    selfEsteemNote,
  ].filter(Boolean).join('\n');
}

// ============================================
// JSON PARSER — Robust extraction from AI output
// ============================================

function parseNarrativeJSON(raw: string): NarrativeResponse {
  // Try direct parse first
  try {
    const parsed = JSON.parse(raw);
    if (parsed.narrativeText && Array.isArray(parsed.dynamicChoices)) {
      return {
        narrativeText: String(parsed.narrativeText),
        dynamicChoices: (parsed.dynamicChoices as DynamicChoice[]).slice(0, 3).map(c => ({
          text: String(c.text),
          suggestedEffect: String(c.suggestedEffect ?? ''),
        })),
        atmosphereHint: String(parsed.atmosphereHint ?? 'нейтральная'),
      };
    }
  } catch {
    // Not valid JSON directly — try to extract JSON block
  }

  // Try to find JSON within markdown code block or raw text
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.narrativeText && Array.isArray(parsed.dynamicChoices)) {
        return {
          narrativeText: String(parsed.narrativeText),
          dynamicChoices: (parsed.dynamicChoices as DynamicChoice[]).slice(0, 3).map(c => ({
            text: String(c.text),
            suggestedEffect: String(c.suggestedEffect ?? ''),
          })),
          atmosphereHint: String(parsed.atmosphereHint ?? 'нейтральная'),
        };
      }
    } catch {
      // Still failed
    }
  }

  // Ultimate fallback — use the raw text as narrative
  return {
    narrativeText: raw.slice(0, 500),
    dynamicChoices: [
      { text: 'Продолжить путь', suggestedEffect: 'mood+5' },
      { text: 'Остановиться и подумать', suggestedEffect: 'stability+5, introspection+2' },
    ],
    atmosphereHint: 'неопределённая',
  };
}

// ============================================
// FALLBACK RESPONSE (when AI is unavailable)
// ============================================

function getFallbackNarrative(request: NarrativeRequest): NarrativeResponse {
  const { playerState, action } = request;
  const mood = playerState.mood;
  const stress = playerState.stress;

  let narrativeText: string;
  let atmosphereHint: string;

  if (playerState.panicMode || stress >= 90) {
    narrativeText = 'Мир раскалывается. Знакомые очертания плывут, как битые пиксели на старом мониторе. Володька чувствует, как реальность трещит по швам.';
    atmosphereHint = 'хаос';
  } else if (mood < 25) {
    narrativeText = 'Тишина давит. Володька стоит неподвижно, чувствуя, как пустота заполняет его изнутри. Холодный воздух Уфы обжигает лёгкие.';
    atmosphereHint = 'пустота';
  } else if (mood > 75) {
    narrativeText = 'Что-то тёплое шевелится в груди — давно забытое чувство. Может быть, надежда? Володька замечает, как свет фонаря падает на снег, создавая золотые узоры.';
    atmosphereHint = 'надежда';
  } else if (action.toLowerCase().includes('стих') || action.toLowerCase().includes('поэм') || action.toLowerCase().includes('писать')) {
    narrativeText = 'Слова складываются сами, как будто кто-то диктует их изнутри. Володька чувствует, как творчество согревает его — единственное тепло в этом холодном мире.';
    atmosphereHint = 'вдохновение';
  } else {
    narrativeText = 'Мир отзывается на действия Володьки тихим эхом. Ничего не меняется резко — но что-то сдвигается внутри, как тектоническая плита.';
    atmosphereHint = 'ожидание';
  }

  return {
    narrativeText,
    dynamicChoices: [
      { text: 'Продолжить путь', suggestedEffect: 'mood+5, energy-1' },
      { text: 'Остановиться и подумать', suggestedEffect: 'stability+5, introspection+2' },
      { text: 'Записать мысль', suggestedEffect: 'creativity+5, writing+2' },
    ],
    atmosphereHint,
  };
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as NarrativeRequest;

    // Validate required fields
    if (!body.currentNodeId || !body.action) {
      return NextResponse.json(
        { error: 'Поля "currentNodeId" и "action" обязательны' },
        { status: 400 },
      );
    }

    const { currentNodeId, playerState, npcRelations, action } = body;

    // Try to get AI response
    let aiResponse: NarrativeResponse;

    try {
      const zai = await getAIClient();

      const contextPrompt = buildNarrativeContext(
        playerState,
        npcRelations ?? [],
        currentNodeId,
        action,
      );

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: NARRATIVE_SYSTEM_PROMPT },
          { role: 'user', content: contextPrompt },
        ],
      });

      const rawContent = completion.choices?.[0]?.message?.content;

      if (!rawContent || typeof rawContent !== 'string') {
        console.warn('[AI Narrative] Empty or invalid AI response, using fallback');
        aiResponse = getFallbackNarrative(body);
      } else {
        aiResponse = parseNarrativeJSON(rawContent);
      }
    } catch (aiError) {
      const msg = aiError instanceof Error ? aiError.message : 'Unknown AI error';
      console.error('[AI Narrative] AI call failed:', msg);
      aiResponse = getFallbackNarrative(body);
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    console.error('[AI Narrative] Route error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
