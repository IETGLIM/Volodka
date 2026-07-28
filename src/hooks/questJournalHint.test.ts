import { describe, expect, it, vi } from 'vitest';
import {
  buildQuestJournalContextualHint,
  buildQuestJournalRouteCta,
} from '@/hooks/questJournalHint';

vi.mock('@/engine/guidedStory/firstReadingHint', () => ({
  getFirstReadingHint: () => 'Подойди к рабочему столу и нажми [E]',
}));

vi.mock('@/engine/guidedStory/act1QuestHints', () => ({
  getMariaConnectionHint: () => 'Выйди на ночную улицу — Виктория сама тебя найдёт',
  getIncidentScrollHint: () => 'Иди в офис IT-гильдии — Александр ждёт у инцидента #4729',
  getPoetryCollectionHint: () => 'Следующий стих: Рабочий стол',
}));

vi.mock('@/store/questStore', () => ({
  getNextTrackedObjective: (questId: string) =>
    questId === 'side_demo'
      ? { objectiveId: 'o1', description: 'Поговори с Катей' }
      : null,
  getQuestMarker: (questId: string) =>
    questId === 'side_demo' || questId === 'maria_connection'
      ? { sceneId: 'library_day' as const, position: [0, 0, 0] as [number, number, number] }
      : null,
}));

vi.mock('@/config/scenes', () => ({
  getSceneConfig: (id: string) => ({ id, name: id === 'library_day' ? 'Библиотека' : id }),
}));

describe('buildQuestJournalContextualHint', () => {
  it('prefers first_reading live cue', () => {
    expect(buildQuestJournalContextualHint('first_reading', 'volodka_room')).toBe(
      'Подойди к рабочему столу и нажми [E]',
    );
  });

  it('prefers maria_connection live cue', () => {
    expect(buildQuestJournalContextualHint('maria_connection', 'volodka_room')).toContain(
      'Виктория',
    );
  });

  it('prefers incident_scroll live cue', () => {
    expect(buildQuestJournalContextualHint('incident_scroll_4729', 'street_night')).toContain(
      'офис',
    );
  });

  it('prefers poetry_collection live cue', () => {
    expect(buildQuestJournalContextualHint('poetry_collection', 'volodka_room')).toContain(
      'стих',
    );
  });

  it('combines next objective with travel direction', () => {
    const hint = buildQuestJournalContextualHint('side_demo', 'volodka_room');
    expect(hint).toContain('Поговори с Катей');
    expect(hint).toMatch(/Перейдите:/);
  });
});

describe('buildQuestJournalRouteCta', () => {
  it('returns route CTA when marker is off-scene', () => {
    expect(buildQuestJournalRouteCta('side_demo', 'volodka_room')).toBe('Маршрут → Библиотека');
  });

  it('returns null when already on marker scene', () => {
    expect(buildQuestJournalRouteCta('side_demo', 'library_day')).toBeNull();
  });
});
