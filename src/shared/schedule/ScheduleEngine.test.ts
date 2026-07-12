import { describe, expect, it, beforeEach } from 'vitest';
import { sceneMatchesScheduleEntry } from '@/config/sceneInheritance';
import { getNPCsInScene, resetScheduleEngineCache } from '@/shared/schedule/ScheduleEngine';
import { hashScheduleContext, type ScheduleContext } from '@/shared/scheduleContext';

const BASE_CTX: ScheduleContext = {
  currentAct: 2,
  completedQuestIds: new Set(),
  activeFlagKeys: new Set(),
  playerFlags: {},
};

describe('ScheduleEngine scene variant integration', () => {
  beforeEach(() => {
    resetScheduleEngineCache();
  });

  it('matches parent schedule entries when player is in a variant scene', () => {
    expect(sceneMatchesScheduleEntry('pier_evening', 'river_pier')).toBe(true);
    expect(sceneMatchesScheduleEntry('river_pier', 'pier_evening')).toBe(false);
    expect(sceneMatchesScheduleEntry('city_square', 'street_night')).toBe(true);
  });

  it('spawns Trofim on pier_evening via river_pier schedule', () => {
    const ctxHash = hashScheduleContext(BASE_CTX);
    expect(ctxHash).toBeTruthy();

    const eveningNpcIds = getNPCsInScene('pier_evening', 20, BASE_CTX);
    expect(eveningNpcIds).toContain('fisherman_trofim');

    const dayNpcIds = getNPCsInScene('pier_evening', 10, BASE_CTX);
    expect(dayNpcIds).toContain('fisherman_trofim');
  });

  it('spawns story NPCs registered for extension scenes', () => {
    expect(getNPCsInScene('city_square', 12, BASE_CTX)).toContain('street_poet');
    expect(getNPCsInScene('abandoned_factory', 12, { ...BASE_CTX, currentAct: 5 })).toContain(
      'baba_zina',
    );
    expect(
      getNPCsInScene('underground_bunker', 12, { ...BASE_CTX, currentAct: 6 }),
    ).toContain('guild_defector');
  });

  it('places Zeka on factory_roof during act 6 lookout', () => {
    const act6Ctx: ScheduleContext = {
      ...BASE_CTX,
      currentAct: 6,
      playerFlags: { zeka_trusted: true },
      activeFlagKeys: new Set(['zeka_trusted']),
    };
    const npcIds = getNPCsInScene('factory_roof', 14, act6Ctx);
    expect(npcIds).toContain('zeka');
  });
});
