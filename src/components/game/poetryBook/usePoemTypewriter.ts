import { useCallback, useEffect, useRef, useState } from 'react';

/* PRESENTATION FIX (v4.48): стихотворный тайпрайтер «дышит» без правки
 * текста: пауза после знаков препинания (в долях speed), на конце строки
 * и удвоенная на строфах (пустые строки). */
function punctuationPauseFactor(ch: string): number {
  switch (ch) {
    case '.':
    case '!':
    case '?':
    case '…':
      return 5;
    case '—':
    case '–':
    case ':':
    case ';':
      return 3;
    case ',':
      return 1.5;
    default:
      return 0;
  }
}

export function usePoemTypewriter(
  lines: string[],
  active: boolean,
  reducedMotion: boolean,
  speed = 45,
) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const rafIdRef = useRef<number>(0);
  const stateRef = useRef({
    lineIdx: 0,
    charIdx: 0,
    current: [] as string[],
    done: false,
    active: false,
  });

  useEffect(() => {
    cancelAnimationFrame(rafIdRef.current);

    if (!active || lines.length === 0) {
      stateRef.current = { lineIdx: 0, charIdx: 0, current: [], done: true, active: false };
      setDisplayedLines([]);
      setDone(false);
      return;
    }

    if (reducedMotion) {
      stateRef.current = {
        lineIdx: lines.length,
        charIdx: 0,
        current: [...lines],
        done: true,
        active: true,
      };
      setDisplayedLines([...lines]);
      setDone(true);
      return;
    }

    stateRef.current = { lineIdx: 0, charIdx: 0, current: [], done: false, active: true };
    setDisplayedLines([]);
    setDone(false);
    let lastUpdate = -Infinity;

    const tick = (timestamp: number) => {
      const st = stateRef.current;
      if (st.done || !st.active) return;

      if (timestamp - lastUpdate >= speed) {
        lastUpdate = timestamp;

        if (st.lineIdx >= lines.length) {
          st.done = true;
          setDone(true);
          return;
        }

        const line = lines[st.lineIdx]!;
        st.charIdx++;

        if (line === '') {
          // Строфа — длинная пауза тишины между блоками стиха
          st.current[st.lineIdx] = '';
          st.lineIdx++;
          st.charIdx = 0;
          lastUpdate += speed * 12;
        } else {
          st.current[st.lineIdx] = line.slice(0, st.charIdx);
          if (st.charIdx >= line.length) {
            st.lineIdx++;
            st.charIdx = 0;
            // Конец стихотворной строки — пауза перед следующей
            lastUpdate += speed * 7;
          } else {
            // v4.48: пауза после только что напечатанного знака
            const justTyped = line[st.charIdx - 1] ?? '';
            lastUpdate += speed * punctuationPauseFactor(justTyped);
          }
        }

        setDisplayedLines([...st.current]);
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [lines, active, reducedMotion, speed]);

  const skipAll = useCallback(() => {
    const st = stateRef.current;
    st.current = [...lines];
    st.done = true;
    cancelAnimationFrame(rafIdRef.current);
    setDisplayedLines([...lines]);
    setDone(true);
  }, [lines]);

  const effectiveLines = active ? displayedLines : [];
  const effectiveDone = active ? done : false;

  return { displayedLines: effectiveLines, done: effectiveDone, skipAll };
}
