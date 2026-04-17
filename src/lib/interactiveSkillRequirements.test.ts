import { describe, it, expect } from 'vitest';
import { getInteractiveSkillBlockMessage } from './interactiveSkillRequirements';
import type { InteractiveObjectConfig } from '@/config/scenes';
import type { PlayerSkills } from '@/data/types';

const skills = (coding: number): PlayerSkills => ({
  writing: 10,
  perception: 10,
  empathy: 10,
  imagination: 10,
  logic: 10,
  coding,
  persuasion: 10,
  intuition: 10,
  resilience: 10,
  introspection: 10,
  skillPoints: 0,
});

describe('getInteractiveSkillBlockMessage', () => {
  it('returns null when no requirements', () => {
    const obj = { id: 'x', type: 'generic', position: [0, 0, 0] } as InteractiveObjectConfig;
    expect(getInteractiveSkillBlockMessage(obj, skills(50))).toBeNull();
  });

  it('blocks when skill too low', () => {
    const obj = {
      id: 'jack',
      type: 'notebook',
      position: [0, 0, 0],
      requiredSkills: [{ skill: 'coding', min: 30 }],
    } as InteractiveObjectConfig;
    const msg = getInteractiveSkillBlockMessage(obj, skills(10));
    expect(msg).toContain('coding');
    expect(msg).toContain('30');
  });
});
