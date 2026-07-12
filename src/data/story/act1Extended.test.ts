import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT1_EXTENDED } from '@/data/story/act1Extended';
import { GOLDEN_PATH_BRANCH_HINTS } from '@/data/goldenPath';

describe('Act 1 extended story nodes', () => {
  it('room_wardrobe_memory has accessibility metadata and stress on defer', () => {
    const node = STORY_NODES_ACT1_EXTENDED.room_wardrobe_memory;
    expect(node.contextNote).toBeTruthy();
    expect(node.ambientSound).toContain('wardrobe');
    const defer = node.choices.find((c) => c.text.includes('Отложить'));
    expect(defer?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: 1 });
  });

  it('corridor_letter_open has guidance and corridor_letter_read auto-saves', () => {
    const open = STORY_NODES_ACT1_EXTENDED.corridor_letter_open;
    expect(open.guidanceHint).toContain('письмо');
    expect(open.guidanceObjectiveType).toBe('collect_item');

    const read = STORY_NODES_ACT1_EXTENDED.corridor_letter_read;
    expect(read.autoSave).toBe(true);
    expect(read.soundEffect).toBeTruthy();
  });

  it('corridor_intercom_whisper has karma text variants', () => {
    const node = STORY_NODES_ACT1_EXTENDED.corridor_intercom_whisper;
    expect(node.textVariants?.highKarma).toBeTruthy();
    expect(node.textVariants?.lowKarma).toBeTruthy();
    expect(node.karmaThresholds).toEqual({ high: 65, low: 30 });
  });

  it('zarema_radio_success requires quest start and awards poem once', () => {
    const node = STORY_NODES_ACT1_EXTENDED.zarema_radio_success;
    expect(node.condition).toEqual({ flag: 'zarema_radio_quest_started' });
    expect(node.choices).toHaveLength(1);
    const effects = node.choices[0]?.effects ?? [];
    expect(effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_16' });
    expect(effects).toContainEqual({ type: 'setFlag', flag: 'zarema_radio_fixed', flagValue: true });
    expect(effects.filter((e) => e.type === 'setFlag' && e.flag === 'zarema_radio_needs_fix')).toHaveLength(0);
  });

  it('cafe_albert_riddle links to solved node with quest flag', () => {
    const riddle = STORY_NODES_ACT1_EXTENDED.cafe_albert_riddle;
    const solvedChoice = riddle.choices.find((c) => c.next === 'cafe_albert_riddle_solved');
    expect(solvedChoice).toBeTruthy();

    const solved = STORY_NODES_ACT1_EXTENDED.cafe_albert_riddle_solved;
    const complete = solved.choices[0]?.effects ?? [];
    expect(complete).toContainEqual({ type: 'setFlag', flag: 'solved_albert_riddle', flagValue: true });
    expect(complete).toContainEqual({ type: 'collectPoem', poemId: 'poem_8' });
  });

  it('extended nodes with guidance have golden path branch hints', () => {
    const ids = [
      'room_wardrobe_memory',
      'corridor_letter_open',
      'corridor_letter_read',
      'zarema_radio_request',
      'cafe_albert_riddle_solved',
    ] as const;
    for (const id of ids) {
      expect(GOLDEN_PATH_BRANCH_HINTS[id], id).toBeTruthy();
    }
  });
});
