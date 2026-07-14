'use client';

/* ─── Data Terminal Overlay — Atmospheric hacking mini-game UI ─── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Constants ─── */

/** Z-index above dialogue (30) toasts (35) — same layer as loot notifications. */
const TERMINAL_Z_INDEX = UI_LAYERS.TOASTS + 5;

/** Decryption duration per difficulty (ms). */
const DECRYPTION_DURATION_MS: Record<string, number> = {
  easy: 3000,
  medium: 4000,
  hard: 5000,
};

/** Failure probability per difficulty. */
const FAILURE_CHANCE: Record<string, number> = {
  easy: 0.15,
  medium: 0.3,
  hard: 0.5,
};

/** ASCII art header. */
const TERMINAL_HEADER = `
╔══════════════════════════════════════════════════╗
║     ╔═╗ ╦ ╦╔═╗╔═╗╦  ╦╔═╗╦═╗╦╔═╦═╗╦ ╦     ║
║     ║  ╠═╣║╣ ╠═╣║  ║║  ╠╦╝║╠╗║╣ ╚╦╝     ║
║     ╚═╝╩ ╩╚═╝╩ ╩╩═╝╩╚═╝╩╚═╩╚═╩═╝ ╩      ║
║          T E R M I N A L  v0.9.7           ║
╚══════════════════════════════════════════════════╝`.trim();

/** Matrix-style code fragments that scroll up. */
const CODE_FRAGMENTS = [
  '0x4F70656E2073657373696F6E',
  'ENCRYPT: AES-256-GCM >>> DECRYPTING...',
  'ssh root@192.168.1.42 -p 2222',
  'cat /etc/shadow | grep volodka',
  'openssl enc -d -aes-256-cbc -in payload.bin',
  'nmap -sV --script=vuln 10.0.0.0/24',
  'WARNING: firewall detected at 10.0.0.1',
  'hashcat -m 1000 hashes.txt /usr/share/wordlists/rockyou.txt',
  'python3 exploit.py --target 10.0.0.42 --payload reverse_shell',
  'aircrack-ng -w wordlist.txt capture-01.cap',
  'john --wordlist=/usr/share/wordlists/custom.txt hashes',
  'CVE-2024-XXXX: buffer overflow in kernel module',
  'SELECT * FROM users WHERE password IS NULL;',
  'DEBUG: memory dump at 0x7FFE0000',
  'kern.log: [ERROR] stack corruption at frame 0x12',
  'iptables -A INPUT -s 10.0.0.0/24 -j DROP',
  'dd if=/dev/zero of=/dev/sda bs=1M count=1',
  'rsync -avz --progress src/ root@backup:/mnt/volodka/',
  'tmux new-session -d -s hack "watch nethogs"',
  'strace -p $(pgrep -f target_service)',
  'gdb -batch -ex "set disassembly-flavor intel" -ex "disas" ./binary',
  'objdump -d -M intel binary | head -100',
  'perf top -g -p $(pgrep process)',
  'tcpdump -i eth0 -w capture.pcap port 443',
  'curl -k https://api.darknet.local/v2/tokens',
  'TOKEN: eyJhbGciOiJIUzI1NiJ9...',
  'ACCESS GRANTED >>> continuing...',
  'brute_force: attempt 847/9999 [===>    ] 8%',
  'CRACKING: md5($pass.$salt) === target_hash',
  'SCANNING: ports 1-65535 on target...',
  'FOUND: open port 22 (SSH) at 10.0.0.42',
  'FOUND: open port 443 (HTTPS) at 10.0.0.42',
  'TUNNEL: establishing SOCKS5 proxy...',
  'PROXY: 10.0.0.42:1080 -> INTERNET',
  'DATA EXFILTRATION: 2.4MB / 10MB [====>  ]',
  'PACKET FRAGMENTATION: reassembling TCP stream...',
  'CERTIFICATE PIN: SHA256:a3f8b2c1d4e5...',
];

/* ─── Types ─── */

type TerminalDifficulty = 'easy' | 'medium' | 'hard';
type TerminalPhase = 'decrypting' | 'success' | 'failure';

interface TerminalState {
  difficulty: TerminalDifficulty;
  title: string;
  reward?: string;
  phase: TerminalPhase;
  progress: number;
  codeLines: string[];
}

/* ─── Helpers ─── */

function pickRandomCodeLine(existing: string[]): string {
  const pool = CODE_FRAGMENTS.filter((line) => !existing.includes(line));
  const line = pool.length > 0 ? pool : CODE_FRAGMENTS;
  return line[Math.floor(Math.random() * line.length)];
}

/* ─── Component ─── */

export function DataTerminalOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  const [state, setState] = useState<TerminalState | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const codeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearAllTimers = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (codeTimerRef.current) {
      clearInterval(codeTimerRef.current);
      codeTimerRef.current = null;
    }
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearAllTimers();
    setState(null);
  }, [clearAllTimers]);

  const startHacking = useCallback(
    (difficulty: TerminalDifficulty, title: string, reward?: string) => {
      clearAllTimers();

      const duration = DECRYPTION_DURATION_MS[difficulty] ?? 4000;
      const failChance = FAILURE_CHANCE[difficulty] ?? 0.3;
      const success = Math.random() > failChance;

      const initialCodeLines = Array.from({ length: 3 }, () =>
        pickRandomCodeLine([]),
      );

      setState({
        difficulty,
        title,
        reward,
        phase: 'decrypting',
        progress: 0,
        codeLines: initialCodeLines,
      });

      // Progress bar
      const startTime = Date.now();
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / duration) * 100);

        setState((prev) => {
          if (!prev || prev.phase !== 'decrypting') return prev;
          return { ...prev, progress: pct };
        });

        if (pct >= 100) {
          if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
          }

          const finalPhase: TerminalPhase = success ? 'success' : 'failure';
          setState((prev) => {
            if (!prev) return prev;
            return { ...prev, phase: finalPhase, progress: 100 };
          });

          if (success) {
            dismissTimerRef.current = setTimeout(() => {
              setState((prev) => {
                if (!prev || prev.phase !== 'success') return prev;
                return null;
              });

              // Toast notification on success
              eventBus.emit('toast:add', {
                id: `terminal-success-${Date.now()}`,
                type: 'skill',
                message: reward
                  ? `Взлом успешен: ${reward}`
                  : 'Данные расшифрованы!',
                timestamp: Date.now(),
              });
            }, 2000);
          }
        }
      }, 50);

      // Scrolling code lines
      codeTimerRef.current = setInterval(() => {
        setState((prev) => {
          if (!prev || prev.phase !== 'decrypting') return prev;
          const newLine = pickRandomCodeLine(prev.codeLines);
          const updated = [...prev.codeLines, newLine];
          // Keep last 8 lines
          if (updated.length > 8) updated.shift();
          return { ...prev, codeLines: updated };
        });
      }, reducedMotion ? 600 : 350);
    },
    [clearAllTimers, reducedMotion],
  );

  const retry = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    startHacking(current.difficulty, current.title, current.reward);
  }, [startHacking]);

  // Listen for EventBus event
  useEffect(() => {
    const unsub = eventBus.on('ui:data_terminal', (payload) => {
      startHacking(payload.difficulty, payload.title, payload.reward);
    });
    return unsub;
  }, [startHacking]);

  // Cleanup on unmount
  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          key="data-terminal"
          data-testid="data-terminal-overlay"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: TERMINAL_Z_INDEX }}
          role="dialog"
          aria-modal="true"
          aria-label={`Терминал: ${state.title}`}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={state.phase === 'failure' ? undefined : undefined}
            aria-hidden="true"
          />

          {/* Terminal window */}
          <motion.div
            className="relative w-full max-w-2xl mx-4 rounded-lg border border-green-500/40 overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(0,20,0,0.98) 0%, rgba(0,10,0,0.99) 100%)',
              boxShadow:
                '0 0 40px rgba(0,255,0,0.08), inset 0 0 60px rgba(0,255,0,0.03)',
            }}
            initial={reducedMotion ? false : { y: 20 }}
            animate={{ y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-green-500/30 bg-green-900/20">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="flex-1 text-center text-xs font-mono text-green-400/70 tracking-wider">
                {state.title}
              </span>
              <span className="text-[10px] font-mono text-green-500/40">
                [{state.difficulty.toUpperCase()}]
              </span>
            </div>

            {/* ASCII header */}
            <pre
              className="px-4 pt-3 pb-2 text-[8px] sm:text-[9px] leading-tight text-green-500/60 font-mono overflow-x-auto select-none"
              aria-hidden="true"
            >
              {TERMINAL_HEADER}
            </pre>

            {/* Code lines area */}
            <div
              className="h-40 px-4 py-2 overflow-hidden font-mono text-xs select-none"
              aria-hidden="true"
            >
              {state.codeLines.map((line, i) => (
                <motion.div
                  key={`${line}-${i}`}
                  initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 0.7 + (i / state.codeLines.length) * 0.3, x: 0 }}
                  className={`leading-5 truncate ${
                    i === state.codeLines.length - 1
                      ? 'text-green-400'
                      : 'text-green-600/60'
                  }`}
                  style={{ textShadow: i === state.codeLines.length - 1 ? '0 0 6px rgba(0,255,0,0.4)' : 'none' }}
                >
                  {i === state.codeLines.length - 1 ? '> ' : '  '}
                  {line}
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-green-500/50 w-24 shrink-0">
                  {state.phase === 'decrypting'
                    ? `DECRYPT: ${Math.round(state.progress)}%`
                    : state.phase === 'success'
                      ? 'DECRYPT: 100%'
                      : 'DECRYPT: FAILED'}
                </span>
                <div className="flex-1 h-2 bg-green-900/30 rounded-full overflow-hidden border border-green-500/20">
                  <motion.div
                    className={`h-full rounded-full ${
                      state.phase === 'success'
                        ? 'bg-green-400'
                        : state.phase === 'failure'
                          ? 'bg-red-500'
                          : 'bg-green-500'
                    }`}
                    style={{
                      boxShadow:
                        state.phase !== 'failure'
                          ? '0 0 8px rgba(0,255,0,0.4)'
                          : '0 0 8px rgba(255,0,0,0.4)',
                    }}
                    animate={{ width: `${state.progress}%` }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                  />
                </div>
              </div>
            </div>

            {/* Result screen */}
            <AnimatePresence mode="wait">
              {state.phase === 'success' && (
                <motion.div
                  key="success"
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-4 py-3 border-t border-green-500/20 text-center"
                >
                  <p
                    className="text-sm font-mono font-bold text-green-400 mb-1"
                    style={{ textShadow: '0 0 12px rgba(0,255,0,0.5)' }}
                  >
                    {'>>> ДОСТУП РАЗРЕШЁН <<<'}
                  </p>
                  {state.reward && (
                    <p className="text-xs font-mono text-green-500/60">
                      Награда: {state.reward}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-green-600/40 mt-1">
                    Окно закроется автоматически...
                  </p>
                </motion.div>
              )}

              {state.phase === 'failure' && (
                <motion.div
                  key="failure"
                  initial={reducedMotion ? false : { x: 0 }}
                  animate={
                    reducedMotion
                      ? {}
                      : {
                          x: [0, -8, 8, -6, 6, -3, 3, 0],
                          transition: { duration: 0.5 },
                        }
                  }
                  exit={{ opacity: 0 }}
                  className="px-4 py-3 border-t border-red-500/20 text-center"
                >
                  <p
                    className="text-sm font-mono font-bold text-red-400 mb-1"
                    style={{ textShadow: '0 0 12px rgba(255,0,0,0.4)' }}
                  >
                    {'>>> ОШИБКА РАСШИФРОВКИ <<<'}
                  </p>
                  <p className="text-xs font-mono text-red-500/50 mb-2">
                    Файрвол обнаружил вторжение. Попробуйте снова.
                  </p>
                  <button
                    onClick={retry}
                    className="px-4 py-1.5 rounded border border-red-500/40 bg-red-900/20
                               text-xs font-mono text-red-300 hover:bg-red-900/40
                               hover:border-red-500/60 transition-colors focus:outline-none
                               focus-visible:ring-2 focus-visible:ring-red-500/50"
                  >
                    [ ПОВТОРИТЬ ПОПЫТКУ ]
                  </button>
                  <button
                    onClick={dismiss}
                    className="ml-2 px-4 py-1.5 rounded border border-slate-500/30 bg-slate-800/20
                               text-xs font-mono text-slate-400 hover:bg-slate-700/30
                               hover:border-slate-500/50 transition-colors focus:outline-none
                               focus-visible:ring-2 focus-visible:ring-slate-500/50"
                  >
                    [ ОТМЕНА ]
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scanline effect (non-reduced motion) */}
            {!reducedMotion ? (
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                aria-hidden="true"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.15) 2px, rgba(0,255,0,0.15) 4px)',
                }}
              />
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}