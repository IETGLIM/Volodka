'use client';

/* ─── Terminal Call Cutscene — bash-green terminal + guild call (v4.48.13) ───
 *
 * QA report: «при выборе терминала должна быть кат-сцена с экраном терминала
 * и созвоном с коллегами или чатом в чёрно-зелёной классической цветовой
 * схеме баша».
 *
 * Plays between the room-terminal interaction and the QTE/minigame chain
 * (see engine/interaction/terminalCallFlow.ts). Two stages:
 *   1. boot  — root@volodka session types the incident #4729 log;
 *   2. call  — guild call channel: colleagues chat in classic bash colors.
 * Skippable at any moment (Esc / button); locomotion is locked by the
 * cutscene game phase for the whole duration.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { completeTerminalCall } from '@/engine/interaction/terminalCallFlow';

/* ─── Palette — classic black-green bash ─── */
const GREEN = '#33ff77';
const GREEN_DIM = '#1f9947';
const GREEN_BRIGHT = '#8dffb2';
const GREEN_FAINT = 'rgba(51,255,119,0.35)';
const BG = 'rgba(2,8,4,0.96)';

/** Script step: a terminal/chat line with its own reveal delay. */
interface ScriptLine {
  kind: 'log' | 'prompt' | 'sys' | 'chat' | 'join';
  /** Speaker handle for chat lines. */
  who?: string;
  text: string;
  /** ms after the previous line. */
  delay: number;
}
const BOOT_SCRIPT: ScriptLine[] = [
  { kind: 'log', text: 'Last login: пт 03:46:51 от tty1', delay: 350 },
  { kind: 'prompt', text: 'journalctl -u guild-agent --since "03:40" --no-pager', delay: 420 },
  { kind: 'log', text: 'guild-agent[4729]: WARNING обнаружен инцидент #4729', delay: 520 },
  { kind: 'log', text: 'guild-agent[4729]: требуется диагностика · явка обязательна', delay: 480 },
  { kind: 'prompt', text: 'ping guild.hq -c 1', delay: 620 },
  { kind: 'log', text: '1 пакет отправлен, 1 получен: 0% потерь, time 12.4 мс', delay: 560 },
  { kind: 'prompt', text: 'guild call --join --channel incident-4729', delay: 700 },
  { kind: 'log', text: 'Устанавливаю защищённое соединение...', delay: 640 },
];

const CALL_SCRIPT: ScriptLine[] = [
  { kind: 'join', text: '● Александр подключился к каналу', delay: 400 },
  { kind: 'chat', who: 'Александр', text: 'Володька, ты получил уведомление по #4729?', delay: 1100 },
  { kind: 'chat', who: 'Коллега', text: 'логи опять сыпятся. третий раз за ночь.', delay: 1300 },
  { kind: 'chat', who: 'Дмитрий', text: 'я проверил диффы. хвост уходит в архивы, которые стёрли после Краха.', delay: 1600 },
  { kind: 'chat', who: 'Александр', text: 'поэтому диагностику ставят на тебя. офис через час, не опаздывай.', delay: 1700 },
  { kind: 'chat', who: 'volodka', text: 'понял. посмотрю логи и буду.', delay: 1500 },
  { kind: 'sys', text: '[соединение с guild.hq завершено · 03:47:22]', delay: 1400 },
];

type CallPhase = 'boot' | 'call' | 'done';

function lineColor(line: ScriptLine): string {
  switch (line.kind) {
    case 'prompt': return GREEN_BRIGHT;
    case 'chat': return GREEN;
    case 'join': return GREEN_FAINT;
    case 'sys': return GREEN_FAINT;
    default: return GREEN_DIM;
  }
}

function renderLine(line: ScriptLine, i: number): string {
  if (line.kind === 'prompt') return `root@volodka:~# ${line.text}`;
  if (line.kind === 'chat') return `[03:47:${String(10 + i * 2).padStart(2, '0')}] <${line.who}> ${line.text}`;
  return line.text;
}

/** TerminalCallCutscene — mounts in the gameplay layer; opens on `terminal_call:start`. */
export function TerminalCallCutscene() {
  const reducedMotion = useEffectiveReducedMotion();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<CallPhase>('boot');
  /** How many lines of the CURRENT phase script are visible. */
  const [visibleLines, setVisibleLines] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<CallPhase>('boot');
  phaseRef.current = phase;

  const script = useMemo<ScriptLine[]>(
    // 'done' keeps the CALL script visible under the continue button.
    () => (phase === 'boot' ? BOOT_SCRIPT : CALL_SCRIPT),
    [phase],
  );
  const scriptRef = useRef(script);
  scriptRef.current = script;

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTimer();
    setOpen(false);
    // Engine flow: clears the cutscene phase and resumes the terminal chain.
    completeTerminalCall();
  }, [clearTimer]);

  const advanceLine = useCallback(() => {
    setVisibleLines((n) => {
      const total = scriptRef.current.length;
      if (n < total) {
        const next = n + 1;
        const step = scriptRef.current[next - 1];
        const delay = reducedMotion ? 0 : Math.max(120, step?.delay ?? 300);
        timerRef.current = setTimeout(advanceLine, delay);
        return next;
      }
      // Script finished — move to the next stage.
      if (phaseRef.current === 'boot') {
        setPhase('call');
        setVisibleLines(0);
        timerRef.current = setTimeout(advanceLine, reducedMotion ? 0 : 500);
      } else if (phaseRef.current === 'call') {
        setPhase('done');
      }
      return n;
    });
  }, [reducedMotion]);

  /* ── EventBus wiring ── */
  useEffect(() => {
    const unsubStart = eventBus.on('terminal_call:start', () => {
      setPhase('boot');
      setVisibleLines(0);
      setOpen(true);
    });
    const unsubEnd = eventBus.on('terminal_call:end', () => {
      clearTimer();
      setOpen(false);
    });
    return () => {
      unsubStart();
      unsubEnd();
      clearTimer();
    };
  }, [clearTimer]);

  /* ── Script ticker ── */
  useEffect(() => {
    if (!open) return;
    clearTimer();
    setVisibleLines(0);
    timerRef.current = setTimeout(advanceLine, reducedMotion ? 0 : 350);
    return clearTimer;
    // Restart the ticker when the stage changes; advanceLine is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, reducedMotion]);

  /* ── Keyboard: Esc / Enter / Space → skip to end ── */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, finish]);

  const shown = script.slice(0, visibleLines);
  const typingMore = visibleLines < script.length;

  /* Без AnimatePresence-exit: скип должен убирать оверлей мгновенно
   * (и детерминированно в headless-средах — exit-анимации там висят). */
  if (!open) return null;

  return (
    <motion.div
          data-testid="terminal-call-cutscene"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
          className="fixed inset-0 flex items-center justify-center px-3"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION, background: 'rgba(1,5,2,0.94)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Созвон с коллегами — инцидент 4729"
        >
          {/* CRT scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(51,255,119,0.07) 2px, rgba(51,255,119,0.07) 4px)',
            }}
          />

          {/* Skip / close — always available */}
          <button
            type="button"
            data-testid="terminal-call-skip"
            onClick={finish}
            aria-label="Пропустить созвон"
            className="absolute top-4 right-4 z-20 px-3 py-2 rounded-lg font-mono text-xs tracking-wider pointer-events-auto transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            style={{
              color: GREEN_DIM,
              border: `1px solid ${GREEN_FAINT}`,
              background: 'rgba(0,0,0,0.5)',
            }}
          >
            ПРОПУСТИТЬ · ESC
          </button>

          <div
            className="relative z-10 w-[min(96vw,760px)] rounded-lg overflow-hidden"
            style={{
              background: BG,
              border: `1px solid ${GREEN_FAINT}`,
              boxShadow: `0 0 48px rgba(51,255,119,0.10), 0 24px 64px rgba(0,0,0,0.6), inset 0 0 80px rgba(51,255,119,0.03)`,
            }}
          >
            {/* Title bar */}
            <div
              className="flex items-center gap-2 px-4 py-2 font-mono text-[11px] tracking-wider"
              style={{ borderBottom: `1px solid ${GREEN_FAINT}`, color: GREEN_DIM, background: 'rgba(51,255,119,0.05)' }}
            >
              <span aria-hidden>●●●</span>
              <span className="ml-1">
                {phase === 'boot'
                  ? 'root@volodka: ~/guild — bash — 80×24'
                  : 'volodka@guild — СОЗВОН · КАНАЛ #incident-4729'}
              </span>
              <span className="ml-auto" aria-hidden>▣</span>
            </div>

            {/* Terminal / chat body */}
            <div
              className="px-4 py-4 sm:px-6 sm:py-5 font-mono text-[12.5px] sm:text-sm leading-relaxed min-h-[300px] max-h-[56vh] overflow-y-auto vk-terminal-scroll"
              style={{ color: GREEN, textShadow: `0 0 12px rgba(51,255,119,0.35)` }}
              aria-live="polite"
              aria-atomic="false"
            >
              {shown.map((line, i) => (
                <p
                  key={`${phase}-${i}`}
                  className="whitespace-pre-wrap break-words"
                  style={{ color: lineColor(line) }}
                >
                  {renderLine(line, i)}
                </p>
              ))}
              {typingMore && <span className="inline-block w-2 animate-pulse" style={{ color: GREEN_BRIGHT }}>▊</span>}

              {!typingMore && phase === 'done' && (
                <button
                  type="button"
                  data-testid="terminal-call-continue"
                  onClick={finish}
                  className="mt-5 w-full py-3 rounded-lg font-mono font-bold text-sm tracking-widest transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                  style={{
                    background: 'linear-gradient(90deg, rgba(20,120,60,0.85), rgba(51,255,119,0.55))',
                    color: '#02130a',
                    border: `1px solid ${GREEN_FAINT}`,
                    boxShadow: '0 0 24px rgba(51,255,119,0.18)',
                  }}
                >
                  ▸ ПРИСТУПИТЬ К ДИАГНОСТИКЕ
                </button>
              )}
            </div>
          </div>
        </motion.div>
  );
}
