'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UsePoemLineTypewriterOptions {
  lines: string[];
  /** Пауза печати (интро / внутренний голос) */
  paused?: boolean;
  msPerChar: number;
  /** Пауза после полной строки (непустой) */
  pauseAfterLineMs: number;
  pauseAfterEmptyLineMs?: number;
  /** После показа всех строк — задержка перед `onFinished` и `isComplete` */
  finishDelayMs?: number;
  onFinished?: () => void;
}

/**
 * Посимвольная печать массива строк (стих, проза).
 * Используется в `PoemComponents` (печать стихов / интро).
 */
export function usePoemLineTypewriter({
  lines,
  paused = false,
  msPerChar,
  pauseAfterLineMs,
  pauseAfterEmptyLineMs = 300,
  finishDelayMs = 0,
  onFinished,
}: UsePoemLineTypewriterOptions) {
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const linesKey = lines.join('\u0001');
  const finishedForLinesKeyRef = useRef<string | null>(null);

  useEffect(() => {
    finishedForLinesKeyRef.current = null;
    setCurrentLineIndex(0);
    setDisplayedLines([]);
    setCurrentLineText('');
    setCharIndex(0);
    setIsComplete(false);
  }, [linesKey]);

  useEffect(() => {
    if (paused) return;

    const L = linesRef.current;
    if (L.length === 0) {
      if (finishedForLinesKeyRef.current === linesKey) return;
      const t = window.setTimeout(() => {
        finishedForLinesKeyRef.current = linesKey;
        setIsComplete(true);
        onFinishedRef.current?.();
      }, finishDelayMs);
      return () => window.clearTimeout(t);
    }

    if (currentLineIndex >= L.length) {
      if (!isComplete) {
        const fire = () => {
          setIsComplete(true);
          onFinishedRef.current?.();
        };
        const t = finishDelayMs <= 0 ? window.setTimeout(fire, 0) : window.setTimeout(fire, finishDelayMs);
        return () => window.clearTimeout(t);
      }
      return;
    }

    const currentLine = L[currentLineIndex];

    if (charIndex < currentLine.length) {
      const t = window.setTimeout(() => {
        setCurrentLineText(currentLine.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, msPerChar);
      return () => window.clearTimeout(t);
    }

    const pause = currentLine === '' ? pauseAfterEmptyLineMs : pauseAfterLineMs;
    const t = window.setTimeout(() => {
      setDisplayedLines((prev) => [...prev, currentLine]);
      setCurrentLineText('');
      setCharIndex(0);
      setCurrentLineIndex((i) => i + 1);
    }, pause);
    return () => window.clearTimeout(t);
  }, [
    paused,
    currentLineIndex,
    charIndex,
    linesKey,
    msPerChar,
    pauseAfterLineMs,
    pauseAfterEmptyLineMs,
    finishDelayMs,
    isComplete,
  ]);

  const resetTyping = useCallback(() => {
    setCurrentLineIndex(0);
    setDisplayedLines([]);
    setCurrentLineText('');
    setCharIndex(0);
    setIsComplete(false);
  }, []);

  return {
    displayedLines,
    currentLineText,
    currentLineIndex,
    charIndex,
    isComplete,
    resetTyping,
  };
}
