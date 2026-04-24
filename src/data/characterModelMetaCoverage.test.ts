/**
 * Без загрузки GLB: каждый NPC с `modelPath` должен иметь строку в `GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME`,
 * иначе новый персонаж получит DEFAULT и легко уйдёт в «гигантизм».
 */
import { describe, expect, it } from 'vitest';
import { GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME, glbBasenameFromUrl } from '@/data/modelMeta';
import { getDefaultPlayerModelPath } from '@/config/modelUrls';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';

describe('character modelMeta coverage', () => {
  it('default player GLB basename has uniform base entry', () => {
    const k = glbBasenameFromUrl(getDefaultPlayerModelPath());
    expect(GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME[k]).toBeDefined();
  });

  it('every npcDefinitions modelPath basename has uniform base entry', () => {
    const missing: string[] = [];
    for (const def of Object.values(NPC_DEFINITIONS)) {
      const p = def.modelPath?.trim();
      if (!p) continue;
      const k = glbBasenameFromUrl(p);
      if (GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME[k] == null) {
        missing.push(`${def.id} → ${k}`);
      }
    }
    expect(missing, `Add GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME entries for:\n${missing.join('\n')}`).toEqual(
      [],
    );
  });
});
