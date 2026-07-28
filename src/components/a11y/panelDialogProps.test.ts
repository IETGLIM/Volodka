import { describe, expect, it } from 'vitest';
import { panelDialogProps } from './usePanelDialog';

describe('panelDialogProps', () => {
  it('marks overlay as labelled modal dialog', () => {
    expect(panelDialogProps('title-abc')).toEqual({
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': 'title-abc',
      'data-panel': '',
    });
  });
});
