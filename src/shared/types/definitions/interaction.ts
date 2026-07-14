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
  /** Lore entry IDs related to this object — shown as clickable chips in the examine panel */
  readonly relatedLoreIds?: string[];
  /** Item IDs related to this object — reserved for future connected-items display */
  readonly connectedItemIds?: string[];
}
