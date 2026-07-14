
/* ─── Volodka RPG – Exploration HUD (AAA+ Cyberpunk Polish v2) ───
   Enhanced with: smooth counter animations, quest notification badge,
   karma breathing animation, XP gain floating text, achievement popup,
   better mobile responsive layout.
*/

import { useMemo, useState, useEffect } from 'react';
import { APP_VERSION } from '@/shared/constants/appVersion';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Menu,
  Zap,
  BookOpen,
  Package,
  Lightbulb,
  ScrollText,
  Clock,
  Activity,
  Shield,
  Gamepad2,
  Map as MapIcon,
  User,
  Users,
  BookMarked,
  Trophy,
  MessageCircle,
  MoreVertical,
  Sparkles,
  Hammer,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Camera,
} from 'lucide-react';
import { countCollectedMainPoems, TOTAL_MAIN_POEMS } from '@/data/poemCollectionMeta';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomStatusEffectsPx } from '@/shared/constants/hudLayout';
import { PoemActiveEffectsHudSlot } from '@/components/game/poemActiveEffects/PoemActiveEffectsHud';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EMPTY_PAYLOAD, PHOTO_EVENTS } from '@/engine/events';
import type { SecondaryAction } from '@/components/game/hud/hudTypes';
import { StatusEffectsBar } from '@/components/game/StatusEffectsBar';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { getKarmaTierLabel } from '@/shared/utils/karmaTier';
import { useHUDController } from '@/components/game/hud/useHUDController';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { HUDProps } from '@/components/game/hud/hudTypes';
import { karmaColor, karmaStroke, timeLabel, formatGameClock } from '@/components/game/hud/hudPresentation';
import { AnimatedCounter } from '@/components/game/hud/parts/AnimatedCounter';
import { KarmaRing } from '@/components/game/hud/parts/KarmaRing';
import { StatPulse } from '@/components/game/hud/parts/StatPulse';
import { CyberStatBar } from '@/components/game/hud/parts/CyberStatBar';
import { LevelBadge } from '@/components/game/hud/parts/LevelBadge';
import { AchievementPopup } from '@/components/game/hud/parts/AchievementPopup';
import { HUDButton } from '@/components/game/hud/parts/HUDButton';
import { HUDMenuItem } from '@/components/game/hud/parts/HUDMenuItem';
import { WeatherIcon, getWeatherDescription } from '@/components/game/hud/parts/WeatherIcon';
import { TimeIcon } from '@/components/game/hud/parts/TimeIcon';
import { AmbientParticles } from '@/components/game/hud/parts/AmbientParticles';
import { PhysicsDegradedDevBadge } from '@/components/game/hud/parts/PhysicsDegradedDevBadge';
import { ContextualHint } from '@/components/game/hud/parts/ContextualHint';
import { CompassIndicator } from '@/components/game/hud/parts/CompassIndicator';
import { ActiveQuestMiniTracker } from '@/components/game/hud/parts/ActiveQuestMiniTracker';
import { useContextualHints } from '@/hooks/useContextualHints';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export type { HUDProps } from '@/components/game/hud/hudTypes';

/* ── Crosshair with proximity glow ── */
function CrosshairGlow({ nearInteractive }: { nearInteractive: boolean }) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div className="relative">
        <div
          className="w-1 h-1 rounded-full bg-white/30 mx-auto transition-all duration-300"
          style={{
            boxShadow: nearInteractive
              ? '0 0 8px rgba(0,255,238,0.6), 0 0 20px rgba(0,255,238,0.3)'
              : '0 0 3px rgba(255,255,255,0.4)',
            backgroundColor: nearInteractive ? 'rgba(0,255,238,0.5)' : undefined,
          }}
        />
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-[3px] border-t border-l border-r rounded-t-sm transition-colors duration-300"
          style={{ borderColor: nearInteractive ? 'rgba(0,255,238,0.25)' : 'rgba(255,255,255,0.08)' }}
        />
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-[3px] border-b border-l border-r rounded-b-sm transition-colors duration-300"
          style={{ borderColor: nearInteractive ? 'rgba(0,255,238,0.25)' : 'rgba(255,255,255,0.08)' }}
        />
        <div
          className="absolute top-1/2 -left-2 -translate-y-1/2 w-[3px] h-2.5 border-t border-l border-b rounded-l-sm transition-colors duration-300"
          style={{ borderColor: nearInteractive ? 'rgba(0,255,238,0.25)' : 'rgba(255,255,255,0.08)' }}
        />
        <div
          className="absolute top-1/2 -right-2 -translate-y-1/2 w-[3px] h-2.5 border-t border-r border-b rounded-r-sm transition-colors duration-300"
          style={{ borderColor: nearInteractive ? 'rgba(0,255,238,0.25)' : 'rgba(255,255,255,0.08)' }}
        />
        {nearInteractive && (
          <div
            className="absolute inset-0 -m-3 rounded-full pointer-events-none"
            style={{
              boxShadow: '0 0 16px 2px rgba(0,255,238,0.12)',
              animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ExplorationHUD(props: HUDProps) {
  const state = useHUDController(props);
  const reducedMotion = useEffectiveReducedMotion();
  const quietStyle = useHudQuietStyle();
  const totalPoems = TOTAL_MAIN_POEMS;
  const { currentHint, dismissHint } = useContextualHints();

  // ── Crosshair proximity glow state ──
  const [crosshairNearInteractive, setCrosshairNearInteractive] = useState(false);
  useEffect(() => {
    const unsubHint = eventBus.on('interaction:hint', () => setCrosshairNearInteractive(true));
    const unsubEnd = eventBus.on('interaction:end', () => setCrosshairNearInteractive(false));
    const unsubStart = eventBus.on('interaction:start', () => setCrosshairNearInteractive(false));
    return () => { unsubHint(); unsubEnd(); unsubStart(); };
  }, []);
  const {
    photoModeOn,
    hudMounted,
    timeOfDay,
    sceneName,
    currentWeather,
    collectedPoems,
    questNotificationCount,
    questBadgePulse,
    poemBadgePulse,
    activeQuestCount,
    showSaveIndicator,
    handleSave,
    karma,
    energy,
    stress,
    level,
    xp,
    xpToNext,
    perkCount,
    activeStatusEffectCount,
    karmaDirection,
    karmaPulse,
    energyPulse,
    stressPulse,
    justLeveled,
    skillAchievement,
    isLowEnergy,
    isHighStress,
    moreMenuOpen,
    setMoreMenuOpen,
    moreMenuRef,
    onOpenQuests,
    onOpenInventory,
    onOpenPoetry,
    onOpenJournal,
    onOpenCrafting,
    onOpenTrading,
    onOpenStats,
  } = state;

  const mainPoemCount = countCollectedMainPoems(collectedPoems);

  // ── Onboarding gate (progressive disclosure) ─────────────────────────────
  // During the first minutes of a new playthrough the player is overwhelmed by
  // ~25 interactive elements at once. We define an "onboarding" window as:
  //   level === 1 AND the player has collected ≤ 1 poem
  // In this window we hide non-essential UI (trading, crafting, photo, stats
  // buttons, the full karma/energy/stress panel) so the player can focus on
  // movement, the story overlay, and the quest guidance HUD. The moment the
  // player gains a level OR collects a second poem, the full UI fades in.
  const isOnboarding = level <= 1 && mainPoemCount <= 1;

  const {
    onToggleTutorials,
    onOpenMenu,
    onOpenMiniGames,
    onOpenWorldMap,
    onOpenCharacterProfile,
    onOpenNPCRelations,
    onOpenCodex,
    onOpenDialogueHistory,
    onOpenAchievements,
    onOpenSkillTree,
    onOpenFastTravel,
    onOpenPerks,
    onOpenQuestBoard,
  } = props;

  const secondaryActions: SecondaryAction[] = useMemo(() => [
    { icon: <span className="size-4 flex items-center justify-center text-sm">🧭</span>, label: 'Быстрый переход', shortcut: 'F', onClick: onOpenFastTravel },
    { icon: <Sparkles className="size-4" />, label: 'Навыки', shortcut: 'T', onClick: onOpenSkillTree },
    { icon: <Sparkles className="size-4" />, label: 'Черты', shortcut: 'V', onClick: onOpenPerks },
    { icon: <ScrollText className="size-4" />, label: 'Доска заданий', shortcut: 'B', onClick: onOpenQuestBoard },
    { icon: <ShoppingCart className="size-4" />, label: 'Торговля', shortcut: '⇧T', onClick: onOpenTrading },
    { icon: <Hammer className="size-4" />, label: 'Крафт', shortcut: 'G', onClick: onOpenCrafting },
    { icon: <Gamepad2 className="size-4" />, label: 'Мини-игры', shortcut: 'M', onClick: onOpenMiniGames },
    { icon: <MapIcon className="size-4" />, label: 'Карта мира', shortcut: 'M', onClick: onOpenWorldMap },
    { icon: <User className="size-4" />, label: 'Профиль', shortcut: 'C', onClick: onOpenCharacterProfile },
    { icon: <Users className="size-4" />, label: 'Отношения', shortcut: 'N', onClick: onOpenNPCRelations },
    { icon: <BookMarked className="size-4" />, label: 'Кодекс', shortcut: 'K', onClick: onOpenCodex },
    { icon: <MessageCircle className="size-4" />, label: 'История диалогов', shortcut: 'L', onClick: onOpenDialogueHistory },
    { icon: <Trophy className="size-4" />, label: 'Достижения', shortcut: 'H', onClick: onOpenAchievements },
    { icon: <Lightbulb className="size-4" />, label: 'Подсказки', onClick: onToggleTutorials },
    { icon: <Menu className="size-4" />, label: 'Меню', onClick: onOpenMenu },
  ], [onOpenFastTravel, onOpenSkillTree, onOpenPerks, onOpenQuestBoard, onOpenTrading, onOpenCrafting, onOpenMiniGames, onOpenWorldMap, onOpenCharacterProfile, onOpenNPCRelations, onOpenCodex, onOpenDialogueHistory, onOpenAchievements, onToggleTutorials, onOpenMenu]);

  if (photoModeOn) return null;

  return (
    <div
      data-exploration-ui
      data-testid="game-hud"
      className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ease-out ${hudMounted ? 'opacity-100' : 'opacity-0'}`}
      style={{ zIndex: UI_LAYERS.HUD }}
    >
      {/* ── Achievement popup ── */}
      <AchievementPopup achievement={skillAchievement} />

      {/* ── Center: Crosshair ── */}
      <CrosshairGlow nearInteractive={crosshairNearInteractive} />

      {/* ── Top bar (fades when HUD is quiet — crosshair stays) ── */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto" style={quietStyle}>
        <div
          className="flex items-center justify-between px-2 py-1.5 sm:px-4 sm:py-2.5 hud-scanline-bar"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {/* Left: Scene name + time */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: karmaStroke(karma), boxShadow: `0 0 6px ${karmaStroke(karma)}40` }} />
            </div>
            <TimeIcon hour={timeOfDay} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-slate-100 text-sm sm:text-base font-semibold tracking-wide truncate neon-text-cyan location-name-glow">{sceneName}</span>
                <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">●</span>
                <span className="text-[10px] text-slate-300/80 font-mono hidden sm:inline">{timeLabel(timeOfDay)}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border ml-0.5"
              style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.15)', background: 'rgb(var(--cyber-cyan-rgb) / 0.05)' }}
            >
              <Clock className="size-2.5 text-cyan-500/60" />
              <span className="text-cyan-400/80 text-[11px] font-mono tabular-nums">{formatGameClock(timeOfDay)}</span>
            </div>
            <span className="sm:hidden text-cyan-400/70 text-[10px] font-mono tabular-nums">
              {formatGameClock(timeOfDay)}
            </span>
          </div>

          {/* Right: Level + XP + Poem + Quest + Buttons + More */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <LevelBadge level={level} perkCount={perkCount} xp={xp} xpToNext={xpToNext} justLeveled={justLeveled} />

            {/* XP progress mini-bar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden md:flex flex-col items-center gap-0 w-16 cursor-default">
                  <div className="h-1 w-full bg-slate-800/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, rgba(8,145,178,0.6), rgb(var(--cyber-cyan-rgb) / 0.6))' }}
                      initial={false}
                      animate={{ width: `${(xp / xpToNext) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono tabular-nums">{xp}/{xpToNext} XP</span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={4}
                className="border backdrop-blur-xl px-3 py-2 max-w-[200px] space-y-1"
                style={{
                  background: 'linear-gradient(145deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.9) 100%)',
                  borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.3)',
                  boxShadow: '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.12), 0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                <div className="text-xs font-semibold text-cyan-300 font-mono">⬆ XP: {xp}/{xpToNext}</div>
                <div className="text-[10px] text-slate-400">До уровня {level + 1}: <span className="text-cyan-400">{xpToNext - xp} XP</span></div>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-5 bg-slate-700/30 mx-0.5 hidden md:block" />

            {/* Poem count badge */}
            <motion.button
              data-testid="hud-poem-button"
              onClick={onOpenPoetry}
              animate={
                reducedMotion || !poemBadgePulse
                  ? { scale: 1 }
                  : { scale: [1, 1.08, 1], boxShadow: ['0 0 12px rgba(251,191,36,0.15)', '0 0 28px rgba(251,191,36,0.55)', '0 0 12px rgba(251,191,36,0.15)'] }
              }
              transition={
                reducedMotion || !poemBadgePulse
                  ? { duration: 0 }
                  : { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
              }
              className="relative flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-md text-xs border transition-colors hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              title="Стихи [⇧P]"
              aria-label={`Стихи: ${mainPoemCount} из ${totalPoems}`}
              style={{
                background: poemBadgePulse ? 'rgba(120,60,10,0.45)' : 'rgba(120,60,10,0.25)',
                borderColor: poemBadgePulse ? 'rgba(251,191,36,0.75)' : 'rgba(251,191,36,0.35)',
                boxShadow: poemBadgePulse
                  ? '0 0 24px rgba(251,191,36,0.45), inset 0 0 10px rgba(251,191,36,0.12)'
                  : '0 0 12px rgba(251,191,36,0.15), inset 0 0 6px rgba(251,191,36,0.05)',
              }}
            >
              {poemBadgePulse ? (
                <span
                  className="absolute -top-1.5 -right-1 text-[7px] font-mono font-bold px-1 py-px rounded bg-amber-400 text-black tracking-wider"
                  aria-hidden
                >
                  NEW
                </span>
              ) : null}
              <span className="text-sm">📖</span>
              <span className="text-amber-200 font-semibold hidden sm:inline" style={{ textShadow: '0 0 8px rgba(251,191,36,0.4)' }}>Стихи:</span>
              <AnimatedCounter value={mainPoemCount} className="text-amber-300 font-bold" style={{ textShadow: '0 0 6px rgba(251,191,36,0.5)' }} />
              <span className="text-amber-500/60 hidden sm:inline">/</span>
              <span className="text-amber-400/70 hidden sm:inline">{totalPoems}</span>
            </motion.button>

            <div className="w-px h-4 bg-slate-700/25 mx-0.5" />

            {/* Status effects count badge */}
            {activeStatusEffectCount > 0 && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border cyber-tooltip"
                data-tooltip={`Эффекты: ${activeStatusEffectCount}`}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderColor: 'rgba(100,116,139,0.2)',
                }}
              >
                <Activity className="size-3 text-slate-400" />
                <span className="text-[9px] text-slate-300/70 font-mono font-semibold">{activeStatusEffectCount}</span>
              </div>
            )}

            {/* Quest button with notification badge */}
            <div className="relative" data-testid="hud-quest-button">
              <HUDButton
                icon={<ScrollText className="size-3.5 sm:size-4" />}
                label={`Задания [Q]${activeQuestCount > 0 ? ` · ${activeQuestCount} активных` : ''}`}
                onClick={onOpenQuests}
                tooltip={activeQuestCount > 0 ? `Задания [Q] · ${activeQuestCount} активных` : 'Задания [Q]'}
              />
              {/* Notification badge */}
              <AnimatePresence>
                {questNotificationCount > 0 && (
                  <motion.span
                    initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
                    animate={
                      reducedMotion
                        ? { scale: 1, opacity: 1 }
                        : questBadgePulse
                          ? { scale: [1, 1.12, 1], opacity: 1 }
                          : { scale: 1, opacity: 1 }
                    }
                    exit={reducedMotion ? undefined : { scale: 0, opacity: 0 }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : questBadgePulse
                          ? { scale: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.2 } }
                          : { type: 'spring', stiffness: 500, damping: 25 }
                    }
                    className={`absolute -top-1 -right-1 min-w-4 h-4 rounded-full text-[8px] font-bold text-black flex items-center justify-center px-1 cyber-badge-dot ${
                      questBadgePulse ? 'bg-amber-500' : 'bg-cyan-600/90'
                    }`}
                    style={{
                      boxShadow: questBadgePulse
                        ? '0 0 8px rgba(251,191,36,0.5)'
                        : '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.35)',
                    }}
                  >
                    {questNotificationCount > 9 ? '9+' : questNotificationCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <HUDButton icon={<BookOpen className="size-3.5 sm:size-4" />} label="Журнал [J]" onClick={onOpenJournal} tooltip="Журнал [J]" />
            <HUDButton icon={<Package className="size-3.5 sm:size-4" />} label="Инвентарь [I]" onClick={onOpenInventory} tooltip="Инвентарь [I]" />

            {/* Hide some buttons on small screens; hide trading during onboarding */}
            <div className={`${isOnboarding ? 'hidden' : 'hidden sm:block'}`}>
              <HUDButton icon={<ShoppingCart className="size-3.5 sm:size-4" />} label="Торговля [⇧T]" onClick={onOpenTrading} tooltip="Торговля [⇧T]" />
            </div>
            <div className={`${isOnboarding ? 'hidden' : 'hidden md:block'}`}>
              <HUDButton icon={<Hammer className="size-3.5 sm:size-4" />} label="Крафт [G]" onClick={onOpenCrafting} tooltip="Крафт [G]" />
            </div>
            <HUDButton icon={<Save className="size-3.5 sm:size-4" />} label="Сохранить" onClick={handleSave} tooltip="Сохранить [F5]" />
            {!isOnboarding && (
              <HUDButton icon={<Camera className="size-3.5 sm:size-4" />} label="Фото" onClick={() => eventBus.emit(PHOTO_EVENTS.toggle, PHOTO_EMPTY_PAYLOAD)} tooltip="Фото [P]" />
            )}
            {!isOnboarding && (
              <HUDButton icon={<BarChart3 className="size-3.5 sm:size-4" />} label="Статистика" onClick={onOpenStats} tooltip="Статистика [S]" />
            )}

            {/* Weather status indicator */}
            {currentWeather !== 'clear' && (
              <div
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md border"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderColor: 'rgba(100,116,139,0.2)',
                }}
                title={getWeatherDescription(currentWeather)}
              >
                <WeatherIcon type={currentWeather} className="size-3 weather-icon-bob" />
              </div>
            )}

            {/* More dropdown trigger */}
            <div className="relative" ref={moreMenuRef}>
              <HUDButton
                icon={<MoreVertical className="size-3.5 sm:size-4" />}
                label="Ещё"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                active={moreMenuOpen}
                tooltip="Ещё [...]"
              />

              <AnimatePresence>
                {moreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-1.5 w-52 rounded-lg border backdrop-blur-xl overflow-hidden panel-corner-accent panel-data-stream"
                    style={{
                      background: 'linear-gradient(145deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.88) 50%, rgba(0,0,0,0.85) 100%)',
                      borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.2)',
                      boxShadow: '0 0 20px rgb(var(--cyber-cyan-rgb) / 0.08), 0 8px 32px rgba(0,0,0,0.5)',
                      zIndex: UI_LAYERS.HUD + 5,
                    }}
                  >
                    <div className="px-3 py-2 border-b border-slate-700/30">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Действия</span>
                    </div>
                    <div className="py-1 px-1 max-h-64 overflow-y-auto">
                      {secondaryActions.map((action) => (
                        <HUDMenuItem
                          key={action.label}
                          icon={action.icon}
                          label={action.label}
                          shortcut={action.shortcut}
                          badge={action.label === 'Доска заданий' ? questNotificationCount : undefined}
                          onClick={() => { setMoreMenuOpen(false); action.onClick?.(); }}
                        />
                      ))}
                    </div>
                    <div className="px-3 py-1.5 border-t border-slate-700/30">
                      <div className="flex items-center justify-between">
                        {import.meta.env.DEV && (
                          <span className="text-[8px] text-slate-400 font-mono">volodka://actions</span>
                        )}
                        <div className="flex items-center gap-1">
                          <kbd className="cyber-keyboard-hint">Esc</kbd>
                          <span className="text-[8px] text-slate-500">закрыть</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden lg:flex items-center px-1.5 py-0.5 rounded border border-slate-700/20 bg-slate-900/30">
              <kbd className="cyber-keyboard-hint">F1</kbd>
              <span className="text-[9px] text-slate-400 ml-1">Справка</span>
            </div>
          </div>
        </div>

        {/* Bottom edge glow line */}
        <motion.div
          className="h-px mx-4"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.2) 30%, rgb(var(--cyber-cyan-rgb) / 0.35) 50%, rgb(var(--cyber-cyan-rgb) / 0.2) 70%, transparent)' }}
        />
      </div>

      {/* Quest objective: single strip in StoryGuidanceHUD (below compass) — not duplicated here */}

      {/* ── Quick-save indicator ── */}
      <AnimatePresence>
        {showSaveIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-16 right-3 sm:top-20 sm:right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/80 border border-cyan-900/30 backdrop-blur-md shadow-[0_0_15px_rgb(var(--cyber-cyan-rgb) / 0.1)]"
            style={{ zIndex: UI_LAYERS.HUD + 1 }}
          >
            <Save className="size-3.5 text-cyan-400" />
            <span className="text-xs text-cyan-300 font-medium">💾 Сохранено</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom-left: Stats panel (desktop) — AAA Overhaul ── */}
      {/* Hidden during onboarding to reduce cognitive overload. The LevelBadge
          in the top bar already shows level/XP; karma/energy/stress become
          meaningful only after the first combat or dialogue choice. */}
      <div className={`absolute left-3 sm:left-4 pointer-events-auto ${isOnboarding ? 'hidden' : 'hidden lg:block'}`} style={{ bottom: 96 }}>
        <div
          className={`relative rounded-2xl p-4 sm:p-5 border backdrop-blur-xl min-w-[260px] overflow-hidden panel-scanlines hex-grid-bg neon-border-breathe ${isLowEnergy || isHighStress ? 'warning-pulse' : ''}`}
          style={{
            background: 'linear-gradient(145deg, rgba(2,6,23,0.95) 0%, rgba(8,12,28,0.92) 40%, rgba(4,8,18,0.88) 100%)',
            borderColor: isLowEnergy || isHighStress ? 'rgba(251, 113, 133, 0.5)' : 'rgb(var(--cyber-cyan-rgb) / 0.2)',
            boxShadow: isLowEnergy || isHighStress
              ? '0 0 30px rgba(251,113,133,0.15), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(251,113,133,0.1)'
              : '0 0 20px rgb(var(--cyber-cyan-rgb) / 0.06), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.08)',
          }}
        >
          {/* Animated circuit-trace border at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl overflow-hidden circuit-trace-line pointer-events-none" />

          {/* Accent glow spots */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 20%, rgb(var(--cyber-cyan-rgb) / 0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(251,191,36,0.03) 0%, transparent 50%)' }} />
          <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgb(var(--cyber-cyan-rgb) / 0.08) 0%, transparent 70%)' }} />

          {/* Ambient floating particles */}
          <AmbientParticles />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgb(var(--cyber-cyan-rgb) / 0.1)', boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.15)' }}>
                <Shield className="size-3 text-cyan-400" />
              </div>
              <span className="text-[11px] text-cyan-400/70 font-mono uppercase tracking-[0.2em]" style={{ textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)' }}>СТАТУС</span>
            </div>
            <LevelBadge level={level} perkCount={perkCount} xp={xp} xpToNext={xpToNext} justLeveled={justLeveled} />
          </div>

          <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, rgb(var(--cyber-cyan-rgb) / 0.3), rgb(var(--cyber-cyan-rgb) / 0.08) 40%, transparent)' }} />

          {/* Karma with breathing ring — ENHANCED (with tooltip) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 mb-4 relative cursor-default">
                <div className="relative">
                  <KarmaRing karma={karma} />
                  <StatPulse active={karmaPulse} color="cyan" />
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${karmaColor(karma)}`} style={{ textShadow: '0 0 6px currentColor' }}>Карма</span>
                    <div className="flex items-center gap-1.5">
                      <AnimatedCounter value={karma} className={`text-base font-bold font-mono ${karmaColor(karma)}`}
                        style={{ textShadow: karmaPulse ? '0 0 12px currentColor' : '0 0 4px currentColor', transition: 'text-shadow 0.3s ease' }}
                      />
                      {/* Karma direction indicator */}
                      <AnimatePresence>
                        {karmaDirection && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.5, x: -5 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
                            className={`text-xs ${karmaDirection === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}
                            style={{ textShadow: karmaDirection === 'up' ? '0 0 8px rgba(52,211,153,0.6)' : '0 0 8px rgba(251,113,133,0.6)' }}
                          >
                            {karmaDirection === 'up' ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400/80 font-mono mt-0.5">
                    {getKarmaTierLabel(karma)}
                  </span>
                  <div className="h-1.5 bg-slate-800/70 rounded-full mt-1.5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${karmaStroke(karma)}60, ${karmaStroke(karma)})`, boxShadow: `0 0 6px ${karmaStroke(karma)}50` }}
                      initial={false} animate={{ width: `${karma}%` }} transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={8}
              className="border backdrop-blur-xl px-3 py-2.5 max-w-[240px] space-y-1.5"
              style={{
                background: 'linear-gradient(145deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.9) 100%)',
                borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.3)',
                boxShadow: '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.12), 0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div className="text-xs font-semibold text-cyan-300 font-mono">☯ Карма: {karma}/100</div>
              <div className="text-[10px] text-slate-400">Уровень: <span className="text-cyan-400">{getKarmaTierLabel(karma)}</span></div>
              <div className="h-px" style={{ background: 'rgb(var(--cyber-cyan-rgb) / 0.15)' }} />
              <div className="text-[10px] text-slate-500 leading-relaxed">Влияет на: диалоги, отношения NPC, концовку</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">Рост: добрые поступки, стихи</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">Падение: агрессия, эгоизм</div>
            </TooltipContent>
          </Tooltip>

          {/* XP Progress bar — prominent cyan bar (with tooltip) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-3 cursor-default">
                <div className="flex items-center gap-2 mb-1.5 relative">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center bg-cyan-500/10" style={{ boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.2)' }}>
                    <TrendingUp className="size-3 text-cyan-400" />
                  </div>
                  <span className="text-sm font-semibold text-cyan-300">Опыт</span>
                  <span className="text-[11px] text-cyan-400/70 font-mono ml-auto tabular-nums" style={{ textShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.3)' }}>
                    {xp}<span className="text-cyan-500/40">/</span>{xpToNext}
                  </span>
                </div>
                <CyberStatBar
                  value={xp}
                  max={xpToNext}
                  color="linear-gradient(90deg, #0891b2, var(--cyber-cyan))"
                  glowColor="rgb(var(--cyber-cyan-rgb) / 0.4)"
                  showSegments={false}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={8}
              className="border backdrop-blur-xl px-3 py-2.5 max-w-[240px] space-y-1.5"
              style={{
                background: 'linear-gradient(145deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.9) 100%)',
                borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.3)',
                boxShadow: '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.12), 0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div className="text-xs font-semibold text-cyan-300 font-mono">⬆ Опыт: {xp}/{xpToNext}</div>
              <div className="text-[10px] text-slate-400">До след. уровня: <span className="text-cyan-400">{xpToNext - xp} XP</span></div>
              <div className="h-px" style={{ background: 'rgb(var(--cyber-cyan-rgb) / 0.15)' }} />
              <div className="text-[10px] text-slate-500 leading-relaxed">Источник: бои, задания, стихи</div>
            </TooltipContent>
          </Tooltip>

          {/* Energy bar — ENHANCED with bigger fonts and glow (with tooltip) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-3 cursor-default">
                <div className="flex items-center gap-2 mb-1.5 relative">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isLowEnergy ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}
                    style={{ boxShadow: isLowEnergy ? '0 0 8px rgba(244,63,94,0.2)' : '0 0 8px rgba(52,211,153,0.2)' }}
                  >
                    <Zap className={`size-3 ${isLowEnergy ? 'text-rose-400' : 'text-emerald-400'}`} />
                  </div>
                  <span className={`text-sm font-semibold ${isLowEnergy ? 'text-rose-300 neon-text-rose' : 'text-emerald-300'}`}>Энергия</span>
                  <AnimatedCounter value={energy} className={`text-sm font-bold font-mono ml-auto relative ${isLowEnergy ? 'text-rose-300' : 'text-emerald-300'}`}
                    style={{ textShadow: energyPulse ? '0 0 12px rgba(52,211,153,0.6)' : '0 0 4px rgba(52,211,153,0.3)', transition: 'text-shadow 0.3s ease' }}
                  />
                  <StatPulse active={energyPulse} color={isLowEnergy ? 'rose' : 'emerald'} />
                </div>
                <CyberStatBar
                  value={energy}
                  color={isLowEnergy ? 'linear-gradient(90deg, #9f1239, #f43f5e)' : 'linear-gradient(90deg, #059669, #34d399)'}
                  glowColor={isLowEnergy ? 'rgba(244,63,94,0.4)' : 'rgba(52,211,153,0.4)'}
                  shimmer={energyPulse}
                />
                {isLowEnergy && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-rose-400/80 font-mono mt-1 block energy-critical"
                    style={{ textShadow: '0 0 6px rgba(251,113,133,0.3)' }}
                  >
                    ⚠ Низкая энергия — найдите место для отдыха
                  </motion.span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={8}
              className="border backdrop-blur-xl px-3 py-2.5 max-w-[240px] space-y-1.5"
              style={{
                background: 'linear-gradient(145deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.9) 100%)',
                borderColor: isLowEnergy ? 'rgba(244,63,94,0.3)' : 'rgb(var(--cyber-cyan-rgb) / 0.3)',
                boxShadow: isLowEnergy ? '0 0 16px rgba(244,63,94,0.12), 0 8px 24px rgba(0,0,0,0.5)' : '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.12), 0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div className={`text-xs font-semibold font-mono ${isLowEnergy ? 'text-rose-300' : 'text-emerald-300'}`}>⚡ Энергия: {energy}/100</div>
              <div className="text-[10px] text-slate-400">Состояние: <span className={isLowEnergy ? 'text-rose-400' : 'text-emerald-400'}>{energy < 20 ? 'Критическое' : energy < 50 ? 'Низкое' : 'Нормальное'}</span></div>
              <div className="h-px" style={{ background: 'rgb(var(--cyber-cyan-rgb) / 0.15)' }} />
              <div className="text-[10px] text-slate-500 leading-relaxed">☕ Кофе — быстрое восстановление</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">🛏 Отдых — полное восстановление</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">🍫 Еда — небольшое восстановление</div>
            </TooltipContent>
          </Tooltip>

          {/* Stress bar — ENHANCED with bigger fonts and glow (with tooltip) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <div className="flex items-center gap-2 mb-1.5 relative">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isHighStress ? 'bg-rose-500/10' : 'bg-amber-500/10'}`}
                    style={{ boxShadow: isHighStress ? '0 0 8px rgba(244,63,94,0.2)' : '0 0 8px rgba(245,158,11,0.2)' }}
                  >
                    <Activity className={`size-3 ${isHighStress ? 'text-rose-400' : 'text-amber-400'}`} />
                  </div>
                  <span className={`text-sm font-semibold ${isHighStress ? 'text-rose-300 neon-text-rose' : 'text-amber-300'}`}>Стресс</span>
                  <AnimatedCounter value={stress} className={`text-sm font-bold font-mono ml-auto relative ${isHighStress ? 'text-rose-300' : 'text-amber-300'}`}
                    style={{ textShadow: stressPulse ? '0 0 12px rgba(251,113,133,0.6)' : '0 0 4px rgba(245,158,11,0.3)', transition: 'text-shadow 0.3s ease' }}
                  />
                  <StatPulse active={stressPulse} color={isHighStress ? 'rose' : 'amber'} />
                </div>
                <CyberStatBar
                  value={stress}
                  color={isHighStress ? 'linear-gradient(90deg, #9f1239, #f43f5e)' : 'linear-gradient(90deg, #b45309, #f59e0b)'}
                  glowColor={isHighStress ? 'rgba(244,63,94,0.4)' : 'rgba(245,158,11,0.4)'}
                  shimmer={stressPulse}
                />
                {isHighStress && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-rose-400/80 font-mono mt-1 block" style={{ textShadow: '0 0 6px rgba(251,113,133,0.3)' }}>
                    ⚠ Высокий стресс — отдохните или найдите стихи
                  </motion.span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={8}
              className="border backdrop-blur-xl px-3 py-2.5 max-w-[240px] space-y-1.5"
              style={{
                background: 'linear-gradient(145deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.9) 100%)',
                borderColor: isHighStress ? 'rgba(244,63,94,0.3)' : 'rgb(var(--cyber-cyan-rgb) / 0.3)',
                boxShadow: isHighStress ? '0 0 16px rgba(244,63,94,0.12), 0 8px 24px rgba(0,0,0,0.5)' : '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.12), 0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div className={`text-xs font-semibold font-mono ${isHighStress ? 'text-rose-300' : 'text-amber-300'}`}>💢 Стресс: {stress}/100</div>
              <div className="text-[10px] text-slate-400">Состояние: <span className={isHighStress ? 'text-rose-400' : 'text-amber-400'}>{stress > 80 ? 'Критическое' : stress > 50 ? 'Повышенное' : 'Нормальное'}</span></div>
              <div className="h-px" style={{ background: 'rgb(var(--cyber-cyan-rgb) / 0.15)' }} />
              <div className="text-[10px] text-slate-500 leading-relaxed">📖 Стихи — снижение стресса</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">🛏 Отдых — снижение стресса</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">🚶 Прогулка — мягкое снижение</div>
            </TooltipContent>
          </Tooltip>

          <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.15), transparent)' }} />
          <div className="flex items-center justify-between mt-2.5">
            {import.meta.env.DEV && (
              <span className="text-[10px] text-slate-500/60 font-mono">volodka://status</span>
            )}
            <div className="flex items-center gap-2">
              {currentWeather !== 'clear' && (
                <div className="flex items-center gap-1" title={getWeatherDescription(currentWeather)}>
                  <WeatherIcon type={currentWeather} className="size-3 weather-icon-bob" />
                </div>
              )}
              <span className="text-[10px] text-cyan-400/50 font-mono tabular-nums" style={{ textShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.2)' }}>{formatGameClock(timeOfDay)}</span>
            </div>
          </div>
          {/* Version indicator */}
          <div className="absolute bottom-1.5 right-3 pointer-events-none">
            <span className="text-[8px] text-slate-600/50 font-mono">v{APP_VERSION}</span>
          </div>
        </div>
      </div>

      {/* ── Mobile compact stats bar — ENHANCED ── */}
      {/* Hidden during onboarding (same gate as desktop stats panel). */}
      <div className={`absolute top-12 left-2 right-2 pointer-events-auto ${isOnboarding ? 'hidden' : 'lg:hidden'}`} style={quietStyle}>
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border backdrop-blur-xl panel-scanlines-subtle ${isLowEnergy || isHighStress ? 'warning-pulse' : ''}`}
          style={{
            background: 'linear-gradient(180deg, rgba(2,6,23,0.92) 0%, rgba(8,12,28,0.88) 100%)',
            borderColor: isLowEnergy || isHighStress ? 'rgba(251,113,133,0.3)' : 'rgb(var(--cyber-cyan-rgb) / 0.15)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono" style={{ color: karmaStroke(karma), textShadow: `0 0 6px ${karmaStroke(karma)}40` }} aria-hidden="true">☯</span>
            <AnimatedCounter value={karma} className={`text-xs font-mono font-bold ${karmaColor(karma)}`} style={{ textShadow: '0 0 4px currentColor' }} />
            <span className="sr-only">{getKarmaTierLabel(karma)} карма {karma}</span>
          </div>
          <div className="w-px h-4 bg-slate-700/30" />
          <div className="flex items-center gap-1.5 flex-1">
            <Zap className={`size-3.5 ${isLowEnergy ? 'text-rose-400' : 'text-emerald-400'}`} />
            <div className="flex-1 h-2 bg-slate-800/70 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{ width: `${energy}%` }}
                transition={{ duration: 0.5 }}
                style={{ background: isLowEnergy ? 'linear-gradient(90deg, #9f1239, #f43f5e)' : 'linear-gradient(90deg, #059669, #34d399)', boxShadow: isLowEnergy ? '0 0 6px rgba(244,63,94,0.3)' : '0 0 6px rgba(52,211,153,0.3)' }}
              />
            </div>
            <AnimatedCounter value={energy} className={`text-xs font-mono font-bold ${isLowEnergy ? 'text-rose-300' : 'text-emerald-300'}`} style={{ textShadow: '0 0 3px currentColor' }} />
          </div>
          <div className="w-px h-4 bg-slate-700/30" />
          <div className="flex items-center gap-1.5 flex-1">
            <Activity className={`size-3.5 ${isHighStress ? 'text-rose-400' : 'text-amber-400'}`} />
            <div className="flex-1 h-2 bg-slate-800/70 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{ width: `${stress}%` }}
                transition={{ duration: 0.5 }}
                style={{ background: isHighStress ? 'linear-gradient(90deg, #9f1239, #f43f5e)' : 'linear-gradient(90deg, #b45309, #f59e0b)', boxShadow: isHighStress ? '0 0 6px rgba(244,63,94,0.3)' : '0 0 6px rgba(245,158,11,0.3)' }}
              />
            </div>
            <AnimatedCounter value={stress} className={`text-xs font-mono font-bold ${isHighStress ? 'text-rose-300' : 'text-amber-300'}`} style={{ textShadow: '0 0 3px currentColor' }} />
          </div>
        </div>
      </div>

      {/* ── Live poem TTL effects (desktop left stack) ── */}
      <PoemActiveEffectsHudSlot />

      {/* ── Status Effects Bar (desktop: bottom-right, mobile: bottom-center) ── */}
      <div className="absolute pointer-events-auto hidden lg:block" style={{ bottom: bottomStatusEffectsPx(), right: 16 }}>
        <StatusEffectsBar />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto lg:hidden" style={{ bottom: bottomStatusEffectsPx() }}>
        <StatusEffectsBar />
      </div>

      <PhysicsDegradedDevBadge />

      {/* ── Contextual hint (floating bottom center) ── */}
      <ContextualHint hint={currentHint} onDismiss={dismissHint} />

      {/* ── Compass indicator (top-right, below top bar) ── */}
      <div className="absolute top-16 sm:top-20 right-3 sm:right-4 pointer-events-none" style={{ zIndex: UI_LAYERS.HUD + 1 }}>
        <CompassIndicator />
      </div>

      {/* ── Active quest mini-tracker (bottom-left, above mobile controls) ── */}
      <div
        className="absolute left-3 sm:left-4 pointer-events-auto"
        style={{ bottom: bottomStatusEffectsPx() + 40, zIndex: UI_LAYERS.HUD + 1 }}
      >
        <ActiveQuestMiniTracker />
      </div>
    </div>
  );
}
