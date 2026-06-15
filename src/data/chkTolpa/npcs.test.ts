import { describe, expect, it } from 'vitest';
import { CHK_NPCS } from './npcs';
import { NPC_PROCEDURAL_MODEL_PLACEHOLDER } from '@/config/npcModelRegistry';
import { CHK_NPC_SCHEDULES } from './schedules';
import { CHK_QUESTS } from './quests';

describe('CHK_NPCS', () => {
  const scheduleIds = new Set(CHK_NPC_SCHEDULES.map((s) => s.id));

  it('uses procedural models explicitly', () => {
    for (const npc of CHK_NPCS) {
      expect(npc.modelPath, npc.id).toBe(NPC_PROCEDURAL_MODEL_PLACEHOLDER);
    }
  });

  it('links every NPC to a schedule', () => {
    for (const npc of CHK_NPCS) {
      expect(npc.scheduleId, npc.id).toBeDefined();
      expect(scheduleIds.has(npc.scheduleId!), npc.id).toBe(true);
    }
  });

  it('stores bark pools inline without single-line truncation', () => {
    const based = CHK_NPCS.find((n) => n.id === 'chk_based')!;
    expect(Array.isArray(based.barkTexts?.neutral)).toBe(true);
    expect(based.barkTexts!.neutral.length).toBeGreaterThan(1);
  });

  it('includes accessibility descriptions', () => {
    for (const npc of CHK_NPCS) {
      expect(npc.accessibility?.visualDescription, npc.id).toBeTruthy();
    }
  });

  it('assigns questGiverNpcId on all CHK faction quests', () => {
    for (const quest of CHK_QUESTS) {
      expect(quest.questGiverNpcId, quest.id).toBeDefined();
    }
  });
});
