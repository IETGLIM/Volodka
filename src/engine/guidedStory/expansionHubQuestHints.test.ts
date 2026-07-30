import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getCafeOfficeRelayHint,
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
          objectives: { take_cafe_envelope: false, deliver_office_envelope: false },
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
          objectives: { receive_samizdat: true, deliver_chk_samizdat: false },
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
          objectives: { hear_pier_frequency: true, match_cafe_wall: false },
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
            watch_street_bench: true,
            watch_pier: true,
            watch_chk_campfire: false,
            report_albert_cafe: false,
          },
        },
      ],
    });
    expect(getNightCityWatchHint('river_pier')).toContain('ЧК');
    expect(getNightCityWatchHint('chk_forest_zorge')).toContain('Костёр');
  });
});
