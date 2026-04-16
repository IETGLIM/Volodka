// ============================================
// CONTEXT BUILDER — Строит контекст для AI-запросов
// ============================================
// Стандартизирует формат промптов, добавляет
// состояние игры, NPC-отношения, флаги, стресс.

import type { PlayerState, NPCRelation } from '@/shared/types/game';
import type { NarrativeRequest, DialogueRequest } from './types';

// ============================================
// NARRATIVE CONTEXT BUILDER
// ============================================

export function buildNarrativeContext(request: NarrativeRequest): string {
  const { playerState, npcRelations, action, flags } = request;

  const stressNote = playerState.panicMode
    ? 'KERNEL PANIC! Критический уровень стресса. Мысли путаются, мир раскалывается.'
    : playerState.stress > 75
    ? 'Стресс очень высокий. Восприятие искажено.'
    : playerState.stress > 50
    ? 'Стресс ощутимый. Напряжение чувствуется.'
    : '';

  const creativityNote = playerState.creativity > 70
    ? 'Творческий подъём! Слова льются сами.'
    : playerState.creativity < 20
    ? 'Творческий спад. Слова не приходят.'
    : '';

  const selfEsteemNote = playerState.selfEsteem < 25
    ? 'Самооценка критически низкая. Говорить с людьми почти невозможно.'
    : playerState.selfEsteem > 60
    ? 'Уверенность в себе. Можно решиться на многое.'
    : '';

  const relevantFlags = flags
    ? Object.entries(flags)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ')
    : 'нет';

  const npcContext = npcRelations
    .filter((r) => Math.abs(r.value) > 10)
    .map((r) => `${r.name}: ${r.value > 0 ? '+' : ''}${r.value} (${r.stage})`)
    .join('; ');

  return `Игрок: Володька, ${playerState.act}-й акт, путь "${playerState.path}"
Настроение: ${playerState.mood}/100 | Креативность: ${playerState.creativity}/100 | Стабильность: ${playerState.stability}/100
Энергия: ${playerState.energy}/10 | Карма: ${playerState.karma}/100 | Самооценка: ${playerState.selfEsteem}/100
Стресс: ${playerState.stress}/100${playerState.panicMode ? ' (PANIC!)' : ''}
${stressNote} ${creativityNote} ${selfEsteemNote}
Флаги: ${relevantFlags}
NPC: ${npcContext || 'нет значимых отношений'}
Действие: ${action}`;
}

// ============================================
// DIALOGUE CONTEXT BUILDER
// ============================================

export function buildDialogueContext(request: DialogueRequest): string {
  const { npcId, npcName, playerState, npcRelations, dialogueHistory, currentTopic } = request;

  const npcRelation = npcRelations.find((r) => r.id === npcId);
  const relationText = npcRelation
    ? `Отношения: ${npcRelation.value}/100 (${npcRelation.stage}), доверие: ${npcRelation.trust}, уважение: ${npcRelation.respect}`
    : 'Отношения: нет данных';

  const stressModifier = playerState.stress > 70
    ? 'Стресс мешает говорить. Мысли путаются.'
    : playerState.stress > 50
    ? 'Стресс ощутим. Трудно сосредоточиться.'
    : '';

  const selfEsteemModifier = playerState.selfEsteem < 25
    ? 'Самооценка слишком низкая — трудно говорить уверенно.'
    : '';

  const historyText = dialogueHistory.length > 0
    ? dialogueHistory
        .slice(-10)
        .map((h) => `${h.speaker}: ${h.text}`)
        .join('\n')
    : 'История пуста';

  return `NPC: ${npcName} (${npcId})
${relationText}
Тема: ${currentTopic}
Стресс: ${playerState.stress}/100 | Самооценка: ${playerState.selfEsteem}/100 | Настроение: ${playerState.mood}/100
${stressModifier} ${selfEsteemModifier}
История диалога:
${historyText}`;
}
