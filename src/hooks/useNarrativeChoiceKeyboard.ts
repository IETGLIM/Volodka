import { useEffect } from 'react';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export interface NarrativeChoiceKeyboardOptions {
  active: boolean;
  done: boolean;
  choiceCount: number;
  onSelectChoice: (index: number) => void;
  onSkip?: () => void;
  onClose?: () => void;
}

/** Space/Enter skip typewriter; 1–9 pick choice; Escape close overlay. */
export function useNarrativeChoiceKeyboard({
  active,
  done,
  choiceCount,
  onSelectChoice,
  onSkip,
  onClose,
}: NarrativeChoiceKeyboardOptions): void {
  useEffect(() => {
    if (!active) return;

    const handleKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (!done) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onSkip?.();
        }
        return;
      }

      if (choiceCount <= 0) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onClose?.();
        }
        return;
      }

      const num = Number.parseInt(e.key, 10);
      if (num >= 1 && num <= choiceCount) {
        e.preventDefault();
        onSelectChoice(num - 1);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, done, choiceCount, onSelectChoice, onSkip, onClose]);
}
