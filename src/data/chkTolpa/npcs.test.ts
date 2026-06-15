import { describe, expect, it } from 'vitest';
import { CHK_NPCS } from './npcs';
import { NPC_PROCEDURAL_MODEL_PLACEHOLDER } from '@/config/npcModelRegistry';
import { getRpmNpcByRegistryId } from '@/config/rpmNpcCatalog';
import { CHK_NPC_SCHEDULES } from './schedules';
import { CHK_QUESTS } from './quests';

const CHK_GUEST_IDS = new Set(['chk_guest_devops', 'chk_guest_analyst']);

describe('CHK_NPCS', () => {
  const scheduleIds = new Set(CHK_NPC_SCHEDULES.map((s) => s.id));

  it('uses RPM model paths for core Tolpa members; guests stay procedural', () => {
    for (const npc of CHK_NPCS) {
      if (CHK_GUEST_IDS.has(npc.id)) {
        expect(npc.modelPath, npc.id).toBe(NPC_PROCEDURAL_MODEL_PLACEHOLDER);
        continue;
      }
      const rpm = getRpmNpcByRegistryId(npc.id);
      if (rpm) {
        expect(npc.modelPath, npc.id).toBe(rpm.publicUrl);
      } else {
        expect(npc.modelPath, npc.id).toBe(NPC_PROCEDURAL_MODEL_PLACEHOLDER);
      }
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
