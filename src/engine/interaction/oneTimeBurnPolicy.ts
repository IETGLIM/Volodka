/** Whether a one-time examine interaction should burn only after Continue. */
export function shouldDeferOneTimeBurn(zone: {
  isOneTime?: boolean;
  examineData?: unknown;
  linkedDialogueNodeId?: string;
  linkedStoryNodeId?: string;
  linkedMinigame?: string;
}): boolean {
  const hasLinkedContent = !!(
    zone.linkedDialogueNodeId || zone.linkedStoryNodeId || zone.linkedMinigame
  );
  return !!(zone.isOneTime && zone.examineData && hasLinkedContent);
}
