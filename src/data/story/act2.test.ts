import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT2 } from '@/data/story/act2';
import { STORY_NODES } from '@/data/story';
import { GOLDEN_PATH_BRANCH_HINTS } from '@/data/goldenPath';
import { NPC_ID_ALIASES } from '@/shared/npcIdAliases';

describe('Act 2 story presentation', () => {
  it('act2_network_initiation has a11y, karma text, autosave, and skill gate', () => {
    const node = STORY_NODES_ACT2.act2_network_initiation;
    expect(node.contextNote).toContain('подвале');
    expect(node.accessibilityAnnounce).toContain('клятву');
    expect(node.autoSave).toBe(true);
    expect(node.textVariants?.highKarma).toBeTruthy();
    const oath = node.choices.find((c) => c.goldenPath);
    expect(oath?.condition).toEqual({ minKarma: 35, minSkill: { writing: 3 } });
  });

  it('act2_vault_revealed guards revisit and autosaves', () => {
    const node = STORY_NODES_ACT2.act2_vault_revealed;
    expect(node.condition).toEqual({ missingFlag: 'vault_access_granted' });
    expect(node.autoSave).toBe(true);
    expect(node.textVariants?.lowKarma).toContain('следят');
  });

  it('pier_arrival syncs chalk poem with CHK flag', () => {
    const node = STORY_NODES_ACT2.pier_arrival;
    const effects = node.choices[0]?.effects ?? [];
    expect(effects).toContainEqual({ type: 'setFlag', flag: 'pier_chalk_poem_seen', flagValue: true });
    expect(effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_11' });
  });

  it('act2_albert_pre_crash awards living-code poem fragment', () => {
    const node = STORY_NODES_ACT2.act2_albert_pre_crash;
    const choice = node.choices.find((c) => c.text.includes('традицию'));
    expect(choice?.effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_6' });
  });

  it('act2_closing routes zarema branch through network talk node', () => {
    const zarema = STORY_NODES_ACT2.act2_closing.choices.find((c) => c.text.includes('Зареме'));
    expect(zarema?.next).toBe('act2_zarema_network');
    expect(STORY_NODES_ACT2.act2_zarema_network.choices[0]?.effects).toContainEqual({
      type: 'setFlag',
      flag: 'zarema_knows_network',
      flagValue: true,
    });
  });

  it('npc_ aliases resolve to canonical ids', () => {
    expect(NPC_ID_ALIASES.npc_maria).toBe('maria');
    expect(NPC_ID_ALIASES.npc_barista).toBe('cafe_barista');
    expect(NPC_ID_ALIASES.npc_albert).toBe('albert');
  });

  it('key act2 nodes have golden path hints', () => {
    const ids = [
      'act2_network_initiation',
      'act2_barista_followup',
      'act2_zarema_network',
      'pier_arrival',
    ] as const;
    for (const id of ids) {
      expect(
        GOLDEN_PATH_BRANCH_HINTS[id] || STORY_NODES[id]?.guidanceHint,
        id,
      ).toBeTruthy();
    }
  });
});
