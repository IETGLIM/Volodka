import type { ReactNode, RefObject } from 'react';
import { FocusScope } from '@radix-ui/react-focus-scope';

interface FocusTrapProps {
  active?: boolean;
  children: ReactNode;
  /** Focus this element when the trap mounts (typically the close button). */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/** Radix focus scope — traps Tab inside modal overlays when active. */
export function FocusTrap({ active = true, children, initialFocusRef }: FocusTrapProps) {
  if (!active) return <>{children}</>;
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
