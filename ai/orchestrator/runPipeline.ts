// ============================================
// PIPELINE ORCHESTRATOR
// ============================================
// Управляет запуском 4 AI-агентов:
// GameDesigner → Writer → Architect → Reviewer
// С памятью, знаниями и контекстной передачей.

import { runGameDesigner } from '../agents/gameDesigner';
import { runWriter } from '../agents/writer';
import { runArchitect } from '../agents/architect';
import { runReviewer } from '../agents/reviewer';
import { saveAgentResultToMemory, getFullMemoryState } from '../memory';
import { searchKnowledge } from '../knowledge/knowledgeBase';
import type { AgentContext, AgentResult, PipelineResult, KnowledgeEntry } from '../agents/types';

// ============================================
// ТИПЫ
// ============================================

interface PipelineConfig {
  /** Массив агентов для запуска (по умолчанию все 4) */
  agents?: Array<'gameDesigner' | 'writer' | 'architect' | 'reviewer'>;
  /** Ограничение времени на одного агента (мс) */
  agentTimeout?: number;
  /** Сохранять ли результаты в память */
  saveToMemory?: boolean;
  /** Важность для долгосрочной памяти (0-1) */
  memoryImportance?: number;
  /** Теги для памяти */
  memoryTags?: string[];
}

// ============================================
// АГЕНТ-РАННЕР
// ============================================

type AgentRunner = (context: AgentContext) => Promise<AgentResult>;

const AGENT_RUNNERS: Record<string, AgentRunner> = {
  gameDesigner: runGameDesigner,
  writer: runWriter,
  architect: runArchitect,
  reviewer: runReviewer,
};

// Теги по умолчанию для каждого агента
const AGENT_TAGS: Record<string, string[]> = {
  gameDesigner: ['mechanics', 'game-design'],
  writer: ['narrative', 'dialogue'],
  architect: ['architecture', 'code'],
  reviewer: ['review', 'quality'],
};

// Важность по умолчанию
const AGENT_IMPORTANCE: Record<string, number> = {
  gameDesigner: 0.7,
  writer: 0.8,
  architect: 0.6,
  reviewer: 0.5,
};

// ============================================
// ЗАПУСК PIPELINE
// ============================================

export async function runPipeline(
  ai: AgentContext['ai'],
  prompt: string,
  config: PipelineConfig = {}
): Promise<PipelineResult> {
  const {
    agents = ['gameDesigner', 'writer', 'architect', 'reviewer'],
    saveToMemory = true,
    memoryImportance = 0.5,
    memoryTags = [],
  } = config;

  const pipelineStart = Date.now();
  const results: AgentResult[] = [];

  // Получаем текущее состояние памяти
  const memory = getFullMemoryState();

  // Получаем релевантные знания из базы
  const knowledge = searchKnowledge(prompt, 8);

  for (const agentName of agents) {
    const runner = AGENT_RUNNERS[agentName];
    if (!runner) {
      results.push({
        agent: agentName,
        content: `Неизвестный агент: ${agentName}`,
        timestamp: Date.now(),
        duration: 0,
      });
      continue;
    }

    try {
      const context: AgentContext = {
        ai,
        prompt,
        memory,
        knowledge,
        previousResults: results,
      };

      const result = await runner(context);
      results.push(result);

      // Сохраняем в память
      if (saveToMemory) {
        const tags = [...memoryTags, ...AGENT_TAGS[agentName]];
        const importance = AGENT_IMPORTANCE[agentName] || memoryImportance;
        saveAgentResultToMemory(agentName, result.content, tags, importance);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        agent: agentName,
        content: `Ошибка: ${errMsg}`,
        timestamp: Date.now(),
        duration: 0,
      });
    }
  }

  return {
    prompt,
    results,
    totalDuration: Date.now() - pipelineStart,
  };
}
