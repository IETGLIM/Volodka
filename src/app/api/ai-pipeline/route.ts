// ============================================
// AI PIPELINE — Бэкендный API-маршрут
// ============================================
// Запускает AI-агентов через модульный pipeline:
// GameDesigner → Writer → Architect → Reviewer
// С памятью (short+long term), базой знаний,
// контекстной передачей между агентами.
// Использует z-ai-web-dev-sdk (backend only!)

import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '../../../../ai/orchestrator/runPipeline';
import { searchKnowledge, addKnowledge } from '../../../../ai/knowledge/knowledgeBase';
import { clearShortTermMemory } from '../../../../ai/memory/shortTerm';
import { clearLongTermMemory, exportLongTermMemory, importLongTermMemory } from '../../../../ai/memory/longTerm';

// Динамический импорт z-ai-web-dev-sdk (только на сервере)
async function getAIClient() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  return await ZAI.create();
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      context,
      agents,
      saveToMemory = true,
      memoryImportance = 0.5,
      memoryTags = [],
      // Управление памятью
      clearMemory,
      exportMemory,
      importMemoryData,
      // Управление знаниями
      addKnowledgeEntries,
    } = body as {
      prompt?: string;
      context?: string;
      agents?: Array<'gameDesigner' | 'writer' | 'architect' | 'reviewer'>;
      saveToMemory?: boolean;
      memoryImportance?: number;
      memoryTags?: string[];
      clearMemory?: boolean;
      exportMemory?: boolean;
      importMemoryData?: string;
      addKnowledgeEntries?: Array<{ type: 'scene' | 'mechanic' | 'story' | 'code'; content: string; tags: string[] }>;
    };

    // ---- Управление памятью ----
    if (clearMemory) {
      clearShortTermMemory();
      clearLongTermMemory();
      return NextResponse.json({ status: 'memory_cleared' });
    }

    if (exportMemory) {
      const data = exportLongTermMemory();
      return NextResponse.json({ memory: data });
    }

    if (importMemoryData) {
      importLongTermMemory(importMemoryData);
      return NextResponse.json({ status: 'memory_imported' });
    }

    // ---- Управление знаниями ----
    if (addKnowledgeEntries && addKnowledgeEntries.length > 0) {
      addKnowledgeBatch(addKnowledgeEntries);
      return NextResponse.json({ status: 'knowledge_added', count: addKnowledgeEntries.length });
    }

    // ---- Основной pipeline ----
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Поле "prompt" обязательно (или используйте параметры управления памятью/знаниями)' },
        { status: 400 }
      );
    }

    const zai = await getAIClient();

    // Адаптер для совместимости с AgentContext
    const aiClient = {
      chat: {
        completions: {
          create: zai.chat.completions.create.bind(zai.chat.completions),
        },
      },
    };

    const result = await runPipeline(aiClient, prompt, {
      agents,
      saveToMemory,
      memoryImportance,
      memoryTags,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    console.error('[AI Pipeline] Error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Вспомогательная функция для добавления знаний батчем
function addKnowledgeBatch(entries: Array<{ type: 'scene' | 'mechanic' | 'story' | 'code'; content: string; tags: string[] }>) {
  for (const entry of entries) {
    addKnowledge(entry);
  }
}
