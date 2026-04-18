// ============================================
// AI STREAMING API — Edge-optimized streaming
// ============================================
// POST /api/ai-stream?type=narrative|dialogue
// Streams AI responses using ReadableStream.
// Compatible with Vercel Edge Functions.

import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

// ============================================
// LAZY AI CLIENT
// ============================================

async function getAIClient() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  return await ZAI.create();
}

// ============================================
// STREAMING HELPER
// ============================================

function createStreamingResponse(aiPromise: Promise<string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await aiPromise;
        // Send as SSE-style chunk
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: result })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'AI error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// ============================================
// NARRATIVE STREAM
// ============================================

async function generateNarrative(body: Record<string, unknown>): Promise<string> {
  const zai = await getAIClient();
  const { currentNodeId, action, playerState } = body as {
    currentNodeId: string;
    action: string;
    playerState: Record<string, unknown>;
  };

  const mood = (playerState?.mood as number) ?? 50;
  const stress = (playerState?.stress as number) ?? 0;
  const creativity = (playerState?.creativity as number) ?? 30;

  const systemPrompt = `Ты — нарративный директор психологической RPG "Володька". Стиль: Достоевский + Бродский. Отвечай ТОЛЬКО в JSON формате: {"narrativeText": "...", "dynamicChoices": [...], "atmosphereHint": "..."}. 2-4 предложения. Русский язык.`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Узел: ${currentNodeId} | Действие: ${action} | Настроение: ${mood} | Стресс: ${stress} | Креативность: ${creativity}`,
      },
    ],
  });

  return (
    completion.choices?.[0]?.message?.content ||
    '{"narrativeText":"Мир тихо отзывается.","dynamicChoices":[],"atmosphereHint":"ожидание"}'
  );
}

// ============================================
// DIALOGUE STREAM
// ============================================

async function generateDialogue(body: Record<string, unknown>): Promise<string> {
  const zai = await getAIClient();
  const { npcId, npcName, playerState, dialogueHistory, currentTopic } = body as {
    npcId: string;
    npcName: string;
    playerState: Record<string, unknown>;
    dialogueHistory: Array<{ speaker: string; text: string }>;
    currentTopic: string;
  };

  const mood = (playerState?.mood as number) ?? 50;
  const stress = (playerState?.stress as number) ?? 0;

  const systemPrompt = `Ты — NPC "${npcName}" в RPG "Володька". Говори в своём стиле. Отвечай ТОЛЬКО в JSON: {"npcResponse": "...", "playerChoices": [...], "relationshipHint": "..."}. Русский язык.`;

  const historyLines = (dialogueHistory || [])
    .slice(-5)
    .map((h: { speaker: string; text: string }) => `${h.speaker}: ${h.text}`)
    .join('\n');

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Тема: ${currentTopic} | Настроение: ${mood} | Стресс: ${stress}\nИстория:\n${historyLines}`,
      },
    ],
  });

  return (
    completion.choices?.[0]?.message?.content ||
    `{"npcResponse":"${npcName} смотрит на тебя.","playerChoices":[{"text":"Продолжить","mood":"нейтрально"}],"relationshipHint":"без изменений"}`
  );
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const type = (body.type as string) || 'narrative';

    const aiPromise = type === 'dialogue'
      ? generateDialogue(body)
      : generateNarrative(body);

    return createStreamingResponse(aiPromise);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка стриминга';
    console.error('[AI Stream] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
