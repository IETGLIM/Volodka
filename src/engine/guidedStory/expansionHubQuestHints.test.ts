import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getCafeOfficeRelayHint,
  getExpansionHubQuestHint,
  getNightCityWatchHint,
  getPierCafeFrequencyHint,
  getStreetChkSamizdatHint,
} from './expansionHubQuestHints';

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: vi.fn(),
}));

import { getGameSnapshot } from '@/engine/GameActionDispatcher';

const mockSnapshot = getGameSnapshot as ReturnType<typeof vi.fn>;

describe('expansionHubQuestHints', () => {
  beforeEach(() => {
    mockSnapshot.mockReset();
  });

  it('guides cafe relay before envelope pickup', () => {
    mockSnapshot.mockReturnValue({
      quests: [
        {
          questId: 'act2_cafe_office_relay',
          status: 'active',
          objectives: {
            hear_relay_brief: false,
            take_cafe_envelope: false,
            cross_street_with_envelope: false,
            enter_office_with_envelope: false,
            deliver_office_envelope: false,
            read_relay_second_sheet: false,
          },
        },
      ],
    });
    expect(getCafeOfficeRelayHint('cafe_evening')).toContain('Бариста');
    expect(getCafeOfficeRelayHint('office_day')).toContain('«Синяя яма»');
  });

  it('guides samizdat delivery at CHK campfire', () => {
    mockSnapshot.mockReturnValue({
      quests: [
        {
          questId: 'act2_street_chk_samizdat',
          status: 'active',
          objectives: {
            meet_zarema_bench: true,
            receive_samizdat: true,
            evade_oka_patrol: true,
            reach_chk_with_packet: true,
            deliver_chk_samizdat: false,
            archive_wall_handwritten: false,
          },
        },
      ],
    });
    expect(getStreetChkSamizdatHint('chk_forest_zorge')).toContain('Басед');
  });

  it('guides pier frequency then cafe wall match', () => {
    mockSnapshot.mockReturnValue({
      quests: [
        {
          questId: 'act2_pier_cafe_frequency',
          status: 'active',
          objectives: {
            meet_trofim_pier: true,
            hear_pier_frequency: true,
            carry_frequency_street: true,
            reach_cafe_with_frequency: true,
            match_cafe_wall: false,
            feel_city_heartbeat: false,
          },
        },
      ],
    });
    expect(getPierCafeFrequencyHint('river_pier')).toContain('«Синяя яма»');
    expect(getPierCafeFrequencyHint('cafe_evening')).toContain('стихов');
  });

  it('walks night city watch through hub checkpoints', () => {
    mockSnapshot.mockReturnValue({
      quests: [
        {
          questId: 'act2_night_city_watch',
          status: 'active',
          objectives: {
            accept_watch_brief: true,
            watch_street_bench: true,
            watch_pier: true,
            watch_chk_campfire: false,
            report_albert_cafe: false,
            burn_napkin_log: false,
          },
        },
      ],
    });
    expect(getNightCityWatchHint('river_pier')).toContain('ЧК');
    expect(getNightCityWatchHint('chk_forest_zorge')).toContain('Костёр');
  });

  it('returns first matching hub hint', () => {
    mockSnapshot.mockReturnValue({
      quests: [
        {
          questId: 'act2_cafe_office_relay',
          status: 'active',
          objectives: {
            hear_relay_brief: true,
            take_cafe_envelope: true,
            cross_street_with_envelope: true,
            enter_office_with_envelope: true,
            deliver_office_envelope: false,
            read_relay_second_sheet: false,
          },
        },
      ],
    });
    expect(getExpansionHubQuestHint('office_day')).toContain('конверт');
  });
});
