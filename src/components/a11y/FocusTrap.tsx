import type { ReactNode } from 'react';
import { FocusScope } from '@radix-ui/react-focus-scope';

interface FocusTrapProps {
  active?: boolean;
  children: ReactNode;
}

/** Radix focus scope — traps Tab inside modal overlays when active. */
export function FocusTrap({ active = true, children }: FocusTrapProps) {
  if (!active) return <>{children}</>;
  return (
    <FocusScope trapped loop>
      {children}
    </FocusScope>
  );
}
