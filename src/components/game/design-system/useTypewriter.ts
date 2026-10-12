import { useEffect, useState } from 'react';

export interface UseTypewriterOptions {
  text: string;
  /** ms per character */
  speed?: number;
  /** delay before typing starts */
  delay?: number;
  /** start only when true */
  active?: boolean;
}

/* PRESENTATION FIX (v4.48): паузы на знаках — поэзия «дышит» без правки
 * текста. Точка/восклицание — длинная пауза, запятая — короткая, тире —
 * средняя. Оценка в долях speed, чтобы масштабировалась с настройкой. */
function punctuationPauseMs(ch: string, speed: number): number {
  switch (ch) {
    case '.':
    case '!':
    case '?':
    case '…':
      return speed * 6;
    case '—':
    case '–':
    case ':':
    case ';':
      return speed * 3.5;
    case ',':
      return speed * 2;
    default:
      return 0;
  }
}

/** Shared typewriter hook for menu subtitles + intro prose. */
export function useTypewriter({
  text,
  speed = 35,
  delay = 0,
  active = true,
}: UseTypewriterOptions): { display: string; done: boolean } {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplay('');
      setDone(false);
      return;
    }
    let cancelled = false;
    let charIndex = 0;
    setDisplay('');
    setDone(false);

    const startTimer = setTimeout(() => {
      const tick = () => {
        if (cancelled) return;
        charIndex += 1;
        setDisplay(text.slice(0, charIndex));
        if (charIndex >= text.length) {
          setDone(true);
          return;
        }
        // v4.48: пауза после только что напечатанного знака препинания
        const justTyped = text[charIndex - 1] ?? '';
        setTimeout(tick, speed + punctuationPauseMs(justTyped, speed));
      };
      tick();
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [text, speed, delay, active]);

  return { display, done };
}
