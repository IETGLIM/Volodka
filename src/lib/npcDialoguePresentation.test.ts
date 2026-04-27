import { describe, expect, it } from 'vitest';
import { getNpcDialoguePresentation, npcDialogueInitial } from '@/lib/npcDialoguePresentation';

describe('npcDialoguePresentation', () => {
  it('npcDialogueInitial skips leading emoji', () => {
    expect(npcDialogueInitial('🌸 Зарема')).toBe('З');
    expect(npcDialogueInitial('123')).toBe('1');
  });

  it('getNpcDialoguePresentation uses dialogueRole and optional portrait', () => {
    const p = getNpcDialoguePresentation({
      id: 'office_colleague',
      name: 'Коллега',
      dialogueRole: 'Тестовая роль',
      dialoguePortraitUrl: '/images/x.png',
      model: 'colleague',
      defaultPosition: { x: 0, y: 0, z: 0 },
      sceneId: 'office_morning',
    });
    expect(p.npcRole).toBe('Тестовая роль');
    expect(p.portraitUrl).toBe('/images/x.png');
    expect(p.holoGradientClass).toContain('from-');
  });

  it('getNpcDialoguePresentation falls back role when dialogueRole empty', () => {
    const p = getNpcDialoguePresentation({
      id: 'x_npc',
      name: 'Без роли',
      model: 'generic',
      defaultPosition: { x: 0, y: 0, z: 0 },
      sceneId: 'street_night',
    });
    expect(p.npcRole).toBe('Собеседник');
  });
});
