/* ─── Interaction definitions ─── */

export type InteractionType =
  | 'examine'
  | 'read'
  | 'take'
  | 'hack'
  | 'open'
  | 'talk'
  | 'use'
  | 'push'
  | 'default';

/** Data for the object examination panel */
export interface ExamineData {
  readonly title: string;
  readonly description: string;
  readonly detailText: string;
  readonly icon?: string;
}
