
/* ─── Volodka RPG – Poetry collection viewer with Poem Powers (v3) ───
   Parchment/paper texture, decorative borders, page-turn animation,
   serif font, warm amber tint, page numbers.
   NOW WITH: "Поэзия" tab for power management and activation.
   Стихи Владимира Лебедева — неизменяемы.
*/

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Feather, Lock, ChevronLeft, Zap, Clock, ChevronRight } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { POEMS, getMainPoems, getHiddenPoems } from '@/data/poems';
import { getPoemPower, canUsePower, activatePoemPowerById, getCooldownRemaining, getAllPoemPowers } from '@/engine/PoemPowerSystem';
import { audioEngine } from '@/engine/AudioEngine';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { PanelWrapper } from '@/components/game/PanelWrapper';
import { CyberpunkPoemOverlay } from '@/components/game/CyberpunkPoemOverlay';

type PoetryBookTab = 'poems' | 'powers';

interface PoetryBookProps {
  open: boolean;
  onClose: () => void;
}

/* ── Typewriter for poem lines (requestAnimationFrame-based) ── */
function usePoemTypewriter(lines: string[], active: boolean, speed = 45) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const rafIdRef = useRef<number>(0);
  const stateRef = useRef({ lineIdx: 0, charIdx: 0, current: [] as string[], done: false, active: false });

  useEffect(() => {
    // Cancel any previous loop
    cancelAnimationFrame(rafIdRef.current);

    if (!active || lines.length === 0) {
      stateRef.current = { lineIdx: 0, charIdx: 0, current: [], done: true, active: false };
      return;
    }

    stateRef.current = { lineIdx: 0, charIdx: 0, current: [], done: false, active: true };
    let lastUpdate = -Infinity; // Trigger first tick immediately

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

        const line = lines[st.lineIdx];
        st.charIdx++;

        if (line === '') {
          st.current[st.lineIdx] = '';
          st.lineIdx++;
          st.charIdx = 0;
        } else {
          st.current[st.lineIdx] = line.slice(0, st.charIdx);
          if (st.charIdx >= line.length) {
            st.lineIdx++;
            st.charIdx = 0;
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
  }, [lines, active, speed]);

  const skipAll = useCallback(() => {
    const st = stateRef.current;
    st.current = [...lines];
    st.done = true;
    cancelAnimationFrame(rafIdRef.current);
    setDisplayedLines([...lines]);
    setDone(true);
  }, [lines]);

  // When not active, show nothing; when done but active, keep last state
  const effectiveLines = active ? displayedLines : [];
  const effectiveDone = active ? done : false;

  return { displayedLines: effectiveLines, done: effectiveDone, skipAll };
}

/* ── Theme tag component ── */
function ThemeTag({ theme }: { theme: string }) {
  const colors: Record<string, string> = {
    смерть: 'bg-slate-800/60 text-slate-300 border-slate-600/40',
    любовь: 'bg-rose-950/50 text-rose-300 border-rose-700/30',
    отчаяние: 'bg-violet-950/50 text-violet-300 border-violet-700/30',
    надежда: 'bg-amber-950/50 text-amber-300 border-amber-700/30',
    коррупция: 'bg-red-950/50 text-red-300 border-red-700/30',
    память: 'bg-cyan-950/50 text-cyan-300 border-cyan-700/30',
    культура: 'bg-indigo-950/50 text-indigo-300 border-indigo-700/30',
    путь: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/30',
    душа: 'bg-purple-950/50 text-purple-300 border-purple-700/30',
    судьба: 'bg-teal-950/50 text-teal-300 border-teal-700/30',
    одиночество: 'bg-gray-950/50 text-gray-300 border-gray-700/30',
    рождество: 'bg-green-950/50 text-green-300 border-green-700/30',
    дружба: 'bg-amber-950/50 text-amber-300 border-amber-700/30',
    море: 'bg-sky-950/50 text-sky-300 border-sky-700/30',
    поэзия: 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-700/30',
    ирония: 'bg-orange-950/50 text-orange-300 border-orange-700/30',
    детство: 'bg-lime-950/50 text-lime-300 border-lime-700/30',
    творчество: 'bg-pink-950/50 text-pink-300 border-pink-700/30',
    космос: 'bg-blue-950/50 text-blue-300 border-blue-700/30',
    город: 'bg-zinc-950/50 text-zinc-300 border-zinc-700/30',
    вечность: 'bg-stone-950/50 text-stone-300 border-stone-700/30',
    звёзды: 'bg-yellow-950/50 text-yellow-300 border-yellow-700/30',
    мечта: 'bg-sky-950/50 text-sky-300 border-sky-700/30',
    прощание: 'bg-rose-950/50 text-rose-300 border-rose-700/30',
    добро: 'bg-amber-950/50 text-amber-300 border-amber-700/30',
    клевета: 'bg-red-950/50 text-red-300 border-red-700/30',
    прощение: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/30',
    семья: 'bg-warmGray-950/50 text-warmGray-300 border-warmGray-700/30',
    шут: 'bg-orange-950/50 text-orange-300 border-orange-700/30',
    лицемерие: 'bg-red-950/50 text-red-300 border-red-700/30',
    разрушение: 'bg-red-950/50 text-red-300 border-red-700/30',
    альтруизм: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/30',
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full border ${colors[theme] ?? 'bg-slate-800/60 text-slate-300 border-slate-600/40'}`}>
      {theme}
    </span>
  );
}

/* ── Power Button ── */
function PoemPowerButton({ poemId }: { poemId: string }) {
  const [activating, setActivating] = useState(false);
  const [justUsed, setJustUsed] = useState(false);
  const poemPowers = useGameStore((s) => s.poemPowers);
  const activatePoemPower = useGameStore((s) => s.activatePoemPower);

  const power = getPoemPower(poemId);
  const available = canUsePower(poemId);
  const cooldownMs = getCooldownRemaining(poemId);
  const cooldownSec = Math.ceil(cooldownMs / 1000);
  const onCooldown = cooldownMs > 0;

  // Use poemPowers to satisfy the linter (it's in scope but may not be used directly)
  void poemPowers;
  void activatePoemPower;

  const handleActivate = useCallback(() => {
    if (!available || activating || !power) return;

    setActivating(true);
    const success = activatePoemPowerById(poemId);
    if (success) {
      audioEngine.playSfx('quest_complete');
      setJustUsed(true);
      setTimeout(() => setJustUsed(false), 2000);
    }
    setActivating(false);
  }, [poemId, available, activating, power]);

  if (!power) return null;

  return (
    <div className={`mt-4 p-3 rounded-lg border transition-all duration-300 ${
      justUsed
        ? 'border-amber-400/60 bg-amber-950/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
        : available
          ? 'border-amber-800/30 bg-amber-950/10'
          : 'border-stone-800/30 bg-stone-900/20 opacity-60'
    }`}>
      {/* Power name */}
      <div className="flex items-center gap-2 mb-1.5">
        <Zap className={`size-4 ${justUsed ? 'text-amber-400' : available ? 'text-amber-400' : 'text-stone-500'}`} />
        <span className={`text-sm font-medium ${justUsed ? 'text-amber-300' : available ? 'text-amber-300' : 'text-stone-400'}`}>
          {power.name}
        </span>
      </div>

      {/* Power description */}
      <p className="text-xs text-stone-400 mb-3 leading-relaxed">
        {power.description}
      </p>

      {/* Activate button or cooldown */}
      {available ? (
        <Button
          onClick={handleActivate}
          disabled={activating}
          size="sm"
          className="w-full bg-amber-900/30 hover:bg-amber-800/40 text-amber-200 border border-amber-700/30 text-xs"
          variant="outline"
        >
          <Sparkles className="size-3 mr-1.5" />
          {activating ? 'Активация...' : 'Активировать способность'}
        </Button>
      ) : onCooldown ? (
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Clock className="size-3" />
          <span>Перезарядка: {cooldownSec}с</span>
        </div>
      ) : null}

      {/* Glow pulse effect when just used */}
      {justUsed && (
        <motion.div
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute inset-0 rounded-lg border-2 border-amber-400/40 pointer-events-none"
          style={{ boxShadow: '0 0 30px rgba(251,191,36,0.15)' }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   POWER CARD — Individual power card used in the Powers Tab
   ══════════════════════════════════════════════════════════════ */
function PowerCard({ poemId, poemTitle, tick }: { poemId: string; poemTitle: string; tick: number }) {
  const [activating, setActivating] = useState(false);
  const [justUsed, setJustUsed] = useState(false);

  const power = getPoemPower(poemId);

  // Force re-render for cooldown updates via tick
  void tick;

  const available = power ? canUsePower(poemId) : false;
  const cooldownMs = power ? getCooldownRemaining(poemId) : 0;
  const cooldownSec = Math.ceil(cooldownMs / 1000);
  const onCooldown = cooldownMs > 0;
  const cooldownProgress = power ? (cooldownMs / power.cooldownMs) * 100 : 0;

  const handleActivate = useCallback(() => {
    if (!available || activating) return;
    setActivating(true);
    const success = activatePoemPowerById(poemId);
    if (success) {
      audioEngine.playSfx('quest_complete');
      setJustUsed(true);
      setTimeout(() => setJustUsed(false), 2000);
    }
    setActivating(false);
  }, [poemId, available, activating]);

  if (!power) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
        justUsed
          ? 'border-amber-400/60 bg-amber-950/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
          : available
            ? 'border-amber-800/30 bg-amber-950/10 hover:border-amber-600/40'
            : 'border-stone-800/25 bg-stone-900/15'
      }`}
    >
      {/* Cooldown progress bar (background) */}
      {onCooldown && (
        <div
          className="absolute inset-0 bg-stone-800/30 transition-all duration-1000"
          style={{ clipPath: `inset(${100 - cooldownProgress}% 0 0 0)` }}
        />
      )}

      <div className="relative p-4">
        {/* Top row: power icon + name + poem reference */}
        <div className="flex items-start gap-3 mb-2">
          <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
            justUsed
              ? 'bg-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : available
                ? 'bg-amber-900/30'
                : 'bg-stone-800/30'
          }`}>
            <Zap className={`size-4 ${
              justUsed ? 'text-amber-300' : available ? 'text-amber-400' : 'text-stone-500'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-sm font-semibold font-serif ${
                justUsed ? 'text-amber-200' : available ? 'text-amber-200' : 'text-stone-400'
              }`}>
                {power.name}
              </span>
            </div>
            <p className="text-[10px] text-amber-600/40 font-serif">
              Из: «{poemTitle}»
            </p>
          </div>
          {/* Status badge */}
          {available ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-700/30 text-emerald-400/70 shrink-0">
              Готово
            </span>
          ) : onCooldown ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-900/20 border border-amber-700/20 text-amber-500/50 shrink-0 flex items-center gap-1">
              <Clock className="size-2.5" />
              {cooldownSec}с
            </span>
          ) : null}
        </div>

        {/* Description */}
        <p className="text-xs text-stone-400/80 leading-relaxed mb-3 ml-12">
          {power.description}
        </p>

        {/* Activate button */}
        {available ? (
          <div className="ml-12">
            <Button
              onClick={handleActivate}
              disabled={activating}
              size="sm"
              className="bg-amber-900/30 hover:bg-amber-800/40 text-amber-200 border border-amber-700/30 text-xs"
              variant="outline"
            >
              <Sparkles className="size-3 mr-1.5" />
              {activating ? 'Активация...' : 'Активировать'}
            </Button>
          </div>
        ) : null}

        {/* Cooldown bar */}
        {onCooldown && (
          <div className="ml-12 mt-2">
            <div className="h-1.5 bg-stone-800/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full"
                initial={{ width: `${cooldownProgress}%` }}
                animate={{ width: `${cooldownProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[9px] text-stone-600 mt-1">
              Перезарядка: {cooldownSec}с
            </p>
          </div>
        )}
      </div>

      {/* Just-used glow pulse */}
      {justUsed && (
        <motion.div
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute inset-0 rounded-lg border-2 border-amber-400/40 pointer-events-none"
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   POWERS TAB — Power-focused view for quick access and management
   ══════════════════════════════════════════════════════════════ */
function PowersTab() {
  const collectedPoems = useGameStore((s) => s.collectedPoems);
  const [tick, setTick] = useState(0);

  // Force re-render every second to update cooldown timers (using rAF)
  useEffect(() => {
    let rafId: number;
    let lastUpdate = 0;
    const loop = (timestamp: number) => {
      if (timestamp - lastUpdate >= 1000) {
        lastUpdate = timestamp;
        setTick((t) => t + 1);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Get collected poems that have powers, along with power info
  const collectedPowers = collectedPoems
    .map((poemId) => {
      const power = getPoemPower(poemId);
      const poem = POEMS.find((p) => p.id === poemId);
      return { poemId, power, poem };
    })
    .filter((p) => p.power !== undefined);

  const availableCount = collectedPowers.filter((p) => canUsePower(p.poemId)).length;
  const totalPowers = getAllPoemPowers().length;

  // Void the tick to suppress unused warning but keep the re-render effect
  void tick;

  if (collectedPowers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <Zap className="size-10 text-amber-700/30 mx-auto mb-3" />
        <p className="text-sm text-amber-500/40 mb-1 font-serif">Способности ещё не открыты</p>
        <p className="text-xs text-amber-700/30 font-serif">Собирайте стихи, чтобы получить поэтические способности</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(90vh-170px)]">
      <div className="px-5 py-4">
        {/* Power stats header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-amber-400/70" />
            <span className="text-xs text-amber-400/70 font-serif">
              {availableCount} из {collectedPowers.length} готово
            </span>
          </div>
          <span className="text-[10px] text-amber-600/40 font-serif">
            {collectedPowers.length} из {totalPowers} открыто
          </span>
        </div>

        {/* Powers list */}
        <div className="flex flex-col gap-3">
          {collectedPowers.map(({ poemId, power, poem }) => {
            if (!power || !poem) return null;
            return (
              <PowerCard
                key={poemId}
                poemId={poemId}
                poemTitle={poem.title}
                tick={tick}
              />
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

/* ── Page turn animation variants ── */
const pageTurnVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? 15 : -15,
    x: direction > 0 ? 40 : -40,
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? -15 : 15,
    x: direction > 0 ? -40 : 40,
  }),
};

/* ── Main component ── */
export function PoetryBook({ open, onClose }: PoetryBookProps) {
  const collectedPoems = useGameStore((s) => s.collectedPoems);
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [pageDirection, setPageDirection] = useState(0);
  const [activeTab, setActiveTab] = useState<PoetryBookTab>('poems');

  const mainPoems = getMainPoems();
  const hiddenPoems = getHiddenPoems();

  const collected = POEMS.filter((p) => collectedPoems.includes(p.id));
  const collectedMain = collected.filter((p) => !p.bonus);
  const collectedHidden = collected.filter((p) => p.bonus);
  const totalPoems = POEMS.length;
  const collectedCount = collected.length;

  const selectedPoem = POEMS.find((p) => p.id === selectedPoemId) ?? null;
  const { displayedLines, done, skipAll } = usePoemTypewriter(
    selectedPoem?.lines ?? [],
    selectedPoemId !== null,
    40,
  );

  // Compute current page number for collected poems
  const currentPoemIndex = selectedPoemId
    ? collected.findIndex((p) => p.id === selectedPoemId)
    : -1;
  const pageNumber = currentPoemIndex >= 0 ? currentPoemIndex + 1 : 0;
  const totalPages = collected.length;

  const handleClose = useCallback(() => {
    setSelectedPoemId(null);
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => {
    setPageDirection(-1);
    setSelectedPoemId(null);
  }, []);

  const handleSelectPoem = useCallback((poemId: string) => {
    setPageDirection(1);
    setSelectedPoemId(poemId);
  }, []);

  // Navigation between poems
  const handlePrevPoem = () => {
    if (currentPoemIndex > 0) {
      setPageDirection(-1);
      setSelectedPoemId(collected[currentPoemIndex - 1].id);
    }
  };

  const handleNextPoem = () => {
    if (currentPoemIndex < collected.length - 1) {
      setPageDirection(1);
      setSelectedPoemId(collected[currentPoemIndex + 1].id);
    }
  };

  // Count collected powers for the tab badge
  const collectedPowersCount = collectedPoems.filter((id) => getPoemPower(id) !== undefined).length;

  return (
    <PanelWrapper
      open={open}
      onClose={handleClose}
      title="Собрание стихов"
      urlPath="volodka://poetry"
      accentColor="amber"
      layout="centered"
      maxWidth="max-w-xl"
      icon={<BookOpen className="size-5 text-amber-400/80" />}
      headerExtra={(
        <div className="flex flex-col items-end">
          <span className="text-xs text-amber-600/60">
            {collectedCount} из {totalPoems} найдено
          </span>
          <span className="text-[10px] text-amber-400/50">Стих — это сила</span>
        </div>
      )}
    >
      <div
        className="scanline-overlay flex flex-col max-h-[70vh] overflow-hidden relative"
        style={{
          background: `
            linear-gradient(135deg, rgba(45,35,20,0.97) 0%, rgba(55,42,25,0.95) 30%, rgba(50,38,22,0.96) 70%, rgba(40,30,18,0.97) 100%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(139,109,63,0.03) 3px,
              rgba(139,109,63,0.03) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 5px,
              rgba(139,109,63,0.02) 5px,
              rgba(139,109,63,0.02) 6px
            )
          `,
          boxShadow: `
            inset 0 1px 0 rgba(255,220,150,0.08),
            inset 0 -1px 0 rgba(0,0,0,0.3)
          `,
        }}
      >

              {/* ── Tab bar ── */}
              <div className="flex shrink-0 border-b border-amber-800/20">
                <button
                  onClick={() => { setActiveTab('poems'); setSelectedPoemId(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-serif transition-all duration-200 ${
                    activeTab === 'poems'
                      ? 'text-amber-200 border-b-2 border-amber-500/60 bg-amber-950/10'
                      : 'text-amber-600/50 hover:text-amber-400/70 border-b-2 border-transparent'
                  }`}
                >
                  <Feather className="size-3.5" />
                  Стихи
                </button>
                <button
                  onClick={() => { setActiveTab('powers'); setSelectedPoemId(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-serif transition-all duration-200 ${
                    activeTab === 'powers'
                      ? 'text-amber-200 border-b-2 border-amber-500/60 bg-amber-950/10'
                      : 'text-amber-600/50 hover:text-amber-400/70 border-b-2 border-transparent'
                  }`}
                >
                  <Zap className="size-3.5" />
                  Поэзия
                  {collectedPowersCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-800/30 text-amber-400/60">
                      {collectedPowersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* ── Content ── */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'powers' && !selectedPoemId ? (
                  /* ═══ POWERS TAB ═══ */
                  <PowersTab />
                ) : (
                  <AnimatePresence mode="wait" custom={pageDirection}>
                    {selectedPoem ? (
                      /* ═══ POEM VIEW ═══ */
                      <motion.div
                        key={`poem-${selectedPoem.id}`}
                        custom={pageDirection}
                        variants={pageTurnVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="h-full"
                        style={{ perspective: '800px' }}
                      >
                        {/* Cinematic cyberpunk poem cutscene — fullscreen overlay */}
                        <CyberpunkPoemOverlay
                          open={true}
                          poem={selectedPoem}
                          onComplete={() => setSelectedPoemId(null)}
                          showMatrix={true}
                        />

                        <ScrollArea className="h-[calc(90vh-170px)]">
                          <div className="px-6 py-5" onClick={!done ? skipAll : undefined}>
                            {/* Back button */}
                            <button
                              onClick={handleBack}
                              className="flex items-center gap-1.5 text-xs text-amber-500/60 hover:text-amber-300 mb-4 transition-colors font-serif"
                            >
                              <ChevronLeft className="size-3.5" />
                              Назад к списку
                            </button>

                            {/* Poem title */}
                            <div className="text-center mb-4">
                              <h3 className="text-xl font-semibold text-amber-100/90 mb-1 font-serif">
                                {selectedPoem.title}
                              </h3>
                              {selectedPoem.subtitle && (
                                <p className="text-sm text-amber-300/50 italic font-serif">
                                  {selectedPoem.subtitle}
                                </p>
                              )}
                              <p className="text-xs text-amber-600/50 mt-1.5 font-serif">
                                {selectedPoem.author}
                              </p>
                            </div>

                            {/* Theme tags */}
                            {selectedPoem.themes.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                                {selectedPoem.themes.map((theme) => (
                                  <ThemeTag key={theme} theme={theme} />
                                ))}
                              </div>
                            )}

                            {/* Intro prose */}
                            {selectedPoem.intro && (
                              <div className="mb-4 px-4 py-3 rounded border border-amber-900/25 bg-amber-950/10">
                                <p className="text-sm text-amber-200/50 italic leading-relaxed font-serif">
                                  {selectedPoem.intro}
                                </p>
                              </div>
                            )}

                            {/* Decorative divider */}
                            <div className="flex items-center justify-center gap-3 mb-4">
                              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-600/30" />
                              <Feather className="size-3.5 text-amber-600/30" />
                              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-600/30" />
                            </div>

                            {/* Poem lines */}
                            <div className="space-y-0.5 max-w-md mx-auto">
                              {displayedLines.map((line, i) => (
                                <p
                                  key={i}
                                  className={`text-center leading-relaxed font-serif ${
                                    line === ''
                                      ? 'h-4'
                                      : line.startsWith('___')
                                        ? 'text-amber-500/40 text-sm tracking-widest'
                                        : line.startsWith('-')
                                          ? 'text-amber-200/50 text-sm italic'
                                          : 'text-amber-100/85 italic text-[15px]'
                                  }`}
                                >
                                  {line}
                                  {i === displayedLines.length - 1 && !done && line !== '' && (
                                    <span className="inline-block w-0.5 h-4 bg-amber-400/80 animate-pulse ml-0.5 align-middle" />
                                  )}
                                </p>
                              ))}
                            </div>

                            {/* End marker */}
                            {done && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center justify-center gap-3 mt-5 mb-2"
                              >
                                <div className="h-px w-8 bg-amber-700/20" />
                                <span className="text-amber-600/25 text-xs">✦</span>
                                <div className="h-px w-8 bg-amber-700/20" />
                              </motion.div>
                            )}

                            {/* Poem Power */}
                            <PoemPowerButton poemId={selectedPoem.id} />
                          </div>
                        </ScrollArea>

                        {/* Page navigation + page number */}
                        <div className="flex items-center justify-between px-6 py-2.5 border-t border-amber-800/15 shrink-0">
                          <button
                            onClick={handlePrevPoem}
                            disabled={currentPoemIndex <= 0}
                            className="flex items-center gap-1 text-xs text-amber-500/50 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-serif"
                          >
                            <ChevronLeft className="size-3.5" />
                            Пред.
                          </button>
                          <span className="text-[10px] text-amber-600/40 font-serif">
                            — {pageNumber} / {totalPages} —
                          </span>
                          <button
                            onClick={handleNextPoem}
                            disabled={currentPoemIndex >= collected.length - 1}
                            className="flex items-center gap-1 text-xs text-amber-500/50 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-serif"
                          >
                            След.
                            <ChevronRight className="size-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* ═══ POEM LIST ═══ */
                      <motion.div
                        key="poem-list"
                        custom={0}
                        variants={pageTurnVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25 }}
                        className="h-full"
                      >
                        <ScrollArea className="h-[calc(90vh-170px)]">
                          <div className="px-5 py-4">
                            {/* Main poems */}
                            {collectedMain.length > 0 && (
                              <div className="mb-5">
                                <h3 className="text-[11px] font-medium text-amber-500/50 uppercase tracking-widest mb-3 flex items-center gap-2 font-serif">
                                  <Feather className="size-3" />
                                  Стихи Владимира
                                </h3>
                                <div className="flex flex-col gap-2">
                                  {collectedMain.map((poem) => {
                                    const power = getPoemPower(poem.id);
                                    return (
                                      <button
                                        key={poem.id}
                                        onClick={() => handleSelectPoem(poem.id)}
                                        className="group text-left px-4 py-3 rounded-lg border border-amber-900/15 bg-amber-950/5 hover:bg-amber-950/15 hover:border-amber-800/25 transition-all duration-200"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Sparkles className="size-3 text-amber-500/30 group-hover:text-amber-400/60 transition-colors shrink-0" />
                                              <span className="text-sm text-amber-100/80 group-hover:text-amber-100 transition-colors truncate font-serif">
                                                {poem.title}
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 ml-5 items-center">
                                              {poem.themes.slice(0, 3).map((theme) => (
                                                <span key={theme} className="text-[10px] text-amber-600/40 font-serif">
                                                  {theme}
                                                </span>
                                              ))}
                                              {power && (
                                                <span className="text-[10px] text-amber-400/40 ml-1">
                                                  ⚡ {power.name}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <span className="text-[10px] text-amber-700/30 shrink-0 mt-0.5 font-serif">
                                            #{poem.order}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Hidden poems */}
                            {collectedHidden.length > 0 && (
                              <div className="mb-5">
                                <h3 className="text-[11px] font-medium text-cyan-500/50 uppercase tracking-widest mb-3 flex items-center gap-2 font-serif">
                                  <Sparkles className="size-3" />
                                  Скрытые стихи
                                </h3>
                                <div className="flex flex-col gap-2">
                                  {collectedHidden.map((poem) => {
                                    const power = getPoemPower(poem.id);
                                    return (
                                      <button
                                        key={poem.id}
                                        onClick={() => handleSelectPoem(poem.id)}
                                        className="group text-left px-4 py-3 rounded-lg border border-cyan-900/15 bg-cyan-950/5 hover:bg-cyan-950/15 hover:border-cyan-800/25 transition-all duration-200"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Sparkles className="size-3 text-cyan-500/30 group-hover:text-cyan-400/60 transition-colors shrink-0" />
                                              <span className="text-sm text-cyan-100/80 group-hover:text-cyan-100 transition-colors truncate font-serif">
                                                {poem.title}
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 ml-5 items-center">
                                              {poem.themes.slice(0, 3).map((theme) => (
                                                <span key={theme} className="text-[10px] text-cyan-600/40 font-serif">
                                                  {theme}
                                                </span>
                                              ))}
                                              {power && (
                                                <span className="text-[10px] text-cyan-400/40 ml-1">
                                                  ⚡ {power.name}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Locked poems preview */}
                            {collectedCount < totalPoems && (
                              <div className="mt-4">
                                <h3 className="text-[11px] font-medium text-stone-600 uppercase tracking-widest mb-3 font-serif">
                                  Ещё не найдено
                                </h3>
                                <div className="flex flex-col gap-1.5">
                                  {POEMS.filter((p) => !collectedPoems.includes(p.id))
                                    .slice(0, 5)
                                    .map((poem) => (
                                      <div
                                        key={poem.id}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded border border-amber-900/10 bg-amber-950/5 opacity-40"
                                      >
                                        <Lock className="size-3 text-amber-700/40" />
                                        <span className="text-xs text-amber-700/40 truncate font-serif">
                                          {poem.title}
                                        </span>
                                      </div>
                                    ))}
                                  {totalPoems - collectedCount > 5 && (
                                    <p className="text-[10px] text-amber-800/30 text-center mt-1 font-serif">
                                      ...и ещё {totalPoems - collectedCount - 5}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {collectedCount === 0 && (
                              <div className="text-center py-12">
                                <BookOpen className="size-10 text-amber-700/30 mx-auto mb-3" />
                                <p className="text-sm text-amber-500/40 mb-1 font-serif">
                                  Стихотворения ещё не найдены
                                </p>
                                <p className="text-xs text-amber-700/30 font-serif">
                                  Исследуйте мир, и стихи откроются вам
                                </p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>

                        {/* Page number for list view */}
                        <div className="flex items-center justify-center py-2 border-t border-amber-800/15 shrink-0">
                          <span className="text-[10px] text-amber-600/30 font-serif">
                            — Оглавление —
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
      </div>
    </PanelWrapper>
  );
}
