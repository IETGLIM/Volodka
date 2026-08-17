import { describe, expect, it, vi } from 'vitest';

const { buildNPCStatesForTimeMock } = vi.hoisted(() => ({
  buildNPCStatesForTimeMock: vi.fn(() => ({
    npc_a: { position: [1, 0, 2] as [number, number, number], sceneId: 'volodka_room' },
  })),
}));

vi.mock('@/shared/schedule/ScheduleEngine', () => ({
  buildNPCStatesForTime: buildNPCStatesForTimeMock,
}));

import { buildWorldHourChangedPayload } from './syncWorldSchedule';

describe('buildWorldHourChangedPayload', () => {
  it('rebuilds NPC states into a world:hour_changed payload', () => {
    buildNPCStatesForTimeMock.mockClear();
    const ctx = {} as never;
    const payload = buildWorldHourChangedPayload(14, 13.5, ctx);

    expect(buildNPCStatesForTimeMock).toHaveBeenCalledWith(14, ctx);
    expect(payload).toEqual({
      hour: 14,
      previousHour: 13.5,
      npcStates: {
        npc_a: { position: [1, 0, 2], sceneId: 'volodka_room' },
      },
    });
  });
});
