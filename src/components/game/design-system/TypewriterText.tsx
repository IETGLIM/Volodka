import { useEffect } from 'react';
import { useTypewriter, type UseTypewriterOptions } from './useTypewriter';

export interface TypewriterTextProps extends UseTypewriterOptions {
  className?: string;
  onComplete?: () => void;
}

export function TypewriterText({
  className,
  onComplete,
  ...options
}: TypewriterTextProps) {
  const { display, done } = useTypewriter(options);

  useEffect(() => {
    if (done) onComplete?.();
  }, [done, onComplete]);

  return <span className={className}>{display}</span>;
}
