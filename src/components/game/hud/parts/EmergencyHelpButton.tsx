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
import { getFirstReadingHint } from '@/engine/guidedStory/firstReadingHint';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { useCurrentSceneId } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomStatusEffectsPx } from '@/shared/constants/hudLayout';
import { eventBus } from '@/engine/EventBus';

const IDLE_PULSE_THRESHOLD_MS = 15_000;

export function EmergencyHelpButton() {
  const currentSceneId = useCurrentSceneId();
  const [open, setOpen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const lastInteractionRef = useRef(Date.now());

  // Track player activity
  useEffect(() => {
    const markActive = () => {
      lastInteractionRef.current = Date.now();
      setIsIdle((prev) => (prev ? false : prev));
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
      const nextIdle = elapsed >= IDLE_PULSE_THRESHOLD_MS;
      setIsIdle((prev) => (prev === nextIdle ? prev : nextIdle));
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
      void _questTitle;

      // Fallback: active golden-path quest objective
      let objectiveText = guidance?.objectiveText ?? '';
      if (!objectiveText) {
        const activeQuest = snap.quests.find((q) => q.status === 'active');
        if (activeQuest) {
          objectiveText = 'Активное задание — открой журнал [Q]';
        }
      }

      const firstReadingHint = getFirstReadingHint();

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when popover opens
  }, [open, currentSceneId]);

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
            className={`relative flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400/40 ${isIdle && !open ? 'hud-filmic-emergency-pulse' : ''}`}
            style={{
              // WS22: 44px min touch target for mobile a11y (was 28px)
              width: 44,
              height: 44,
              background: 'var(--hud-filmic-plate-strong)',
              border: '1px solid var(--hud-filmic-border)',
              boxShadow: 'var(--hud-filmic-shadow)',
              backdropFilter: 'blur(8px)',
              color: 'var(--hud-filmic-ink-muted)',
            }}
            aria-label="Что делать?"
            title="Что делать?"
          >
            <CircleHelp className="size-5" />
            {/* Idle pulse ring */}
            <AnimatePresence>
              {isIdle && !open && (
                <motion.span
                  key="idle-pulse"
                  className="absolute inset-0 rounded-sm border"
                  style={{ borderColor: 'rgba(196,181,160,0.35)' }}
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [1, 1.35, 1.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
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
          className="w-72 p-0 overflow-hidden hud-filmic-plate border-0"
          style={{
            zIndex: UI_LAYERS.HUD + 20,
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: 'var(--hud-filmic-border)' }}>
            <CircleHelp className="size-4" style={{ color: 'var(--hud-filmic-ink-muted)' }} />
            <span className="hud-filmic-kicker">Что делать?</span>
          </div>

          {/* Content */}
          <div className="px-3 py-2.5 space-y-2.5 max-h-[60vh] overflow-y-auto">
            {/* Current objective */}
            {helpContent.objectiveText && (
              <div>
                <p className="hud-filmic-kicker mb-0.5">Текущая цель</p>
                <p className="hud-filmic-body text-[12px]" style={{ textAlign: 'left' }}>
                  {helpContent.objectiveText}
                </p>
              </div>
            )}

            {/* First reading contextual hint */}
            {helpContent.firstReadingHint && (
              <div>
                <p className="hud-filmic-kicker mb-0.5" style={{ color: 'var(--hud-filmic-accent)' }}>Подсказка</p>
                <p className="hud-filmic-body text-[12px] opacity-90" style={{ textAlign: 'left', fontStyle: 'italic' }}>
                  {helpContent.firstReadingHint}
                </p>
              </div>
            )}

            {/* Available interactions */}
            {helpContent.sceneZones.length > 0 && (
              <div>
                <p className="hud-filmic-kicker mb-1">
                  <Eye className="size-2.5 inline-block mr-1 -mt-px" />
                  Что рядом ({helpContent.sceneZones.length})
                </p>
                <div className="space-y-0.5">
                  {helpContent.sceneZones.map((zone) => (
                    <p
                      key={zone.id}
                      className="text-[11px] font-serif leading-snug pl-3"
                      style={{ color: 'var(--hud-filmic-ink-muted)' }}
                    >
                      <span className="hud-filmic-kicker mr-1" style={{ letterSpacing: '0.1em' }}>E</span>
                      {zone.enterToast ?? zone.examineData?.title ?? zone.id}
                    </p>
                  ))}
                  {helpContent.sceneZones.length >= 6 && (
                    <p className="hud-filmic-kicker pl-3">…и другие</p>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px" style={{ background: 'var(--hud-filmic-border)' }} />

            {/* Reset interaction */}
            <button
              type="button"
              onClick={handleResetInteraction}
              className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-sm hover:bg-white/5 transition-colors group"
            >
              <RotateCcw className="size-3 text-stone-500 group-hover:text-stone-300 transition-colors" />
              <span className="text-[10px] font-mono text-stone-500 group-hover:text-stone-300 transition-colors">
                Сбросить взаимодействие
              </span>
            </button>

            {/* Last resort hint */}
            <div className="flex items-start gap-1.5 px-2 pt-0.5">
              <AlertTriangle className="size-3 text-stone-600 mt-px shrink-0" />
              <p className="hud-filmic-kicker leading-snug" style={{ letterSpacing: '0.06em' }}>
                Если ничего не помогает — сохраните и загрузите игру
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}