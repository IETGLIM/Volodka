import { getDominantEmotion, hasMemory } from '@/core/memory/memoryQueries';
import type { MemoryEmotion } from '@/core/memory/types';
import { getRelationshipScore } from '@/core/memory/relationshipAccess';

function parseHasMemory(part: string): boolean | null {
  const m = /hasMemory\s*\(\s*"([^"]+)"\s*\)/.exec(part);
  if (!m) return null;
  return hasMemory(m[1]);
}

function parseRelationshipCompare(part: string): boolean | null {
  const m = /relationship\s*\(\s*([^)]+?)\s*\)\s*([><=]+)\s*(\d+)/.exec(part);
  if (!m) return null;
  const entityId = m[1].trim().replace(/^["']|["']$/g, '');
  const op = m[2].trim();
  const rhs = Number(m[3]);
  const lhs = getRelationshipScore(entityId);
  if (op === '>') return lhs > rhs;
  if (op === '>=') return lhs >= rhs;
  if (op === '<') return lhs < rhs;
  if (op === '<=') return lhs <= rhs;
  if (op === '===' || op === '==') return lhs === rhs;
  return null;
}

function parseDominantEmotion(part: string): boolean | null {
  const m = /dominantEmotion\s*===\s*"([^"]+)"/.exec(part);
  if (!m) return null;
  return getDominantEmotion() === (m[1] as MemoryEmotion);
}

function evalClause(clause: string): boolean {
  const t = clause.trim();
  const a = parseHasMemory(t);
  if (a !== null) return a;
  const b = parseRelationshipCompare(t);
  if (b !== null) return b;
  const c = parseDominantEmotion(t);
  if (c !== null) return c;
  return false;
}

/**
 * Простые нарративные условия без изменения `DialogueEngine`.
 * Поддержка: `hasMemory("tag")`, `relationship(entityId) > 40`, `dominantEmotion === "sad"`, связки `&&`.
 */
export function checkDialogueCondition(condition: string): boolean {
  const expr = condition.trim();
  if (!expr) return true;
  const andParts = expr.split('&&').map((s) => s.trim());
  return andParts.every((p) => {
    if (/\|\|/.test(p)) {
      return p.split('||').map((s) => s.trim()).some(evalClause);
    }
    return evalClause(p);
  });
}
