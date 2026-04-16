// ============================================
// ОБЩИЕ ТИПЫ ДЛЯ AI-АГЕНТОВ
// ============================================

export interface KnowledgeEntry {
  type: 'scene' | 'mechanic' | 'story' | 'code';
  content: string;
  tags: string[];
}

export interface MemoryEntry {
  role: 'agent' | 'user';
  agentName?: string;
  content: string;
  timestamp: number;
  tags?: string[];
}

export interface MemoryState {
  shortTerm: MemoryEntry[];
  longTerm: MemoryEntry[];
}

export interface AgentContext {
  ai: {
    chat: {
      completions: {
        create: (params: {
          messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
          temperature?: number;
          max_tokens?: number;
        }) => Promise<{
          choices: Array<{
            message: { content: string };
          }>;
        }>;
      };
    };
  };
  prompt: string;
  memory: MemoryState;
  knowledge: KnowledgeEntry[];
  previousResults?: AgentResult[];
}

export interface AgentResult {
  agent: string;
  content: string;
  timestamp: number;
  duration: number;
}

export interface PipelineResult {
  prompt: string;
  results: AgentResult[];
  totalDuration: number;
  error?: string;
}
