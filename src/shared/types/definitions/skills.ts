/* ─── Player skills (static / shared) ─── */

export interface PlayerSkills {
  logic: number;
  coding: number;
  empathy: number;
  persuasion: number;
  intuition: number;
  writing: number;
  rhythm: number;
}

export type TrainablePlayerSkill = keyof PlayerSkills;

export type KarmaLevel = 'low' | 'mid' | 'high';
