
/* ─── Volodka RPG – Exploration HUD (AAA+ Cyberpunk Polish v2) ───
   Enhanced with: smooth counter animations, quest notification badge,
   karma breathing animation, XP gain floating text, achievement popup,
   better mobile responsive layout.
*/

import { useMemo } from 'react';
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
import { TimeIcon, getTimeOfDayShadow } from '@/components/game/hud/parts/TimeIcon';
import { AmbientParticles } from '@/components/game/hud/parts/AmbientParticles';
import { PhysicsDegradedDevBadge } from '@/components/game/hud/parts/PhysicsDegradedDevBadge';
import { ContextualHint } from '@/components/game/hud/parts/ContextualHint';
import { CompassIndicator } from '@/components/game/hud/parts/CompassIndicator';
import { ExplorationProgressBadge } from '@/components/game/hud/parts/ExplorationProgressBadge';
import { ActiveQuestMiniTracker } from '@/components/game/hud/parts/ActiveQuestMiniTracker';
import { CrosshairInteractionPrompt } from '@/components/game/hud/parts/CrosshairInteractionPrompt';
import { DynamicCrosshair } from '@/components/game/hud/parts/DynamicCrosshair';
import { SceneDiscoveryCelebration } from '@/components/game/hud/parts/SceneDiscoveryCelebration';
import { SceneAmbientVignette } from '@/components/game/hud/parts/SceneAmbientVignette';
import { InteractionCooldownRing } from '@/components/game/hud/parts/InteractionCooldownRing';
import { KarmaTierBadge } from '@/components/game/hud/parts/KarmaTierBadge';
import { HUDNotificationFeed } from '@/components/game/hud/parts/HUDNotificationFeed';
import { SceneContextChip } from '@/components/game/hud/parts/SceneContextChip';
import { SessionPlayTimer } from '@/components/game/hud/parts/SessionPlayTimer';
import { InteractionRadarPulse } from '@/components/game/hud/parts/InteractionRadarPulse';
import { PlayerCoordinatesDisplay } from '@/components/game/hud/parts/PlayerCoordinatesDisplay';
import { FootstepPedometer } from '@/components/game/hud/parts/FootstepPedometer';
import { SprintDrainOverlay } from '@/components/game/hud/parts/SprintDrainOverlay';
import { QuestDirectionArrow } from '@/components/game/hud/parts/QuestDirectionArrow';
import { InteractionDistanceRing } from '@/components/game/hud/parts/InteractionDistanceRing';
import { RainScreenEffect } from '@/components/game/hud/parts/RainScreenEffect';
import { HUDChromaticEdge } from '@/components/game/hud/parts/HUDChromaticEdge';
import { FloatingActionIndicator } from '@/components/game/hud/parts/FloatingActionIndicator';
import { NPCProximityIndicator } from '@/components/game/hud/parts/NPCProximityIndicator';
import { CompassPOIMarkers } from '@/components/game/hud/parts/CompassPOIMarkers';
import { EnvironmentMoodIndicator } from '@/components/game/hud/parts/EnvironmentMoodIndicator';
import { TopBarDataTicker } from '@/components/game/hud/parts/TopBarDataTicker';
import { InteractionProximityGlow } from '@/components/game/hud/parts/InteractionProximityGlow';
import { CombatPreEngagementWarning } from '@/components/game/hud/parts/CombatPreEngagementWarning';
import { HUDBootSequence } from '@/components/game/hud/parts/HUDBootSequence';
import { LootProximityIndicator } from '@/components/game/hud/parts/LootProximityIndicator';
import { useContextualHints } from '@/hooks/useContextualHints';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export type { HUDProps } from '@/components/game/hud/hudTypes';

/* ── Static style constants (avoid recreating objects every render) ── */

const STYLE_TOP_BAR_BG = {
  background: 'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
};

const STYLE_CLOCK_BORDER = { borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.15)', background: 'rgb(var(--cyber-cyan-rgb) / 0.05)' };
const STYLE_XP_MINI_BG = { background: 'linear-gradient(90deg, rgba(8,145,178,0.6), rgb(var(--cyber-cyan-rgb) / 0.6))' };

const STYLE_TOOLTIP_BG = {
  background: 'linear-gradient(145deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.9) 100%)',
  borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.3)',
  boxShadow: '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.12), 0 8px 24px rgba(0,0,0,0.5)',
};

const STYLE_STATUS_EFFECTS_BADGE = { background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(100,116,139,0.2)' };
const STYLE_WEATHER_BADGE = { background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(100,116,139,0.2)' };

const STYLE_MORE_MENU_BG = {
  background: 'linear-gradient(145deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.88) 50%, rgba(0,0,0,0.85) 100%)',
  borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.2)',
  boxShadow: '0 0 20px rgb(var(--cyber-cyan-rgb) / 0.08), 0 8px 32px rgba(0,0,0,0.5)',
};

const STYLE_BOTTOM_GLOW_LINE = { background: 'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.2) 30%, rgb(var(--cyber-cyan-rgb) / 0.35) 50%, rgb(var(--cyber-cyan-rgb) / 0.2) 70%, transparent)' };

const STYLE_DESKTOP_STATUS_BG = {
  background: 'linear-gradient(145deg, rgba(2,6,23,0.95) 0%, rgba(8,12,28,0.92) 40%, rgba(4,8,18,0.88) 100%)',
};

const STYLE_DESKTOP_STATUS_BORDER_CYAN = {
  borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.2)',
  boxShadow: '0 0 20px rgb(var(--cyber-cyan-rgb) / 0.06), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.08)',
};
const STYLE_DESKTOP_STATUS_BORDER_ROSE = {
  borderColor: 'rgba(251, 113, 133, 0.5)',
  boxShadow: '0 0 30px rgba(251,113,133,0.15), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(251,113,133,0.1)',
};

const STYLE_ACCENT_GLOW_SPOTS = { background: 'radial-gradient(ellipse at 20% 20%, rgb(var(--cyber-cyan-rgb) / 0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(251,191,36,0.03) 0%, transparent 50%)' };
const STYLE_ACCENT_CORNER_GLOW = { background: 'radial-gradient(circle at 100% 0%, rgb(var(--cyber-cyan-rgb) / 0.08) 0%, transparent 70%)' };
const STYLE_SHIELD_ICON_BG = { background: 'rgb(var(--cyber-cyan-rgb) / 0.1)', boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.15)' };
const STYLE_STATUS_HEADER_TEXT_GLOW = { textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)' };
const STYLE_HR_CYAN_FADE = { background: 'linear-gradient(90deg, rgb(var(--cyber-cyan-rgb) / 0.3), rgb(var(--cyber-cyan-rgb) / 0.08) 40%, transparent)' };
const STYLE_HR_CYAN_THIN = { background: 'rgb(var(--cyber-cyan-rgb) / 0.15)' };
const STYLE_HR_CYAN_CENTER_FADE = { background: 'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.15), transparent)' };

const STYLE_XP_ICON_GLOW = { boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.2)' };
const STYLE_XP_TEXT_GLOW = { textShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.3)' };

const STYLE_LOW_ENERGY_ICON_GLOW = { boxShadow: '0 0 8px rgba(244,63,94,0.2)' };
const STYLE_NORMAL_ENERGY_ICON_GLOW = { boxShadow: '0 0 8px rgba(52,211,153,0.2)' };
const STYLE_LOW_ENERGY_WARNING_GLOW = { textShadow: '0 0 6px rgba(251,113,133,0.3)' };

const STYLE_HIGH_STRESS_ICON_GLOW = { boxShadow: '0 0 8px rgba(244,63,94,0.2)' };
const STYLE_NORMAL_STRESS_ICON_GLOW = { boxShadow: '0 0 8px rgba(245,158,11,0.2)' };

const STYLE_POEM_TEXT_SHADOW = { textShadow: '0 0 8px rgba(251,191,36,0.4)' };
const STYLE_POEM_COUNTER_SHADOW = { textShadow: '0 0 6px rgba(251,191,36,0.5)' };
const STYLE_POEM_BG_IDLE = {
  background: 'rgba(120,60,10,0.25)',
  borderColor: 'rgba(251,191,36,0.35)',
  boxShadow: '0 0 12px rgba(251,191,36,0.15), inset 0 0 6px rgba(251,191,36,0.05)',
};
const STYLE_POEM_BG_PULSE = {
  background: 'rgba(120,60,10,0.45)',
  borderColor: 'rgba(251,191,36,0.75)',
  boxShadow: '0 0 24px rgba(251,191,36,0.45), inset 0 0 10px rgba(251,191,36,0.12)',
};

const STYLE_MOBILE_BAR_BG = {
  background: 'linear-gradient(180deg, rgba(2,6,23,0.92) 0%, rgba(8,12,28,0.88) 100%)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
};

const STYLE_MOBILE_ENERGY_BAR_NORMAL = { background: 'linear-gradient(90deg, #059669, #34d399)', boxShadow: '0 0 6px rgba(52,211,153,0.3)' };
const STYLE_MOBILE_ENERGY_BAR_LOW = { background: 'linear-gradient(90deg, #9f1239, #f43f5e)', boxShadow: '0 0 6px rgba(244,63,94,0.3)' };
const STYLE_MOBILE_STRESS_BAR_NORMAL = { background: 'linear-gradient(90deg, #b45309, #f59e0b)', boxShadow: '0 0 6px rgba(245,158,11,0.3)' };
const STYLE_MOBILE_STRESS_BAR_HIGH = { background: 'linear-gradient(90deg, #9f1239, #f43f5e)', boxShadow: '0 0 6px rgba(244,63,94,0.3)' };

const STYLE_CURRENT_COLOR_GLOW = { textShadow: '0 0 4px currentColor' };
const STYLE_CURRENT_COLOR_SMALL_GLOW = { textShadow: '0 0 3px currentColor' };

/* ── Dead code removed: CrosshairGlow component (replaced by DynamicCrosshair). ── */

export function ExplorationHUD(props: HUDProps) {
  const state = useHUDController(props);
  const reducedMotion = useEffectiveReducedMotion();
  const quietStyle = useHudQuietStyle();
  const totalPoems = TOTAL_MAIN_POEMS;
  const { currentHint, dismissHint } = useContextualHints();
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
    xpPulse,
    lastXpDelta,
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
    onOpenSaveSlots,
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
    { icon: <Save className="size-4" />, label: 'Сохранение', shortcut: 'F9', onClick: onOpenSaveSlots },
    { icon: <Lightbulb className="size-4" />, label: 'Подсказки', onClick: onToggleTutorials },
    { icon: <Menu className="size-4" />, label: 'Меню', onClick: onOpenMenu },
  ], [onOpenFastTravel, onOpenSkillTree, onOpenPerks, onOpenQuestBoard, onOpenTrading, onOpenCrafting, onOpenMiniGames, onOpenWorldMap, onOpenCharacterProfile, onOpenNPCRelations, onOpenCodex, onOpenDialogueHistory, onOpenAchievements, onOpenSaveSlots, onToggleTutorials, onOpenMenu]);

  if (photoModeOn) return null;

  return (
    <div
      data-exploration-ui
      data-testid="game-hud"
      className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ease-out ${hudMounted ? 'opacity-100' : 'opacity-0'}`}
      style={{ zIndex: UI_LAYERS.HUD }}
    >
      {/* ── Ambient noise overlay (subtle film grain) ── */}
      <div className="ambient-noise-overlay" />

      {/* ── Achievement popup ── */}
      <AchievementPopup achievement={skillAchievement} />

      {/* ── HUD Boot Sequence (one-time boot-up animation) ── */}
      <HUDBootSequence />

      {/* ── Combat Pre-Engagement Warning ── */}
      <CombatPreEngagementWarning />

      {/* ── Scene Ambient Vignette (time/weather reactive edge tint) ── */}
      <SceneAmbientVignette />
      <RainScreenEffect />
      <SprintDrainOverlay />
      <HUDChromaticEdge />

      {/* ── Center: Crosshair + E-key prompt + Cooldown ring + Radar pulse + Proximity glow ── */}
      <DynamicCrosshair />
      <InteractionProximityGlow />
      <InteractionDistanceRing />
      <CrosshairInteractionPrompt />
      <InteractionCooldownRing />
      <InteractionRadarPulse />
      <LootProximityIndicator />

      {/* ── Scene discovery celebration toast ── */}
      <SceneDiscoveryCelebration />

      {/* ── Top bar (fades when HUD is quiet — crosshair stays) ── */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto" style={quietStyle}>
        <div
          className="relative flex items-center justify-between px-2 py-1.5 sm:px-4 sm:py-2.5 hud-scanline-bar hud-topbar-mount"
          style={STYLE_TOP_BAR_BG}
        >
          {/* Animated gradient border line at bottom of top bar */}
          <div className="top-bar-gradient-border absolute bottom-0 left-0 right-0 h-px pointer-events-none" />

          {/* Left: Scene name + time */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: karmaStroke(karma), boxShadow: `0 0 6px ${karmaStroke(karma)}40` }} />
            </div>
            <TimeIcon hour={timeOfDay} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span key={sceneName} className="text-slate-100 text-sm sm:text-base font-semibold tracking-wide truncate neon-text-cyan location-name-glow scene-name-transition">{sceneName}</span>
                <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">●</span>
                <span className="text-[10px] text-slate-300/80 font-mono hidden sm:inline" style={{ textShadow: getTimeOfDayShadow(timeOfDay), transition: 'text-shadow 1s ease' }}>{timeLabel(timeOfDay)}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border ml-0.5"
              style={STYLE_CLOCK_BORDER}
            >
              <Clock className="size-2.5 text-cyan-500/60" />
              <span className="text-cyan-400/80 text-[11px] font-mono tabular-nums">{formatGameClock(timeOfDay)}</span>
            </div>
            <span className="sm:hidden text-cyan-400/70 text-[10px] font-mono tabular-nums">
              {formatGameClock(timeOfDay)}
            </span>

            {/* Karma tier badge (hidden during onboarding) */}
            {!isOnboarding && <KarmaTierBadge karma={karma} />}

            {/* Scene context chip — type + NPC/exit counts */}
            {!isOnboarding && (
              <div className="hidden md:block">
                <SceneContextChip />
              </div>
            )}

            {/* Environment mood indicator (hidden during onboarding) */}
            {!isOnboarding && (
              <div className="hidden lg:block">
                <EnvironmentMoodIndicator />
              </div>
            )}
          </div>

          {/* Center: Data ticker (desktop) */}
          <div className="hidden sm:flex items-center flex-1 justify-center mx-2">
            <TopBarDataTicker />
          </div>

          {/* Right: Level + XP + Poem + Quest + Buttons + More */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <LevelBadge level={level} perkCount={perkCount} xp={xp} xpToNext={xpToNext} justLeveled={justLeveled} />

            {/* XP progress mini-bar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden md:flex flex-col items-center gap-0 w-16 cursor-default">
                  <div className="relative h-1 w-full bg-slate-800/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={STYLE_XP_MINI_BG}
                      initial={false}
                      animate={{ width: `${(xp / xpToNext) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    />
                    <div className="xp-shimmer-overlay absolute inset-0 rounded-full pointer-events-none" />
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono tabular-nums">{xp}/{xpToNext} XP</span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={4}
                className="border backdrop-blur-xl px-3 py-2 max-w-[200px] space-y-1"
                style={STYLE_TOOLTIP_BG}
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
              title="Стихи [P]"
              aria-label={`Стихи: ${mainPoemCount} из ${totalPoems}`}
              style={poemBadgePulse ? STYLE_POEM_BG_PULSE : STYLE_POEM_BG_IDLE}
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
              <span className="text-amber-200 font-semibold hidden sm:inline" style={STYLE_POEM_TEXT_SHADOW}>Стихи:</span>
              <AnimatedCounter value={mainPoemCount} className="text-amber-300 font-bold" style={STYLE_POEM_COUNTER_SHADOW} />
              <span className="text-amber-500/60 hidden sm:inline">/</span>
              <span className="text-amber-400/70 hidden sm:inline">{totalPoems}</span>
            </motion.button>

            <div className="w-px h-4 bg-slate-700/25 mx-0.5" />

            {/* Status effects count badge */}
            {activeStatusEffectCount > 0 && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border cyber-tooltip"
                data-tooltip={`Эффекты: ${activeStatusEffectCount}`}
                style={STYLE_STATUS_EFFECTS_BADGE}
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
              <HUDButton icon={<Camera className="size-3.5 sm:size-4" />} label="Фото" onClick={() => eventBus.emit(PHOTO_EVENTS.toggle, PHOTO_EMPTY_PAYLOAD)} tooltip="Фото [⇧P]" />
            )}
            {!isOnboarding && (
              <HUDButton icon={<BarChart3 className="size-3.5 sm:size-4" />} label="Статистика" onClick={onOpenStats} tooltip="Статистика [S]" />
            )}

            {/* Weather status indicator */}
            {currentWeather !== 'clear' && (
              <div
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md border weather-badge-shimmer"
                style={STYLE_WEATHER_BADGE}
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
                    className="absolute right-0 top-full mt-1.5 w-52 rounded-lg border backdrop-blur-xl overflow-hidden panel-corner-accent panel-data-stream more-menu-enhanced"
                    style={{ ...STYLE_MORE_MENU_BG, zIndex: UI_LAYERS.HUD + 5 }}
                  >
                    <div className="px-3 py-2 border-b border-slate-700/30">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Действия</span>
                    </div>
                    <div className="py-1 px-1 max-h-64 overflow-y-auto">
                      {secondaryActions.map((action, idx) => (
                        <div
                          key={action.label}
                          className="more-menu-item-stagger"
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          <HUDMenuItem
                            icon={action.icon}
                            label={action.label}
                            shortcut={action.shortcut}
                            badge={action.label === 'Доска заданий' ? questNotificationCount : undefined}
                            onClick={() => { setMoreMenuOpen(false); action.onClick?.(); }}
                          />
                        </div>
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
          style={STYLE_BOTTOM_GLOW_LINE}
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
            className="absolute top-16 right-3 sm:top-20 sm:right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/80 border border-cyan-900/30 backdrop-blur-md save-toast-animated overflow-hidden"
            style={{ zIndex: UI_LAYERS.HUD + 1, boxShadow: '0 0 12px rgba(34,211,238,0.25), inset 0 0 12px rgba(34,211,238,0.05)' }}
          >
            {/* Animated progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-cyan-400/70"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'linear' }}
            />
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.15) 2px, rgba(34,211,238,0.15) 4px)',
              }}
            />
            {/* Slot label */}
            <span className="absolute top-0.5 right-1.5 text-[8px] font-mono tracking-widest text-cyan-600/50 select-none">СЛОТ АВТО</span>
            {/* Cyan pulse glow border */}
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none"
              initial={{ boxShadow: '0 0 6px rgba(34,211,238,0.3), inset 0 0 6px rgba(34,211,238,0.05)' }}
              animate={{ boxShadow: ['0 0 6px rgba(34,211,238,0.3), inset 0 0 6px rgba(34,211,238,0.05)', '0 0 18px rgba(34,211,238,0.5), inset 0 0 10px rgba(34,211,238,0.1)', '0 0 6px rgba(34,211,238,0.3), inset 0 0 6px rgba(34,211,238,0.05)'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
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
          className={`relative rounded-2xl p-4 sm:p-5 border backdrop-blur-xl min-w-[260px] overflow-hidden panel-scanlines hex-grid-bg neon-border-breathe stats-panel-breathing hud-glass-shimmer glass-panel-data-pattern ${isLowEnergy || isHighStress ? 'warning-pulse energy-critical-screen' : ''}`}
          style={{
            ...STYLE_DESKTOP_STATUS_BG,
            ...(isLowEnergy || isHighStress ? STYLE_DESKTOP_STATUS_BORDER_ROSE : STYLE_DESKTOP_STATUS_BORDER_CYAN),
          }}
        >
          {/* Animated circuit-trace border at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl overflow-hidden circuit-trace-line pointer-events-none" />

          {/* Accent glow spots */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={STYLE_ACCENT_GLOW_SPOTS} />
          <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none" style={STYLE_ACCENT_CORNER_GLOW} />

          {/* Ambient floating particles */}
          <AmbientParticles />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={STYLE_SHIELD_ICON_BG}>
                <Shield className="size-3 text-cyan-400" />
              </div>
              <span className="text-[11px] text-cyan-400/70 font-mono uppercase tracking-[0.2em]" style={STYLE_STATUS_HEADER_TEXT_GLOW}>СТАТУС</span>
            </div>
            <LevelBadge level={level} perkCount={perkCount} xp={xp} xpToNext={xpToNext} justLeveled={justLeveled} />
          </div>

          <div className="h-px mb-4" style={STYLE_HR_CYAN_FADE} />

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
              style={STYLE_TOOLTIP_BG}
            >
              <div className="text-xs font-semibold text-cyan-300 font-mono">☯ Карма: {karma}/100</div>
              <div className="text-[10px] text-slate-400">Уровень: <span className="text-cyan-400">{getKarmaTierLabel(karma)}</span></div>
              <div className="h-px" style={STYLE_HR_CYAN_THIN} />
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
                  <div className="w-5 h-5 rounded-md flex items-center justify-center bg-cyan-500/10" style={STYLE_XP_ICON_GLOW}>
                    <TrendingUp className="size-3 text-cyan-400" />
                  </div>
                  <span className="text-sm font-semibold text-cyan-300">Опыт</span>
                  <AnimatePresence>
                    {lastXpDelta > 0 && (
                      <motion.span
                        key={lastXpDelta}
                        initial={{ opacity: 0.9, y: 0 }}
                        animate={{ opacity: 0, y: -20 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute -top-4 right-0 text-[11px] font-bold font-mono text-cyan-300 pointer-events-none whitespace-nowrap"
                        style={{ textShadow: '0 0 6px rgba(0,229,255,0.4)' }}
                        aria-hidden="true"
                      >
                        +{lastXpDelta} XP
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="text-[11px] text-cyan-400/70 font-mono ml-auto tabular-nums" style={STYLE_XP_TEXT_GLOW}>
                    {xp}<span className="text-cyan-500/40">/</span>{xpToNext}
                  </span>
                </div>
                <CyberStatBar
                  value={xp}
                  max={xpToNext}
                  color="linear-gradient(90deg, #0891b2, var(--cyber-cyan))"
                  glowColor="rgb(var(--cyber-cyan-rgb) / 0.4)"
                  showSegments={false}
                  shimmer={xpPulse}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={8}
              className="border backdrop-blur-xl px-3 py-2.5 max-w-[240px] space-y-1.5"
              style={STYLE_TOOLTIP_BG}
            >
              <div className="text-xs font-semibold text-cyan-300 font-mono">⬆ Опыт: {xp}/{xpToNext}</div>
              <div className="text-[10px] text-slate-400">До след. уровня: <span className="text-cyan-400">{xpToNext - xp} XP</span></div>
              <div className="h-px" style={STYLE_HR_CYAN_THIN} />
              <div className="text-[10px] text-slate-500 leading-relaxed">Источник: бои, задания, стихи</div>
            </TooltipContent>
          </Tooltip>

          {/* Energy bar — ENHANCED with bigger fonts and glow (with tooltip) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-3 cursor-default">
                <div className="flex items-center gap-2 mb-1.5 relative">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isLowEnergy ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}
                    style={isLowEnergy ? STYLE_LOW_ENERGY_ICON_GLOW : STYLE_NORMAL_ENERGY_ICON_GLOW}
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
                    style={STYLE_LOW_ENERGY_WARNING_GLOW}
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
                ...STYLE_TOOLTIP_BG,
                borderColor: isLowEnergy ? 'rgba(244,63,94,0.3)' : STYLE_TOOLTIP_BG.borderColor,
                boxShadow: isLowEnergy ? '0 0 16px rgba(244,63,94,0.12), 0 8px 24px rgba(0,0,0,0.5)' : STYLE_TOOLTIP_BG.boxShadow,
              }}
            >
              <div className={`text-xs font-semibold font-mono ${isLowEnergy ? 'text-rose-300' : 'text-emerald-300'}`}>⚡ Энергия: {energy}/100</div>
              <div className="text-[10px] text-slate-400">Состояние: <span className={isLowEnergy ? 'text-rose-400' : 'text-emerald-400'}>{energy < 20 ? 'Критическое' : energy < 50 ? 'Низкое' : 'Нормальное'}</span></div>
              <div className="h-px" style={STYLE_HR_CYAN_THIN} />
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
                    style={isHighStress ? STYLE_HIGH_STRESS_ICON_GLOW : STYLE_NORMAL_STRESS_ICON_GLOW}
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
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-rose-400/80 font-mono mt-1 block" style={STYLE_LOW_ENERGY_WARNING_GLOW}>
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
                ...STYLE_TOOLTIP_BG,
                borderColor: isHighStress ? 'rgba(244,63,94,0.3)' : STYLE_TOOLTIP_BG.borderColor,
                boxShadow: isHighStress ? '0 0 16px rgba(244,63,94,0.12), 0 8px 24px rgba(0,0,0,0.5)' : STYLE_TOOLTIP_BG.boxShadow,
              }}
            >
              <div className={`text-xs font-semibold font-mono ${isHighStress ? 'text-rose-300' : 'text-amber-300'}`}>💢 Стресс: {stress}/100</div>
              <div className="text-[10px] text-slate-400">Состояние: <span className={isHighStress ? 'text-rose-400' : 'text-amber-400'}>{stress > 80 ? 'Критическое' : stress > 50 ? 'Повышенное' : 'Нормальное'}</span></div>
              <div className="h-px" style={STYLE_HR_CYAN_THIN} />
              <div className="text-[10px] text-slate-500 leading-relaxed">📖 Стихи — снижение стресса</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">🛏 Отдых — снижение стресса</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">🚶 Прогулка — мягкое снижение</div>
            </TooltipContent>
          </Tooltip>

          <div className="h-px mt-4" style={STYLE_HR_CYAN_CENTER_FADE} />
          <div className="flex items-center justify-between mt-2.5">
            {import.meta.env.DEV && (
              <span className="text-[10px] text-slate-500/60 font-mono text-data-stream">volodka://status</span>
            )}
            <div className="flex items-center gap-2">
              {currentWeather !== 'clear' && (
                <div className="flex items-center gap-1" title={getWeatherDescription(currentWeather)}>
                  <WeatherIcon type={currentWeather} className="size-3 weather-icon-bob" />
                </div>
              )}
              <span className="text-[10px] text-cyan-400/50 font-mono tabular-nums" style={STYLE_XP_TEXT_GLOW}>{formatGameClock(timeOfDay)}</span>
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
            ...STYLE_MOBILE_BAR_BG,
            borderColor: isLowEnergy || isHighStress ? 'rgba(251,113,133,0.3)' : 'rgb(var(--cyber-cyan-rgb) / 0.15)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono" style={{ color: karmaStroke(karma), textShadow: `0 0 6px ${karmaStroke(karma)}40` }} aria-hidden="true">☯</span>
            <AnimatedCounter value={karma} className={`text-xs font-mono font-bold ${karmaColor(karma)}`} style={STYLE_CURRENT_COLOR_GLOW} />
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
                style={isLowEnergy ? STYLE_MOBILE_ENERGY_BAR_LOW : STYLE_MOBILE_ENERGY_BAR_NORMAL}
              />
            </div>
            <AnimatedCounter value={energy} className={`text-xs font-mono font-bold ${isLowEnergy ? 'text-rose-300' : 'text-emerald-300'}`} style={STYLE_CURRENT_COLOR_SMALL_GLOW} />
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
                style={isHighStress ? STYLE_MOBILE_STRESS_BAR_HIGH : STYLE_MOBILE_STRESS_BAR_NORMAL}
              />
            </div>
            <AnimatedCounter value={stress} className={`text-xs font-mono font-bold ${isHighStress ? 'text-rose-300' : 'text-amber-300'}`} style={STYLE_CURRENT_COLOR_SMALL_GLOW} />
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

      {/* ── HUD Notification Feed (left side, below top bar) ── */}
      <HUDNotificationFeed />

      {/* ── Contextual hint (floating bottom center) ── */}
      <ContextualHint hint={currentHint} onDismiss={dismissHint} />

      {/* ── Quest direction arrow (edge-of-screen) ── */}
      <QuestDirectionArrow />

      {/* ── Floating action indicator (bottom center) ── */}
      <FloatingActionIndicator />

      {/* ── NPC proximity indicator (above crosshair) ── */}
      <NPCProximityIndicator />

      {/* ── Compass + POI markers + Exploration progress (top-right, below top bar) ── */}
      <div className="absolute top-16 sm:top-20 right-3 sm:right-4 flex flex-col items-center gap-3 pointer-events-none" style={{ zIndex: UI_LAYERS.HUD + 1 }}>
        <div className="relative">
          <CompassIndicator />
          <CompassPOIMarkers />
        </div>
        <ExplorationProgressBadge />
        <SessionPlayTimer />
        <FootstepPedometer />
      </div>

      {/* ── Active quest mini-tracker (bottom-left, above mobile controls) ── */}
      <div
        className="absolute left-3 sm:left-4 pointer-events-auto"
        style={{ bottom: bottomStatusEffectsPx() + 40, zIndex: UI_LAYERS.HUD + 1 }}
      >
        <ActiveQuestMiniTracker />
      </div>

      {/* ── Player coordinates display (below minimap, desktop only) ── */}
      <div className="absolute pointer-events-none hidden lg:block" style={{ top: 'auto', bottom: 216, right: 16, zIndex: UI_LAYERS.HUD }}>
        <PlayerCoordinatesDisplay />
      </div>

      {/* ── Edge warning overlays for low energy / high stress ── */}
      <AnimatePresence>
        {(isLowEnergy || isHighStress) && (
          <>
            <motion.div
              key="warn-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="hud-edge-warning-left"
              aria-hidden="true"
            />
            <motion.div
              key="warn-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="hud-edge-warning-right"
              aria-hidden="true"
            />
            <motion.div
              key="warn-bottom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="hud-edge-warning-bottom"
              aria-hidden="true"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
