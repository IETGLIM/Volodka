import { describe, expect, it } from 'vitest';
import {
  isQuestCompletionFlowBusy,
  shouldDeferQuestAcceptDialog,
  shouldSuppressQuestAcceptEmit,
} from './questAcceptDeferral';

describe('questAcceptDeferral', () => {
  it('defers maria_connection until street_night', () => {
    expect(shouldDeferQuestAcceptDialog('maria_connection', 'volodka_room')).toBe(true);
    expect(shouldDeferQuestAcceptDialog('maria_connection', 'street_night')).toBe(false);
  });

  it('suppresses first_reading accept dialog in volodka_room', () => {
    expect(shouldDeferQuestAcceptDialog('first_reading', 'volodka_room')).toBe(true);
    expect(shouldDeferQuestAcceptDialog('first_reading', 'office_day')).toBe(false);
  });

  it('suppresses first_reading quest-available emit from guided story auto-start', () => {
    expect(shouldSuppressQuestAcceptEmit('first_reading')).toBe(true);
    expect(shouldSuppressQuestAcceptEmit('maria_connection')).toBe(false);
  });

  it('treats matrix quote and pending completion as busy overlay flow', () => {
    expect(
      isQuestCompletionFlowBusy({
        matrixQuoteActive: true,
        questCompleteActive: false,
        pendingQuestComplete: null,
      }),
    ).toBe(true);

    expect(
      isQuestCompletionFlowBusy({
        matrixQuoteActive: false,
        questCompleteActive: false,
        pendingQuestComplete: { questId: 'first_reading' },
      }),
    ).toBe(true);
  });
});
