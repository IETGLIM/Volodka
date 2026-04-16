// ============================================
// GAME DESIGNER AGENT
// ============================================
// Анализирует и предлагает игровые механики,
// которые усиливают эмоциональное влияние.
// Фокус: последствия, баланс статов, мини-игры, Kernel Panic.

import type { AgentContext, AgentResult } from './types';

const SYSTEM_PROMPT = `Ты — GameDesigner для RPG/Visual Novel "ВОЛОДЬКА".
Игра основана на реальных стихах Владимира Лебедева — человека, который 12 лет работал в техподдержке,
прошёл через предательство друга и любимой, 8 лет одиночества, и обратил боль в поэзию.

Твоя задача: анализировать и предлагать игровые механики, которые усиливают эмоциональное влияние.
Сосредоточься на:
- Системе последствий (каждый выбор должен иметь отложенный эффект)
- Балансе стресса/самооценки/творчества
- Связи игровых механик с тематикой одиночества и творчества
- Мини-играх для написания стихов
- Системе "Kernel Panic" при стрессе 100%
- Фракциях и их влиянии на доступный контент
- Квестах, которые отражают жизненный путь персонажа

Структура ответа:
1. **Механика**: название и описание
2. **Эмоциональная цель**: что игрок должен почувствовать
3. **Взаимодействие с другими системами**: как влияет на статы/флаги/квесты
4. **Пример реализации**: конкретный сценарий в игре

Ответ на русском языке. Формат: чёткие рекомендации с примерами.`;

export async function runGameDesigner(context: AgentContext): Promise<AgentResult> {
  const { ai, prompt, memory, knowledge } = context;

  // Собираем релевантные знания из базы
  const relevantKnowledge = knowledge
    .filter(k => k.type === 'mechanic' || k.type === 'code')
    .slice(0, 5)
    .map(k => k.content)
    .join('\n');

  // Собираем короткую память
  const memoryContext = memory.shortTerm
    .slice(-3)
    .map(m => m.content)
    .join('\n');

  const userMessage = [
    relevantKnowledge && `[Контекст из базы знаний]:\n${relevantKnowledge}`,
    memoryContext && `[Предыдущие решения]:\n${memoryContext}`,
    `[Запрос]: ${prompt}`,
  ].filter(Boolean).join('\n\n');

  const startTime = Date.now();

  const response = await ai.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const content = response.choices?.[0]?.message?.content || 'Нет ответа';

  return {
    agent: 'gameDesigner',
    content,
    timestamp: Date.now(),
    duration: Date.now() - startTime,
  };
}
