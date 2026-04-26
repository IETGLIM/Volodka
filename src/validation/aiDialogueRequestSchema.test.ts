import { describe, expect, it } from 'vitest';
import { safeParseDialogueRequest } from '@/validation/aiDialogueRequestSchema';

const minimalPlayerState = {
  mood: 50,
  creativity: 30,
  stability: 60,
  energy: 5,
  karma: 40,
  selfEsteem: 45,
  stress: 20,
  panicMode: false,
  path: 'none' as const,
  act: 1 as const,
  skills: { empathy: 10, persuasion: 10, intuition: 10 },
};

describe('safeParseDialogueRequest', () => {
  it('accepts minimal valid dialogue payload', () => {
    const r = safeParseDialogueRequest({
      npcId: 'zarema',
      npcName: 'Зарема',
      playerState: minimalPlayerState,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.npcId).toBe('zarema');
      expect(r.data.currentTopic).toBe('общая беседа');
      expect(r.data.dialogueHistory).toEqual([]);
      expect(r.data.npcRelations).toEqual([]);
    }
  });

  it('rejects missing skills.empathy', () => {
    const r = safeParseDialogueRequest({
      npcId: 'zarema',
      npcName: 'Зарема',
      playerState: {
        ...minimalPlayerState,
        skills: { persuasion: 1, intuition: 1 },
      },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects oversized dialogue history', () => {
    const lines = Array.from({ length: 101 }, (_, i) => ({
      speaker: 'player' as const,
      text: `line ${i}`,
    }));
    const r = safeParseDialogueRequest({
      npcId: 'zarema',
      npcName: 'Зарема',
      playerState: minimalPlayerState,
      dialogueHistory: lines,
    });
    expect(r.ok).toBe(false);
  });
});
