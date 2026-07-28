/* ─── Volodka RPG – Emergency Help Button ("Что делать?") ─── */
/* A small "?" button in the bottom-right corner of the exploration HUD.
 * Shows a popover with quest guidance, directional hints, available
 * interactions in the current scene, and a reset interaction button.
 * Pulses when the player has been idle for 15+ seconds. */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleHelp, RotateCcw, Eye, AlertTriangle } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { getCurrentGuidance } from '@/engine/GuidedStoryManager';
import { forceResetAllInteractionState } from '@/engine/interaction/emergencyInteractionReset';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { useCurrentSceneId } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomStatusEffectsPx } from '@/shared/constants/hudLayout';
import { eventBus } from '@/engine/EventBus';

const IDLE_PULSE_THRESHOLD_MS = 15_000;

/** Contextual hint for the first_reading quest. */
function getFirstReadingContextualHint(): string | null {
  try {
    const snap = getGameSnapshot();
    if (snap.playerState.progression.currentAct !== 1) return null;
    const quest = snap.quests.find(
      (q) => q.questId === 'first_reading' && q.status === 'active',
    );
    if (!quest) return null;
    const deskDone = snap.playerState.flags['interacted_desk'] === true;
    if (!deskDone) return 'Подойди к рабочему столу и нажми [E]';
    const hasPoem2 = snap.collectedPoems.includes('poem_2');
    const monitorRead = snap.playerState.flags['terminal_poem_read'] === true;
    if (!monitorRead && !hasPoem2) return 'Активируй монитор на столе [E] — стих мерцает на экране';
    if (!hasPoem2) return 'Стихотворение можно найти на книжной полке слева от стола';
    return null;
  } catch {
    return null;
  }
}

export function EmergencyHelpButton() {
  const currentSceneId = useCurrentSceneId();
  const [open, setOpen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const lastInteractionRef = useRef(Date.now());

  // Track player activity
  useEffect(() => {
    const markActive = () => {
      lastInteractionRef.current = Date.now();
      setIsIdle(false);
    };

    const unsubs = [
      eventBus.on('interaction:start', markActive),
      eventBus.on('interaction:end', markActive),
      eventBus.on('scene:loaded', markActive),
      eventBus.on('scene:enter', markActive),
      eventBus.on('story:guidance_update', markActive),
    ];

    // Also listen for keyboard/mouse input as activity signals
    const onInput = () => { lastInteractionRef.current = Date.now(); };
    window.addEventListener('keydown', onInput);
    window.addEventListener('mousedown', onInput);
    window.addEventListener('pointerdown', onInput);

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastInteractionRef.current;
      setIsIdle(elapsed >= IDLE_PULSE_THRESHOLD_MS);
    }, 3000);

    return () => {
      for (const unsub of unsubs) unsub();
      clearInterval(interval);
      window.removeEventListener('keydown', onInput);
      window.removeEventListener('mousedown', onInput);
      window.removeEventListener('pointerdown', onInput);
    };
  }, []);

  // Close popover on phase change
  useEffect(() => {
    const unsub = eventBus.on('game:loaded', () => setOpen(false));
    return unsub;
  }, []);

  const handleResetInteraction = useCallback(() => {
    forceResetAllInteractionState();
    setOpen(false);
  }, []);

  // Compute help content
  const helpContent = useMemo(() => {
    try {
      const snap = getGameSnapshot();
      const guidance = getCurrentGuidance();

      const _questTitle = guidance
        ? (snap.quests.find((q) => q.questId === guidance.targetId)?.status === 'active'
          ? guidance.objectiveText
          : null)
        : null;

      // Fallback: active golden-path quest objective
      let objectiveText = guidance?.objectiveText ?? '';
      if (!objectiveText) {
        const activeQuest = snap.quests.find((q) => q.status === 'active');
        if (activeQuest) {
          objectiveText = 'Активное задание — открой журнал [Q]';
        }
      }

      const firstReadingHint = getFirstReadingContextualHint();

      // Trigger zones for current scene
      const sceneZones = TRIGGER_ZONES.filter((z) => z.sceneId === currentSceneId)
        .filter((z) => {
          if (z.requiredFlag && !snap.playerState.flags[z.requiredFlag]) return false;
          if (z.hiddenWhenFlag && snap.playerState.flags[z.hiddenWhenFlag]) return false;
          return true;
        })
        .slice(0, 6); // cap to 6 items

      return {
        objectiveText,
        firstReadingHint,
        sceneZones,
        currentAct: snap.playerState.progression.currentAct,
      };
    } catch {
      return {
        objectiveText: '',
        firstReadingHint: null,
        sceneZones: [],
        currentAct: 1,
      };
    }
  }, [open, currentSceneId]); // recompute when popover opens

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        bottom: bottomStatusEffectsPx() + 44,
        right: 16,
        zIndex: UI_LAYERS.HUD + 2,
      }}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative flex items-center justify-center rounded-full hud-button-cyber focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/50"
            style={{
              width: 28,
              height: 28,
              background: 'rgba(0, 10, 18, 0.8)',
              border: '1px solid rgba(100, 116, 139, 0.25)',
              boxShadow: '0 0 8px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
            }}
            aria-label="Что делать?"
            title="Что делать?"
          >
            <CircleHelp className="size-4 text-slate-400" />
            {/* Idle pulse ring */}
            <AnimatePresence>
              {isIdle && !open && (
                <motion.span
                  key="idle-pulse"
                  className="absolute inset-0 rounded-full border border-cyan-400/40"
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: [0, 0.6, 0], scale: [1, 1.4, 1.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  aria-hidden
                />
              )}
            </AnimatePresence>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          sideOffset={8}
          align="end"
          className="w-72 p-0 overflow-hidden border border-slate-700/40"
          style={{
            background: 'linear-gradient(145deg, rgba(2,6,23,0.96) 0%, rgba(8,12,28,0.94) 100%)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 24px rgba(0,0,0,0.6), 0 0 8px rgb(0 255 238 / 0.06)',
            zIndex: UI_LAYERS.HUD + 20,
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-700/30">
            <CircleHelp className="size-4 text-cyan-400/80" />
            <span className="text-xs font-semibold font-mono text-cyan-300">Что делать?</span>
          </div>

          {/* Content */}
          <div className="px-3 py-2.5 space-y-2.5 max-h-[60vh] overflow-y-auto">
            {/* Current objective */}
            {helpContent.objectiveText && (
              <div>
                <p className="text-[9px] font-mono text-slate-500 mb-0.5">ТЕКУЩАЯ ЦЕЛЬ</p>
                <p className="text-[11px] font-mono leading-snug text-cyan-100/90">
                  {helpContent.objectiveText}
                </p>
              </div>
            )}

            {/* First reading contextual hint */}
            {helpContent.firstReadingHint && (
              <div>
                <p className="text-[9px] font-mono text-amber-500/70 mb-0.5">ПОДСКАЗКА</p>
                <p className="text-[11px] font-mono leading-snug text-amber-200/90">
                  → {helpContent.firstReadingHint}
                </p>
              </div>
            )}

            {/* Available interactions */}
            {helpContent.sceneZones.length > 0 && (
              <div>
                <p className="text-[9px] font-mono text-slate-500 mb-1">
                  <Eye className="size-2.5 inline-block mr-1 -mt-px" />
                  ЧТО РЯДОМ ({helpContent.sceneZones.length})
                </p>
                <div className="space-y-0.5">
                  {helpContent.sceneZones.map((zone) => (
                    <p
                      key={zone.id}
                      className="text-[10px] font-mono leading-snug text-slate-400/80 pl-3"
                    >
                      <span className="text-slate-500/60 mr-1">[E]</span>
                      {zone.enterToast ?? zone.examineData?.title ?? zone.id}
                    </p>
                  ))}
                  {helpContent.sceneZones.length >= 6 && (
                    <p className="text-[9px] font-mono text-slate-600 pl-3">…и другие</p>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-slate-700/20" />

            {/* Reset interaction */}
            <button
              type="button"
              onClick={handleResetInteraction}
              className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded hover:bg-white/5 transition-colors group"
            >
              <RotateCcw className="size-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                Сбросить взаимодействие
              </span>
            </button>

            {/* Last resort hint */}
            <div className="flex items-start gap-1.5 px-2 pt-0.5">
              <AlertTriangle className="size-3 text-slate-600 mt-px shrink-0" />
              <p className="text-[9px] font-mono leading-snug text-slate-600">
                Если ничего не помогает — сохраните и загрузите игру
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}