/* ─── Progression definitions ─── */

export type SkillBranch = 'technical' | 'social' | 'spiritual';

export interface SkillTreeNode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly branch: SkillBranch;
  readonly tier: number;
  readonly requires: string[];
  readonly effect: string;
}
