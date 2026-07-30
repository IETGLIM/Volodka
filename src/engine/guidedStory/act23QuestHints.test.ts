import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getBasementHumHint,
  getCafeSafehouseHint,
  getDmitryDefectionHint,
  getMariaTruthHint,
  getPierWatchmanKeyHint,
  getPoetrySmugglingHint,
  getThreadOf18LinesHint,
  getVaultDefenseHint,
  getVaultKeyFragmentsHint,
  getZaremaRescueHint,
  getAct3HubRelayHint,
} from './act23QuestHints';

const snap = {
  quests: [] as Array<{
    questId: string;
    status: string;
    objectives: Record<string, boolean>;
    startedAtTime: number;
  }>,
  playerState: {
    flags: {} as Record<string, boolean>,
  },
};

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => snap,
}));

describe('act23QuestHints', () => {
  beforeEach(() => {
    snap.quests = [];
    snap.playerState.flags = {};
  });

  it('cafe_safehouse adapts to cafe presence', () => {
    snap.quests = [
      {
        questId: 'cafe_safehouse',
        status: 'active',
        objectives: {
          convince_barista: false,
          ask_albert_secrecy: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getCafeSafehouseHint('street_night')).toContain('кафе');
    expect(getCafeSafehouseHint('cafe_evening')).toContain('баристу');
  });

  it('dmitry_defection guides office meet first', () => {
    snap.quests = [
      {
        questId: 'dmitry_defection',
        status: 'active',
        objectives: {
          hear_dmitry_story: false,
          plan_escape: false,
          escort_dmitry: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getDmitryDefectionHint('volodka_room')).toContain('офис');
    expect(getDmitryDefectionHint('office_day')).toContain('Дмитрия');
  });

  it('basement_hum guides factory descent', () => {
    snap.quests = [
      {
        questId: 'basement_hum',
        status: 'active',
        objectives: {
          descend_basement: false,
          examine_zarya: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getBasementHumHint('street_night')).toContain('завод');
    expect(getBasementHumHint('abandoned_factory')).toContain('подвал');
  });

  it('zarema_rescue surfaces poem bypass cue', () => {
    snap.quests = [
      {
        questId: 'zarema_rescue',
        status: 'active',
        objectives: {
          learn_zarema_arrested: true,
          infiltrate_detention: false,
          free_zarema: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getZaremaRescueHint('street_night')).toContain('Прорыв');
  });

  it('maria_truth guides barista then confront', () => {
    snap.quests = [
      {
        questId: 'maria_truth',
        status: 'active',
        objectives: {
          find_maria_records: true,
          ask_barista_about_maria: false,
          confront_maria: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getMariaTruthHint('volodka_room')).toContain('яме');
    expect(getMariaTruthHint('cafe_evening')).toContain('баристу');
  });

  it('vault_key_fragments guides guild fragment first', () => {
    snap.quests = [
      {
        questId: 'vault_key_fragments',
        status: 'active',
        objectives: {
          find_guild_fragment: false,
          find_network_fragment: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getVaultKeyFragmentsHint('street_night')).toContain('офис');
    expect(getVaultKeyFragmentsHint('office_day')).toContain('фрагмент');
  });

  it('poetry_smuggling guides library pickup', () => {
    snap.quests = [
      {
        questId: 'poetry_smuggling',
        status: 'active',
        objectives: {
          retrieve_poems_library: false,
          evade_guild_patrol_park: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getPoetrySmugglingHint('street_night')).toContain('библиотек');
    expect(getPoetrySmugglingHint('library_day')).toContain('тайник');
  });

  it('pier_watchman_key guides Trofim meet', () => {
    snap.quests = [
      {
        questId: 'pier_watchman_key',
        status: 'active',
        objectives: {
          meet_trofim: false,
          bring_portwine: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getPierWatchmanKeyHint('street_night')).toContain('пирс');
    expect(getPierWatchmanKeyHint('pier_evening')).toContain('Трофимом');
  });

  it('vault_defense guides firewall after rally', () => {
    snap.quests = [
      {
        questId: 'vault_defense',
        status: 'active',
        objectives: {
          receive_vault_alert: true,
          rally_defenders: true,
          deploy_firewall: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getVaultDefenseHint('street_night')).toContain('фаервол');
  });

  it('thread_of_18_lines guides park memorial first', () => {
    snap.quests = [
      {
        questId: 'thread_of_18_lines',
        status: 'active',
        objectives: {
          trace_crash: false,
          trace_4729: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getThreadOf18LinesHint('street_night')).toContain('парке');
    expect(getThreadOf18LinesHint('park_day')).toContain('Сбое');
  });

  it('act3 hub relay guides guild mainframe when office ack done', () => {
    snap.playerState.flags = {
      zarema_arrested: true,
      act3_pier_relay_whisper_done: true,
      act3_library_relay_echo_done: true,
      act3_cafe_relay_ack_done: true,
      act3_office_relay_ack_done: true,
    };
    expect(getAct3HubRelayHint('volodka_room')).toContain('гильдии');
    expect(getAct3HubRelayHint('guild_mainframe')).toContain('мейнфрейму');
  });

  it('act3 hub relay is silent after mesh closed', () => {
    snap.playerState.flags = {
      zarema_arrested: true,
      act3_hub_relay_mesh_closed: true,
    };
    expect(getAct3HubRelayHint('factory_basement')).toBeNull();
  });
});
