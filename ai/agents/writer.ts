// ============================================
// WRITER AGENT
// ============================================
// Пишет диалоги, нарратив, описания сцен,
// интегрирует стихи в игровой процесс.
// Стихи НЕИЗМЕНЯЕМЫ — нельзя менять ни ритм, ни рифму.

import type { AgentContext, AgentResult } from './types';

const SYSTEM_PROMPT = `Ты — Писатель для RPG/Visual Novel "ВОЛОДЬКА".
Ты работаешь с реальными стихами Владимира Лебедева. Стихи НЕИЗМЕНЯЕМЫ — нельзя менять ни ритм, ни рифму, ни лексику.

Твоя задача: писать диалоги, нарративные вставки, описания сцен и интегрировать стихи в игровой процесс.
Сосредоточься на:
- Эмоциональной глубине и честности повествования
- Диалогах, которые раскрывают персонажей
- Сценах, где стихи естественно вплетаются в сюжет
- Атмосфере одиночества, но с лучами надежды
- Реалистичном изображении жизни IT-специалиста
- Моральных дилеммах без правильного ответа
- Внутренних монологах как окне в душу персонажа

Формат ответа:
1. **Тип контента**: диалог / нарратив / описание сцены / монолог
2. **Контекст**: где и когда это происходит (сцена, акт)
3. **Текст**: сам контент с разметкой
4. **Выборы**: если есть — варианты для игрока с эффектами
5. **Связь со стихами**: если стихи вплетены — какие именно и как

Ответ на русском языке. Пиши литературно, но без пафоса. Честно — как жизнь.`;

export async function runWriter(context: AgentContext): Promise<AgentResult> {
  const { ai, prompt, memory, knowledge, previousResults } = context;

  // Из базы — сюжетные и сценические знания
  const relevantKnowledge = knowledge
    .filter(k => k.type === 'story' || k.type === 'scene')
    .slice(0, 5)
    .map(k => k.content)
    .join('\n');

  // Контекст от предыдущих агентов
  const prevContext = previousResults
    ?.map(r => `[${r.agent}]: ${r.content.slice(0, 500)}`)
    .join('\n') || '';

  // Память — последние творческие решения
  const memoryContext = memory.shortTerm
    .filter(m => m.tags?.includes('narrative') || m.tags?.includes('dialogue'))
    .slice(-3)
    .map(m => m.content)
    .join('\n');

  const userMessage = [
    relevantKnowledge && `[База знаний]:\n${relevantKnowledge}`,
    prevContext && `[Контекст от других агентов]:\n${prevContext}`,
    memoryContext && `[Творческая память]:\n${memoryContext}`,
    `[Запрос]: ${prompt}`,
  ].filter(Boolean).join('\n\n');

  const startTime = Date.now();

  const response = await ai.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.8, // Повышенная креативность для писателя
  });

  const content = response.choices?.[0]?.message?.content || 'Нет ответа';

  return {
    agent: 'writer',
    content,
    timestamp: Date.now(),
    duration: Date.now() - startTime,
  };
}
