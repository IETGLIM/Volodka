import type { ReactNode, RefObject } from 'react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { usePanelFocusTrapActive } from '@/components/a11y/usePanelFocusTrapActive';

interface FocusTrapProps {
  active?: boolean;
  children: ReactNode;
  /** Focus this element when the trap mounts (typically the close button). */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/** Radix focus scope — traps Tab inside modal overlays when active. */
export function FocusTrap({ active = true, children, initialFocusRef }: FocusTrapProps) {
  const trapActive = usePanelFocusTrapActive(active);
  if (!trapActive) return <>{children}</>;
  return (
    <FocusScope
      trapped
      loop
      onMountAutoFocus={(event) => {
        if (initialFocusRef?.current) {
          event.preventDefault();
          initialFocusRef.current.focus();
        }
      }}
    >
      {children}
    </FocusScope>
  );
}
