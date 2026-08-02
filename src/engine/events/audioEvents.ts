/** Audio / SFX events — consumed by useAudioOrchestrator, QuickUseBar. */
export interface AudioEvents {
  /**
   * Sound play event. The base contract requires only `type` (e.g. 'item_use',
   * 'ui_click'). The QuickUseBar extends the payload with optional slot/item
   * metadata so the QuickUseCooldownOverlay can render a per-slot cooldown ring
   * without requiring a separate event bus channel.
   */
  'sound:play': {
    type: string;
    /** Slot index that triggered the sound (QuickUseBar item use). */
    slotIndex?: number;
    /** Item ID that triggered the sound (QuickUseBar item use). */
    itemId?: string;
    /** Cooldown duration in milliseconds (QuickUseBar item use). */
    cooldownMs?: number;
  };
}
