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
  getVaultBackupTrialHint: () => 'Вернись в офис IT-гильдии — коллега знает про Хранилище',
  getNetworkInitiationHint: () => 'Виктория ждёт для посвящения — ищи её на улице или в кафе',
  getSolnyshSpineHint: () => 'Солныш в коридоре или в своей комнате — найди её и поговори',
}));

vi.mock('@/engine/guidedStory/act23QuestHints', () => ({
  getCafeSafehouseHint: () => 'Иди в кафе «Синяя яма» — бариста может дать явочную',
  getDmitryDefectionHint: () => 'Дмитрий в офисе гильдии — время ограничено, иди туда',
  getBasementHumHint: () => 'Ключ Трофима открывает подвал «Хрома-М» — иди на завод',
  getZaremaRescueHint: () => 'Блок задержания в гильдии — стих «Прорыв» открывает путь',
  getMariaTruthHint: () => 'Бариста в «Синей яме» знает больше, чем кажется',
  getVaultKeyFragmentsHint: () => 'Фрагмент гильдии — в офисе IT. Иди туда',
  getPoetrySmugglingHint: () => 'Стихи ждут в библиотеке — зайди тихо',
  getPierWatchmanKeyHint: () => 'Трофим на пирсе №3 — иди к воде',
  getVaultDefenseHint: () => 'Без фаервола Хранилище обречено — установи защиту',
  getThreadOf18LinesHint: () => 'Мемориал в парке — след Великого Сбоя 2029',
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

  it('prefers vault_backup_trial live cue', () => {
    expect(buildQuestJournalContextualHint('vault_backup_trial', 'street_night')).toContain(
      'Хранилище',
    );
  });

  it('prefers network_initiation live cue', () => {
    expect(buildQuestJournalContextualHint('network_initiation', 'volodka_room')).toContain(
      'Виктория',
    );
  });

  it('prefers solnysh spine live cue', () => {
    expect(buildQuestJournalContextualHint('solnysh_comfort', 'street_night')).toContain(
      'Солныш',
    );
  });

  it('prefers cafe_safehouse live cue', () => {
    expect(buildQuestJournalContextualHint('cafe_safehouse', 'street_night')).toContain('явочную');
  });

  it('prefers dmitry_defection live cue', () => {
    expect(buildQuestJournalContextualHint('dmitry_defection', 'volodka_room')).toContain('Дмитрий');
  });

  it('prefers basement_hum live cue', () => {
    expect(buildQuestJournalContextualHint('basement_hum', 'street_night')).toContain('завод');
  });

  it('prefers zarema_rescue live cue', () => {
    expect(buildQuestJournalContextualHint('zarema_rescue', 'street_night')).toContain('Прорыв');
  });

  it('prefers maria_truth live cue', () => {
    expect(buildQuestJournalContextualHint('maria_truth', 'volodka_room')).toContain('яме');
  });

  it('prefers vault_key_fragments live cue', () => {
    expect(buildQuestJournalContextualHint('vault_key_fragments', 'street_night')).toContain('офис');
  });

  it('prefers poetry_smuggling live cue', () => {
    expect(buildQuestJournalContextualHint('poetry_smuggling', 'street_night')).toContain('библиотек');
  });

  it('prefers pier_watchman_key live cue', () => {
    expect(buildQuestJournalContextualHint('pier_watchman_key', 'street_night')).toContain('пирс');
  });

  it('prefers vault_defense live cue', () => {
    expect(buildQuestJournalContextualHint('vault_defense', 'street_night')).toContain('фаервол');
  });

  it('prefers thread_of_18_lines live cue', () => {
    expect(buildQuestJournalContextualHint('thread_of_18_lines', 'street_night')).toContain('парке');
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
