import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getCafeStreetWhisperHint,
  getChipCafeClearanceHint,
  getCodePoemAftermathHint,
  getFridaySpleenHint,
  getIncidentScrollHint,
  getMariaConnectionHint,
  getNightCityCallHint,
  getNetworkInitiationHint,
  getOfficeLobbyWatchHint,
  getPoetryCollectionHint,
  getSolnyshSpineHint,
  getVaultBackupTrialHint,
} from './act1QuestHints';

const snap = {
  quests: [] as Array<{
    questId: string;
    status: string;
    objectives: Record<string, boolean>;
    startedAtTime: number;
  }>,
};

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => snap,
}));

vi.mock('@/data/quests', () => ({
  QUEST_DEFINITIONS: [
    {
      id: 'poetry_collection',
      objectives: [
        { id: 'collect_poem_1', description: 'Стихотворение I — Рабочий стол' },
        { id: 'collect_poem_2', description: 'Стихотворение II — Книжная полка' },
      ],
    },
  ],
}));

describe('act1QuestHints', () => {
  beforeEach(() => {
    snap.quests = [];
  });

  it('maria_connection guides street meet first', () => {
    snap.quests = [
      {
        questId: 'maria_connection',
        status: 'active',
        objectives: {
          meet_maria: false,
          accept_chip: false,
          read_maria_poem: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getMariaConnectionHint('volodka_room')).toContain('улицу');
    expect(getMariaConnectionHint('street_night')).toContain('Переулок');
  });

  it('cafe_street_whisper guides barista then alley', () => {
    snap.quests = [
      {
        questId: 'cafe_street_whisper',
        status: 'active',
        objectives: {
          ask_barista_tip: false,
          spot_alley_silhouette: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getCafeStreetWhisperHint('street_night')).toContain('Синюю яму');
    snap.quests[0]!.objectives.ask_barista_tip = true;
    expect(getCafeStreetWhisperHint('street_night')).toContain('переулок');
  });

  it('incident_scroll adapts to office presence', () => {
    snap.quests = [
      {
        questId: 'incident_scroll_4729',
        status: 'active',
        objectives: {
          visit_office: false,
          talk_alexander: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getIncidentScrollHint('street_night')).toContain('офис');
    expect(getIncidentScrollHint('office_day')).toContain('Александра');
  });

  it('poetry_collection surfaces next poem location', () => {
    snap.quests = [
      {
        questId: 'poetry_collection',
        status: 'active',
        objectives: {
          collect_poem_1: true,
          collect_poem_2: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getPoetryCollectionHint()).toBe('Следующий стих: Книжная полка');
  });

  it('vault_backup_trial guides office colleague first', () => {
    snap.quests = [
      {
        questId: 'vault_backup_trial',
        status: 'active',
        objectives: {
          learn_about_vault: false,
          hack_vault_terminal: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getVaultBackupTrialHint('street_night')).toContain('офис');
    expect(getVaultBackupTrialHint('office_day')).toContain('коллегу');
  });

  it('network_initiation guides Victoria meet', () => {
    snap.quests = [
      {
        questId: 'network_initiation',
        status: 'active',
        objectives: {
          meet_maria_again: false,
          navigate_network: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getNetworkInitiationHint('volodka_room')).toContain('Виктория');
  });

  it('solnysh spine guides comfort talk', () => {
    snap.quests = [
      {
        questId: 'solnysh_comfort',
        status: 'active',
        objectives: {
          talk_solnysh: false,
          comfort_solnysh: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getSolnyshSpineHint('street_night')).toContain('Солныш');
    expect(getSolnyshSpineHint('volodka_corridor')).toContain('Подойди');
  });

  it('guides night_city_call from room toward corridor', () => {
    snap.quests = [
      {
        questId: 'night_city_call',
        status: 'active',
        objectives: {
          leave_home: false,
          reach_street: false,
          enter_cafe: false,
          feel_city_pulse: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getNightCityCallHint('volodka_room')).toContain('коридор');
  });

  it('guides chip_cafe_clearance from street toward cafe', () => {
    snap.quests = [
      {
        questId: 'chip_cafe_clearance',
        status: 'active',
        objectives: {
          return_cafe_with_chip: false,
          barista_hears_echo: false,
          receive_guild_summons: false,
          reach_guild_lobby: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getChipCafeClearanceHint('street_night')).toContain('Синюю яму');
    expect(getChipCafeClearanceHint('cafe_evening')).toContain('стойке');
  });

  it('guides office_lobby_watch toward server wall', () => {
    snap.quests = [
      {
        questId: 'office_lobby_watch',
        status: 'active',
        objectives: {
          feel_chip_warmth: false,
          read_incident_bulletin: false,
          notice_colleague_watch: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getOfficeLobbyWatchHint('office_day')).toContain('серверн');
  });

  it('guides code_poem_aftermath from poem to colleague', () => {
    snap.quests = [
      {
        questId: 'code_poem_aftermath',
        status: 'active',
        objectives: {
          absorb_decoded_poem: true,
          feel_guild_pressure: true,
          ask_colleague_politics: false,
          hear_vault_lead: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getCodePoemAftermathHint('office_day')).toContain('коллеге');
  });

  it('guides friday_spleen toward Albert cafe', () => {
    snap.quests = [
      {
        questId: 'friday_spleen',
        status: 'active',
        objectives: {
          leave_office_dusk: true,
          stand_on_balcony: true,
          write_friday_poem: true,
          hear_albert_bridge: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getFridaySpleenHint('volodka_room')).toContain('Альберту');
  });

});
