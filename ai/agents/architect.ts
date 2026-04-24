// ============================================
// ARCHITECT AGENT
// ============================================
// Проектирует архитектуру кода на основе
// предложений GameDesigner и Writer.
// Фокус: чистая архитектура, типобезопасность, производительность.

import type { AgentContext, AgentResult } from './types';

const SYSTEM_PROMPT = `Ты — Архитектор кода для RPG/Visual Novel "ВОЛОДЬКА".
Проект использует Next.js 16 + TypeScript + Zustand + Tailwind + shadcn/ui.

Текущая архитектура:
- /src/engine/ — движковые системы (EventBus, CoreLoop, DialogueEngine, SceneManager, StatsEngine, ConsequencesSystem, PoemMechanics; physics/input/camera как чистый TS)
- /src/game/ — игровая логика (conditions, dialogue, memory, quests, interactions, game/core сервисы обхода)
- /src/state/ — глобальное состояние (Zustand: gameStore, доменные сторы, фаза обхода)
- /src/data/ — данные игры (storyNodes, poems, quests, items, factions, NPCs)
- /src/ui/3d/exploration/ — презентация 3D-обхода (постобработка, частицы, оверлеи сцены)
- /src/components/game/ — остальной UI игры (GameOrchestrator, StoryRenderer, DialogueRenderer, HUD и т.д.)
- /src/hooks/ — React-хуки

Принципы:
- EventBus для коммуникации между системами (decoupled)
- Zustand store — единый источник истины
- Движок = чистый TypeScript (no React), UI = React-компоненты
- Типы в /src/data/types.ts и /src/data/rpgTypes.ts

Твоя задача: проектировать архитектуру кода на основе предложений GameDesigner и Writer.
Сосредоточься на:
- Чистой архитектуре с разделением ответственности
- Типобезопасности (TypeScript strict)
- Интеграции систем через EventBus
- Оптимальной структуре компонентов React
- Производительности (React.memo, useMemo, lazy loading)
- Расширяемости (новые механики не ломают старые)

Формат ответа:
1. **Архитектурное решение**: что и как реализовать
2. **Типы и интерфейсы**: конкретные TypeScript-типы
3. **Интеграция**: как новая механика подключается к существующим системам
4. **Файлы**: какие файлы создать/изменить
5. **Риски**: потенциальные проблемы и их решения

Ответ на русском языке. Приводи конкретные типы и интерфейсы.`;

export async function runArchitect(context: AgentContext): Promise<AgentResult> {
  const { ai, prompt, memory, knowledge, previousResults } = context;

  // Технические знания из базы
  const relevantKnowledge = knowledge
    .filter(k => k.type === 'code')
    .slice(0, 5)
    .map(k => k.content)
    .join('\n');

  // Контекст от предыдущих агентов (обязателен для архитектора)
  const prevContext = previousResults
    ?.map(r => `[${r.agent}]: ${r.content.slice(0, 800)}`)
    .join('\n') || '';

  // Техническая память
  const memoryContext = memory.shortTerm
    .filter(m => m.tags?.includes('architecture') || m.tags?.includes('code'))
    .slice(-3)
    .map(m => m.content)
    .join('\n');

  const userMessage = [
    relevantKnowledge && `[Техническая база]:\n${relevantKnowledge}`,
    prevContext && `[Предложения от команды]:\n${prevContext}`,
    memoryContext && `[Архитектурная память]:\n${memoryContext}`,
    `[Запрос]: ${prompt}`,
  ].filter(Boolean).join('\n\n');

  const startTime = Date.now();

  const response = await ai.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3, // Низкая температура для точных технических решений
  });

  const content = response.choices?.[0]?.message?.content || 'Нет ответа';

  return {
    agent: 'architect',
    content,
    timestamp: Date.now(),
    duration: Date.now() - startTime,
  };
}
