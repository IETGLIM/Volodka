"use client";

import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { POEMS, getPoemById, MAIN_ARCHIVE_POEM_COUNT, isBonusPoem } from '@/data/poems';
import type { Poem } from '@/data/poems';

// ============================================
// TYPES
// ============================================

interface PoetryBookProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// CYBERPUNK TERMINAL HEADER
// ============================================

const TerminalHeader = memo(function TerminalHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/15 bg-black/40">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
      </div>
      <span className="font-mono text-[10px] text-cyan-500/40 tracking-wider">
        volodka://poetry/{subtitle}
      </span>
      <div className="w-12" />
    </div>
  );
});

// ============================================
// CYBERPUNK PROGRESS BAR
// ============================================

const CyberProgressBar = memo(function CyberProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;
  const hexCurrent = current.toString(16).toUpperCase().padStart(2, '0');
  const hexTotal = total.toString(16).toUpperCase().padStart(2, '0');

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[10px] text-cyan-500/40 tracking-wider">
          FRAGMENTS RECOVERED
        </span>
        <span className="font-mono text-xs text-cyan-400" style={{ textShadow: '0 0 8px rgba(0,255,255,0.4)' }}>
          0x{hexCurrent}/0x{hexTotal}
        </span>
      </div>
      <div
        className="relative h-2 bg-slate-900/80 overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
          border: '1px solid rgba(0, 255, 255, 0.15)',
        }}
      >
        <motion.div
          className="h-full"
          style={{
            background: 'linear-gradient(90deg, #00ffff, #00cc99, #ff00ff)',
            backgroundSize: '200% 100%',
            animation: 'gradient-shift 3s linear infinite',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.4)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8 }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            backgroundSize: '50% 100%',
            animation: 'cyber-scan 1.5s linear infinite',
          }}
        />
      </div>
      <div className="flex justify-between">
        <span className="font-mono text-[10px] text-cyan-500/30 tracking-wider">
          {current} / {total}
        </span>
        <span className="font-mono text-[10px] text-cyan-500/30 tracking-wider">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
});

// ============================================
// POEM VIEW — ENHANCED CYBERPUNK
// ============================================

interface PoemViewProps {
  poem: Poem;
  onBack: () => void;
}

const PoemView = memo(function PoemView({ poem, onBack }: PoemViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when poem opens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [poem.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex h-full min-h-0 flex-col"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад к списку"
          className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center border border-cyan-500/20 font-mono text-cyan-400/60 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
          }}
        >
          &lt;
        </button>
        <div className="flex-1">
          <h2
            className="text-xl font-bold font-mono tracking-wider uppercase"
            style={{
              background: 'linear-gradient(90deg, #00ffff, #ff8c00, #00ffff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {poem.title}
          </h2>
          <p className="font-mono text-xs text-cyan-500/40 tracking-wider mt-0.5">
            {poem.author} {'//'} ORDER_{poem.order}
          </p>
        </div>
      </div>

      {/* Intro — terminal style */}
      {poem.intro && (
        <div
          className="mb-4 p-3 bg-black/40 border-l-2 border-amber-500/40"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
          }}
        >
          <p className="font-mono text-xs text-amber-300/60 leading-relaxed">
            <span className="text-amber-500/40 mr-2">&gt;</span>
            {poem.intro}
          </p>
        </div>
      )}

      {/* Poem content — cyberpunk terminal with auto-scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 game-scrollbar" style={{ scrollBehavior: 'smooth' }}>
        <div
          className="p-4 bg-black/30 border border-cyan-500/10"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          }}
        >
          {poem.lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className={`font-mono text-base leading-relaxed whitespace-pre-line ${
                line === ''
                  ? 'h-4'
                  : line.startsWith('___')
                  ? 'text-cyan-500/30 text-sm my-2'
                  : 'text-cyan-100/90'
              }`}
              style={{
                textShadow: '0 0 8px rgba(0, 255, 255, 0.15)',
              }}
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>

      {/* Themes — cyberpunk tags */}
      <div className="mt-4 pt-3 border-t border-cyan-500/15">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[10px] text-cyan-500/40 tracking-wider">TAGS:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {poem.themes.map((theme, i) => (
            <span
              key={i}
              className="px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase border"
              style={{
                background: 'rgba(0, 255, 255, 0.05)',
                borderColor: 'rgba(0, 255, 255, 0.2)',
                color: 'rgba(0, 255, 255, 0.6)',
                clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))',
              }}
            >
              {theme}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

// ============================================
// POEM LIST ITEM — COLLECTED
// ============================================

const CollectedPoemItem = memo(function CollectedPoemItem({ poem, onClick }: { poem: Poem; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full p-3 text-left transition-all overflow-hidden"
      style={{
        background: isHovered ? 'rgba(0, 255, 255, 0.08)' : 'rgba(0, 255, 255, 0.03)',
        border: `1px solid ${isHovered ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 255, 255, 0.1)'}`,
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        boxShadow: isHovered ? '0 0 15px rgba(0, 255, 255, 0.15)' : 'none',
      }}
    >
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.06) 50%, transparent 100%)',
            backgroundSize: '50% 100%',
            animation: 'cyber-scan 1.5s linear infinite',
          }}
        />
      )}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] text-cyan-500/40"
              style={{ textShadow: '0 0 6px rgba(0,255,255,0.3)' }}
            >
              [{poem.order.toString(16).toUpperCase().padStart(2, '0')}]
            </span>
            <h3 className="font-mono text-sm text-cyan-200/90 tracking-wider uppercase truncate">
              {poem.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {poem.themes.slice(0, 3).map((theme, i) => (
              <span
                key={i}
                className="font-mono text-[9px] text-cyan-500/40 tracking-wider"
              >
                {theme}{i < Math.min(poem.themes.length, 3) - 1 ? ' /' : ''}
              </span>
            ))}
          </div>
        </div>
        <div
          className="w-6 h-6 flex items-center justify-center border border-cyan-500/20"
          style={{
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            background: 'rgba(0, 255, 255, 0.1)',
          }}
        >
          <span className="text-[10px] text-cyan-400/60">R</span>
        </div>
      </div>
    </motion.button>
  );
});

// ============================================
// LOCKED POEM ITEM
// ============================================

const LockedPoemItem = memo(function LockedPoemItem({ poem }: { poem: Poem }) {
  return (
    <div
      className="w-full p-3 opacity-40"
      style={{
        background: 'rgba(30, 30, 40, 0.4)',
        border: '1px solid rgba(100, 100, 120, 0.1)',
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-600">
            [{poem.order.toString(16).toUpperCase().padStart(2, '0')}]
          </span>
          <h3 className="font-mono text-sm text-slate-600 tracking-wider uppercase">
            FRAGMENT LOCKED
          </h3>
        </div>
        <span className="font-mono text-[10px] text-red-500/40 tracking-wider">RESTRICTED</span>
      </div>
    </div>
  );
});

// ============================================
// MAIN POETRY BOOK — CYBERPUNK TERMINAL
// ============================================

export const PoetryBook = memo(function PoetryBook({ isOpen, onClose }: PoetryBookProps) {
  const collectedPoemIds = useGameStore((s) => s.collectedPoemIds);
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);

  const collectedPoems = useMemo(() => {
    return collectedPoemIds
      .map(id => getPoemById(id))
      .filter((p): p is Poem => p !== undefined)
      .sort((a, b) => a.order - b.order);
  }, [collectedPoemIds]);

  const collectedMainPoems = useMemo(
    () => collectedPoems.filter((p) => !isBonusPoem(p)),
    [collectedPoems],
  );

  const lockedPoems = useMemo(() => {
    return POEMS
      .filter((p) => !isBonusPoem(p) && !collectedPoemIds.includes(p.id))
      .sort((a, b) => a.order - b.order);
  }, [collectedPoemIds]);

  const selectedPoem = selectedPoemId ? getPoemById(selectedPoemId) : null;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.92)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative h-[min(85vh,800px)] max-h-[85vh] w-full max-w-[min(95vw,42rem)] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(5, 8, 15, 0.98) 0%, rgba(10, 15, 25, 0.98) 100%)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), 0 0 80px rgba(0, 255, 255, 0.05), inset 0 0 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal header */}
        <TerminalHeader title="POETRY DATABASE" subtitle="archive" />

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
          }}
        />

        {/* CRT sweep */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent)',
            }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-8 h-8 border-l border-t border-cyan-500/30" />
        <div className="absolute top-2 right-2 w-8 h-8 border-r border-t border-cyan-500/30" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-l border-b border-cyan-500/30" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-r border-b border-cyan-500/30" />

        {/* Content */}
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden p-5" style={{ paddingTop: '2.5rem' }}>
          <AnimatePresence mode="wait">
            {selectedPoem ? (
              <PoemView
                key="poem-view"
                poem={selectedPoem}
                onBack={() => setSelectedPoemId(null)}
              />
            ) : (
              <motion.div
                key="poem-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-0 flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 flex items-center justify-center border border-cyan-500/30 bg-cyan-500/5"
                      style={{
                        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                      }}
                    >
                      <span className="text-cyan-400/60 text-xs font-mono">P</span>
                    </div>
                    <div>
                      <h2
                        className="text-lg font-mono tracking-[0.15em] uppercase font-bold"
                        style={{
                          background: 'linear-gradient(90deg, #00ffff, #ff8c00)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        Архив стихов
                      </h2>
                      <p className="font-mono text-[10px] text-cyan-500/40 tracking-wider">
                        VOLodka.exe // POETRY_DATABASE
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть"
                    className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center border border-cyan-500/20 font-mono text-cyan-400/40 transition-all hover:border-red-500/40 hover:text-red-400"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
                    }}
                  >
                    X
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <CyberProgressBar current={collectedMainPoems.length} total={MAIN_ARCHIVE_POEM_COUNT} />
                </div>

                {/* Divider */}
                <div
                  className="h-px mb-3"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), rgba(255, 140, 0, 0.2), transparent)',
                  }}
                />

                {/* Poem list */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 game-scrollbar">
                  {collectedPoems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div
                        className="w-16 h-16 flex items-center justify-center mb-4 border border-cyan-500/20"
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                          background: 'rgba(0, 255, 255, 0.05)',
                        }}
                      >
                        <span className="text-cyan-400/40 text-lg font-mono">?</span>
                      </div>
                      <p className="font-mono text-sm text-cyan-500/40 tracking-wider uppercase mb-2">
                        NO FRAGMENTS RECOVERED
                      </p>
                      <p className="font-mono text-xs text-slate-600 leading-relaxed max-w-xs">
                        Исследуй мир и принимай решения — стихи открываются
                        через сюжетные события и выборы.
                      </p>
                    </div>
                  )}

                  {collectedPoems.map((poem) => (
                    <CollectedPoemItem
                      key={poem.id}
                      poem={poem}
                      onClick={() => setSelectedPoemId(poem.id)}
                    />
                  ))}

                  {lockedPoems.length > 0 && (
                    <div className="py-2">
                      <span className="font-mono text-[10px] text-slate-600 tracking-wider">
                        {'//'} LOCKED FRAGMENTS: {lockedPoems.length}
                      </span>
                    </div>
                  )}

                  {lockedPoems.map((poem) => (
                    <LockedPoemItem key={poem.id} poem={poem} />
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-cyan-500/10">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-cyan-500/25 tracking-wider">
                      v2.0.77 // MEMORIAL BUILD
                    </span>
                    <span className="font-mono text-[10px] text-cyan-500/25 tracking-wider">
                      ИССЛЕДУЙ МИР
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default PoetryBook;
