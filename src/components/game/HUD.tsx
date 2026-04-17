'use client';

import { useMemo, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { useIsMobile } from '@/hooks/use-mobile';
import { QUEST_DEFINITIONS, getNextTrackedObjective } from '@/data/quests';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';
import type { GamePanelsState } from '@/hooks/useGamePanels';
import type { GameMode } from '@/data/rpgTypes';

interface HUDProps {
  onSave: () => void;
  onTogglePanel: (panel: string) => void;
  activePanels: GamePanelsState;
  gameMode?: GameMode;
  onEnterExploration?: () => void;
  onEnterVisualNovel?: () => void;
}

// ============================================
// CYBERPUNK STAT BAR
// ============================================

interface CyberStatBarProps {
  icon: string;
  label: string;
  value: number;
  glowColor: string;
  gradientFrom: string;
  gradientTo: string;
  visualLite: boolean;
}

const CyberStatBar = memo(function CyberStatBar({
  icon,
  label,
  value,
  glowColor,
  gradientFrom,
  gradientTo,
  visualLite,
}: CyberStatBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const narrow = useIsMobile();
  const hexVal = Math.round(value).toString(16).toUpperCase().padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-1.5 group ${narrow ? 'min-h-11 py-0.5' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-sm" title={label}>{icon}</span>
      <div
        className={`relative bg-slate-800/80 overflow-hidden ${narrow ? 'h-2.5 w-20' : 'h-2 w-16'}`}
        style={{
          clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
        }}
      >
        {/* Fill bar */}
        <motion.div
          className={`h-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
          style={{
            boxShadow: `0 0 8px ${glowColor}`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />

        {!visualLite && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              backgroundSize: '50% 100%',
              animation: 'cyber-scan 2s linear infinite',
              opacity: 0.6,
            }}
          />
        )}

        {!visualLite && (
          <div
            className="absolute inset-0 pointer-events-none holo-flicker"
            style={{ background: `linear-gradient(90deg, transparent, ${glowColor}20, transparent)` }}
          />
        )}
      </div>

      {/* Hex/digital readout */}
      <span
        className="font-mono text-[10px] min-w-[20px] text-right"
        style={{ color: glowColor }}
      >
        {isHovered ? `${value}` : `0x${hexVal}`}
      </span>
    </div>
  );
});

// ============================================
// STRESS BAR — TEMPERATURE GAUGE
// ============================================

function CyberStressBar({
  stress,
  panicMode,
  visualLite,
}: {
  stress: number;
  panicMode: boolean;
  visualLite: boolean;
}) {
  const narrow = useIsMobile();
  const color = panicMode
    ? 'from-red-600 to-red-400'
    : stress > 70
    ? 'from-red-500 to-orange-400'
    : stress > 40
    ? 'from-orange-500 to-yellow-400'
    : 'from-green-500 to-emerald-400';

  const glowColor = panicMode
    ? 'rgba(239, 68, 68, 0.6)'
    : stress > 70
    ? 'rgba(239, 68, 68, 0.4)'
    : stress > 40
    ? 'rgba(249, 115, 22, 0.3)'
    : 'rgba(34, 197, 94, 0.3)';

  return (
    <div className={`flex items-center gap-2 ${narrow ? 'min-h-11' : ''} ${panicMode && !visualLite ? 'stress-pulse' : ''}`}>
      <span className="text-xs text-slate-500" title="Уровень стресса">
        {panicMode ? '🔥' : '📊'}
      </span>
      <div
        className={`relative bg-slate-800/80 overflow-hidden ${narrow ? 'h-2.5 w-32' : 'h-2 w-28'}`}
        style={{
          clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
          boxShadow: panicMode ? '0 0 12px rgba(239, 68, 68, 0.4)' : undefined,
        }}
      >
        <motion.div
          className={`h-full bg-gradient-to-r ${color}`}
          style={{ boxShadow: `0 0 8px ${glowColor}` }}
          animate={{ width: `${stress}%` }}
          transition={{ duration: 0.5 }}
        />

        {/* Scan line */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            backgroundSize: '50% 100%',
            animation: 'cyber-scan 2s linear infinite',
          }}
        />

        {/* Panic mode flashing overlay */}
        {panicMode && (
          <motion.div
            className="absolute inset-0 bg-red-500/20"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>
      <span className={`font-mono text-xs ${panicMode ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
        {panicMode ? (
          <span className="glitch-mild">KERNEL PANIC!</span>
        ) : (
          `${stress}%`
        )}
      </span>
    </div>
  );
}

// ============================================
// ENERGY BAR — BATTERY CELLS
// ============================================

const HUD_ENERGY_BUCKETS = 16;

function CyberEnergyBar({ energy, visualLite }: { energy: number; visualLite: boolean }) {
  const maxEnergy = MAX_PLAYER_ENERGY;
  const filledBuckets = Math.max(0, Math.ceil((energy / maxEnergy) * HUD_ENERGY_BUCKETS));
  const cells = useMemo(
    () =>
      Array.from({ length: HUD_ENERGY_BUCKETS }, (_, i) => ({
        id: i,
        active: i < filledBuckets,
      })),
    [filledBuckets],
  );

  const pct = energy / maxEnergy;
  const cellColor = pct <= 0.12 ? 'bg-red-500' : pct <= 0.33 ? 'bg-orange-500' : 'bg-cyan-500';

  const cellGlow =
    pct <= 0.12 ? 'rgba(239, 68, 68, 0.4)' : pct <= 0.33 ? 'rgba(249, 115, 22, 0.3)' : 'rgba(0, 255, 255, 0.3)';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500" title="Энергия">⚡</span>
      <div className="flex gap-px">
        {cells.map((cell) => (
          <div
            key={cell.id}
            className={`h-3 w-2 rounded-sm transition-all duration-300 ${
              cell.active
                ? `${cellColor}`
                : 'bg-slate-800/60'
            }`}
            style={{
              boxShadow: cell.active ? `0 0 4px ${cellGlow}` : 'none',
              animation:
                cell.active && !visualLite ? 'cell-flicker 3s ease-in-out infinite' : undefined,
              animationDelay: `${cell.id * 0.2}s`,
            }}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-slate-500">{energy}/{maxEnergy}</span>
    </div>
  );
}

// ============================================
// KARMA INDICATOR — DIAMOND
// ============================================

function CyberKarmaBar({ karma }: { karma: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rotate-45 border border-amber-500/60"
        style={{
          boxShadow: '0 0 8px rgba(245, 158, 11, 0.3)',
          background: `linear-gradient(135deg, rgba(245, 158, 11, ${karma / 200}), transparent)`,
        }}
      />
      <span className="font-mono text-xs text-amber-500/70">КАРМА</span>
      <div
        className="relative w-16 h-1.5 bg-slate-800/80 overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))',
        }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-600 to-amber-400"
          style={{ boxShadow: '0 0 6px rgba(245, 158, 11, 0.3)' }}
          animate={{ width: `${karma}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="font-mono text-xs text-amber-500/70">{karma}</span>
    </div>
  );
}

// ============================================
// CYBER ACTION BUTTON
// ============================================

interface CyberActionBtnProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  colorClass: string;
  icon: string;
  ariaLabel: string;
}

function CyberActionBtn({ label, isActive, onClick, colorClass, icon, ariaLabel }: CyberActionBtnProps) {
  const [isHovered, setIsHovered] = useState(false);
  const narrow = useIsMobile();

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={ariaLabel}
      className={`relative px-2.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-200 overflow-hidden ${
        narrow ? 'min-h-11 min-w-11 shrink-0 px-2 py-2' : ''
      } ${isActive ? 'ring-1 ring-cyan-500/30' : ''}`}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
        background: isHovered ? `${colorClass.replace('/80', '/90')}` : `${colorClass}`,
        border: `1px solid ${isActive ? 'rgba(0, 255, 255, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
      }}
    >
      {/* Scan line on hover */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%)',
            backgroundSize: '50% 100%',
            animation: 'cyber-scan 1.5s linear infinite',
          }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-1 text-white/90">
        <span className={narrow ? 'text-lg' : 'text-sm'}>{icon}</span>
        <span className="hidden sm:inline">{label}</span>
      </span>
    </button>
  );
}

// ============================================
// MAIN HUD COMPONENT
// ============================================

export default function HUD({
  onSave,
  onTogglePanel,
  activePanels,
  gameMode = 'visual-novel',
  onEnterExploration,
  onEnterVisualNovel,
}: HUDProps) {
  const visualLite = useMobileVisualPerf();
  const narrow = useIsMobile();
  const playerState = useGameStore(s => s.playerState);
  const setFlag = useGameStore(s => s.setFlag);
  const unsetFlag = useGameStore(s => s.unsetFlag);
  const tutorialsDisabled = playerState.flags.tutorialsDisabled === true;
  const collectedPoems = useGameStore(s => s.collectedPoemIds);
  const inventory = useGameStore(s => s.inventory);
  const activeQuestIds = useGameStore(s => s.activeQuestIds);
  const questProgress = useGameStore(s => s.questProgress);

  const questTracker = useMemo(() => {
    return activeQuestIds.slice(0, 2).flatMap((questId) => {
      const def = QUEST_DEFINITIONS[questId];
      if (!def) return [];
      const progress = questProgress[questId] || {};
      const next = getNextTrackedObjective(def, progress);
      if (!next) return [];
      return [{ questId, title: def.title, line: next.text, hint: next.hint }];
    });
  }, [activeQuestIds, questProgress]);

  // Stat bars configuration — cyberpunk colors
  const statBars = useMemo(() => [
    { icon: '😊', label: 'Настроение', value: playerState.mood, glowColor: 'rgba(0, 255, 255, 0.4)', gradientFrom: 'from-cyan-500', gradientTo: 'to-cyan-300' },
    { icon: '🎨', label: 'Креативность', value: playerState.creativity, glowColor: 'rgba(168, 85, 247, 0.4)', gradientFrom: 'from-purple-500', gradientTo: 'to-pink-400' },
    { icon: '🧠', label: 'Стабильность', value: playerState.stability, glowColor: 'rgba(34, 197, 94, 0.4)', gradientFrom: 'from-green-500', gradientTo: 'to-emerald-400' },
    { icon: '💪', label: 'Самооценка', value: playerState.selfEsteem, glowColor: 'rgba(245, 158, 11, 0.4)', gradientFrom: 'from-amber-500', gradientTo: 'to-yellow-400' },
  ], [playerState.mood, playerState.creativity, playerState.stability, playerState.selfEsteem]);

  // Action buttons — cyberpunk
  const actionButtons = useMemo(() => [
    { key: 'skills', label: 'Навыки', colorClass: 'bg-teal-900/80', icon: '🎯', ariaLabel: 'Открыть или закрыть панель навыков' },
    { key: 'journal', label: 'Лог', colorClass: 'bg-slate-800/90', icon: '📜', ariaLabel: 'Открыть или закрыть журнал событий' },
    { key: 'quests', label: 'Квесты', colorClass: 'bg-purple-900/80', icon: '📋', ariaLabel: 'Открыть или закрыть панель квестов' },
    { key: 'terminal', label: '', colorClass: 'bg-green-900/80', icon: '💻', ariaLabel: 'Открыть или закрыть учебный терминал' },
    { key: 'factions', label: 'Фракции', colorClass: 'bg-amber-900/80', icon: '⚔️', ariaLabel: 'Открыть или закрыть панель фракций' },
    { key: 'inventory', label: `(${inventory.length})`, colorClass: 'bg-cyan-900/80', icon: '🎒', ariaLabel: `Открыть или закрыть инвентарь, предметов: ${inventory.length}` },
    { key: 'achievements', label: '', colorClass: 'bg-amber-900/80', icon: '🏆', ariaLabel: 'Открыть или закрыть панель достижений' },
    { key: 'poetry', label: `(${collectedPoems.length})`, colorClass: 'bg-purple-900/80', icon: '📖', ariaLabel: `Открыть или закрыть собранные стихи, штук: ${collectedPoems.length}` },
  ], [inventory.length, collectedPoems.length]);

  return (
    <div className="relative z-30 pointer-events-none">
      {/* Semi-transparent dark panel with grid pattern */}
      <motion.div
        layout
        className="p-3 pointer-events-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 80%, transparent 100%)',
          backgroundImage: `
            linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 80%, transparent 100%),
            linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 20px 20px, 20px 20px',
          ...(visualLite
            ? {}
            : {
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }),
        }}
      >
        <div className={`flex justify-between items-start gap-2 ${narrow ? 'flex-col sm:flex-row' : ''}`}>
          {/* Left side: stat bars */}
          <div className={`flex flex-wrap gap-1.5 items-center ${narrow ? 'max-w-full' : ''}`}>
            {statBars.map((stat, i) => (
              <CyberStatBar
                key={i}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                glowColor={stat.glowColor}
                gradientFrom={stat.gradientFrom}
                gradientTo={stat.gradientTo}
                visualLite={visualLite}
              />
            ))}
            <div
              className="px-2 py-1 font-mono text-xs text-cyan-500/60"
              style={{
                background: 'rgba(0,0,0,0.4)',
                clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
              }}
            >
              АКТ {playerState.act}
            </div>
            <p
              className="w-full basis-full font-mono text-[9px] text-slate-500/80 leading-snug max-w-[min(36rem,92vw)] mt-1"
              title="Подсказка по системе"
            >
              Показатели и стресс открывают или блокируют реплики; цели — в «Квесты» 📋 и в трекере ниже. Терминал 💻 — учебные задачи в духе смены; его можно открывать между сценами, как рабочий чек-лист.
            </p>
          </div>

          {/* Right side: action buttons */}
          <div
            className={`flex gap-1.5 ${narrow ? 'max-w-full flex-nowrap overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]' : 'flex-wrap'}`}
          >
            {(gameMode === 'visual-novel' || gameMode === 'exploration') &&
              onEnterExploration &&
              onEnterVisualNovel && (
                <>
                  {gameMode === 'visual-novel' && (
                    <CyberActionBtn
                      label="3D"
                      isActive={false}
                      onClick={onEnterExploration}
                      colorClass="bg-cyan-950/85"
                      icon="🎮"
                      ariaLabel="Режим свободного 3D-обхода с физикой и NPC"
                    />
                  )}
                  {gameMode === 'exploration' && (
                    <CyberActionBtn
                      label="Сцена"
                      isActive={false}
                      onClick={onEnterVisualNovel}
                      colorClass="bg-slate-800/90"
                      icon="📜"
                      ariaLabel="Режим визуальной новеллы (текст и выборы)"
                    />
                  )}
                </>
              )}
            {actionButtons.map((btn) => (
              <CyberActionBtn
                key={btn.key}
                label={btn.label}
                isActive={!!activePanels[btn.key]}
                onClick={() => onTogglePanel(btn.key)}
                colorClass={btn.colorClass}
                icon={btn.icon}
                ariaLabel={btn.ariaLabel}
              />
            ))}
            <CyberActionBtn
              label=""
              isActive={!tutorialsDisabled}
              onClick={() =>
                tutorialsDisabled ? unsetFlag('tutorialsDisabled') : setFlag('tutorialsDisabled')
              }
              colorClass="bg-slate-800/90"
              icon="💡"
              ariaLabel={
                tutorialsDisabled
                  ? 'Включить подсказки в режиме 3D'
                  : 'Отключить подсказки в режиме 3D'
              }
            />
            <CyberActionBtn
              label=""
              isActive={false}
              onClick={onSave}
              colorClass="bg-emerald-900/80"
              icon="💾"
              ariaLabel="Сохранить игру"
            />
          </div>
        </div>

        {/* Stress indicator */}
        <div className="mt-2">
          <CyberStressBar stress={playerState.stress} panicMode={playerState.panicMode} visualLite={visualLite} />
        </div>

        {/* Energy bar */}
        <div className="mt-1">
          <CyberEnergyBar energy={playerState.energy} visualLite={visualLite} />
        </div>

        {/* Karma indicator */}
        <div className="mt-1">
          <CyberKarmaBar karma={playerState.karma} />
        </div>

        {/* Компактный трекер квестов */}
        {questTracker.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/35">TRACK // QUESTS</div>
            {questTracker.map((q) => (
              <button
                key={q.questId}
                type="button"
                onClick={() => onTogglePanel('quests')}
                className="block w-full max-w-md text-left"
                aria-label={`Открыть квесты: ${q.title}. Текущая цель: ${q.line}`}
              >
                <div
                  className="rounded-sm border border-cyan-500/15 bg-black/35 px-2 py-1.5 transition-colors hover:border-cyan-500/35"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                  }}
                >
                  <div className="font-mono text-[10px] text-cyan-400/70 truncate">{q.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] leading-snug text-slate-300/90 line-clamp-2">{q.line}</div>
                  {q.hint && (
                    <div className="mt-0.5 font-mono text-[9px] text-cyan-500/40 line-clamp-1">💡 {q.hint}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
