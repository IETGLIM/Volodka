import { useId, useRef, type RefObject } from 'react';

export interface PanelDialogA11y {
  titleId: string;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  dialogProps: {
    role: 'dialog';
    'aria-modal': true;
    'aria-labelledby': string;
    'data-panel': '';
  };
  titleProps: {
    id: string;
  };
}

/** Stable ids + refs for modal game panels (role=dialog, focus on close). */
export function usePanelDialog(): PanelDialogA11y {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  return {
    titleId,
    closeButtonRef,
    dialogProps: {
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': titleId,
      'data-panel': '',
    },
    titleProps: { id: titleId },
  };
}
