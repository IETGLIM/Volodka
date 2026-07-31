import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT1_CAFE_OFFICE } from '@/data/story/act1ExtendedCafeOffice';
import { GOLDEN_PATH_BRANCH_HINTS } from '@/data/goldenPath';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { EXPANDED_NPCS } from '@/data/expandedNPCs';

const npcIds = new Set([...NPC_DEFINITIONS, ...EXPANDED_NPCS].map((n) => n.id));

describe('Act 1 cafe/office extended story nodes', () => {
  it('cafe_backroom_peek has a11y metadata and balanced direct path', () => {
    const node = STORY_NODES_ACT1_CAFE_OFFICE.cafe_backroom_peek;
    expect(node.contextNote).toContain('подсобке');
    expect(node.accessibilityAnnounce).toBeTruthy();
    expect(node.ambientSound).toContain('backroom');

    const explore = node.choices.find((c) => c.text.includes('Запомнить'));
    expect(explore?.effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_7' });

    const direct = node.choices.find((c) => c.text.includes('баристе'));
    expect(direct?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: -2 });
  });

  it('office_vault_archive has karma variants, autosave, and revisit guard', () => {
    const node = STORY_NODES_ACT1_CAFE_OFFICE.office_vault_archive;
    expect(node.textVariants?.highKarma).toContain('правильно');
    expect(node.textVariants?.lowKarma).toContain('следят');
    expect(node.karmaThresholds).toEqual({ high: 65, low: 30 });
    expect(node.autoSave).toBe(true);
    expect(node.condition).toEqual({ missingFlag: 'vault_backup_archived' });
  });

  it('office_incident_debrief gates empathy and persuasion branches', () => {
    const node = STORY_NODES_ACT1_CAFE_OFFICE.office_incident_debrief;
    const empathy = node.choices.find((c) => c.condition?.minSkill?.empathy === 2);
    const persuasion = node.choices.find((c) => c.condition?.minSkill?.persuasion === 2);
    expect(empathy?.effects).toContainEqual({
      type: 'setFlag',
      flag: 'alexander_empathy_debrief',
      flagValue: true,
    });
    expect(persuasion?.effects).toContainEqual({
      type: 'discoverLore',
      loreId: 'lore_incident_4729',
    });
  });

  it('office_server_pulse triggers night_shift_mystery', () => {
    const node = STORY_NODES_ACT1_CAFE_OFFICE.office_server_pulse;
    for (const choice of node.choices) {
      expect(choice.effects).toContainEqual({ type: 'triggerQuest', questId: 'night_shift_mystery' });
    }
  });

  it('references valid NPC ids', () => {
    const referenced = ['cafe_barista', 'sergey', 'office_alexander'] as const;
    for (const id of referenced) {
      expect(npcIds.has(id), id).toBe(true);
    }
  });

  it('nodes with guidance have golden path branch hints', () => {
    const ids = [
      'cafe_barista_victoria_whisper',
      'cafe_chip_resonance',
      'cafe_guild_clearance',
      'office_lobby_arrival',
      'cafe_special_coffee',
      'cafe_backroom_peek',
      'office_incident_debrief',
      'office_server_pulse',
      'office_vault_archive',
    ] as const;
    for (const id of ids) {
      expect(
        STORY_NODES_ACT1_CAFE_OFFICE[id]?.guidanceHint || GOLDEN_PATH_BRANCH_HINTS[id],
        id,
      ).toBeTruthy();
    }
  });

  it('cafe_chip_resonance golden path leads to guild clearance', () => {
    const node = STORY_NODES_ACT1_CAFE_OFFICE.cafe_chip_resonance;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('cafe_guild_clearance');
    expect(node.effects).toContainEqual({
      type: 'setFlag',
      flag: 'barista_chip_resonance',
      flagValue: true,
    });
  });

  it('office_lobby_arrival auto-progresses clearance flags and side watch', () => {
    const node = STORY_NODES_ACT1_CAFE_OFFICE.office_lobby_arrival;
    expect(node.effects).toContainEqual({
      type: 'triggerQuest',
      questId: 'office_lobby_watch',
    });
    expect(node.effects).toContainEqual({
      type: 'setFlag',
      flag: 'guild_summons_received',
      flagValue: true,
    });
    expect(node.choices.find((c) => c.goldenPath)?.next).toBe('office_alexander');
  });
});
