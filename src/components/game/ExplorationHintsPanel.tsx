'use client';

/* ─── Volodka RPG – Exploration Hints Panel ─── */
/* Context-sensitive hints based on current location and game state.
 * Shows available interactions, unexplored areas, quest objectives.
 * Progressive hint system: basic first, detailed after delay.
 * Dismissible per-hint with "don't show again" option.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Swords, Users, Compass, ScrollText, X, EyeOff } from 'lucide-react';
import { useCurrentSceneId, useTimeOfDay, useDiscoveredScenes } from '@/store/selectors';
import { useGameStore as _useGameStore } from '@/store/gameStore';
import { getCombinedGameState } from '@/store/storeBindings';
import { buildScheduleContext } from '@/shared/scheduleContext';
import { getNPCsInScene } from '@/engine/ScheduleEngine';
import { SCENE_CONFIG } from '@/config/scenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { EXPLORATION_HUD_LAYOUT } from '@/shared/constants/hudLayout';
import type { SceneId } from '@/shared/types/game';

/* ── Hint categories ── */
type HintCategory = 'social' | 'exploration' | 'quest' | 'combat';

interface ExplorationHint {
  id: string;
  category: HintCategory;
  title: string;
  detail: string;
  priority: number;
}

const CATEGORY_CONFIG: Record<HintCategory, { icon: typeof Lightbulb; label: string; color: string; borderColor: string }> = {
  social: { icon: Users, label: 'Общение', color: 'text-cyan-400', borderColor: 'rgba(6,182,212,0.3)' },
  exploration: { icon: Compass, label: 'Разведка', color: 'text-emerald-400', borderColor: 'rgba(16,185,129,0.3)' },
  quest: { icon: ScrollText, label: 'Задание', color: 'text-amber-400', borderColor: 'rgba(245,158,11,0.3)' },
  combat: { icon: Swords, label: 'Бой', color: 'text-rose-400', borderColor: 'rgba(244,63,94,0.3)' },
};

/* Progressive delay before showing detailed hints (ms) */
const DETAIL_DELAY_MS = 8000;

export function ExplorationHintsPanel() {
  const currentSceneId = useCurrentSceneId();
  const timeOfDay = useTimeOfDay();
  const discoveredScenes = useDiscoveredScenes();
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = sessionStorage.getItem('volodka:dismissed_hints');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showDetail, setShowDetail] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShowDetail(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowDetail(true), DETAIL_DELAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentSceneId]);

  const dismissHint = useCallback((hintId: string, permanent: boolean) => {
    setDismissedHints((prev) => {
      const next = new Set(prev);
      next.add(hintId);
      if (permanent && typeof window !== 'undefined') {
        try { sessionStorage.setItem('volodka:dismissed_hints', JSON.stringify([...next])); } catch { /* ignore */ }
      }
      return next;
    });
  }, []);

  const hints = useMemo(() => {
    const result: ExplorationHint[] = [];
    const sceneName = SCENE_CONFIG[currentSceneId]?.name ?? currentSceneId;

    // Social hints: NPCs at current location
    try {
      const state = getCombinedGameState();
      const ctx = buildScheduleContext(state);
      const npcsHere = getNPCsInScene(currentSceneId, timeOfDay, ctx);
      if (npcsHere.length > 0) {
        result.push({
          id: `social_npcs_${currentSceneId}`,
          category: 'social',
          title: `${npcsHere.length} ${npcsHere.length === 1 ? 'персонаж' : 'персонажа'} поблизости`,
          detail: `Подойдите ближе, чтобы заговорить. ${npcsHere.length > 1 ? 'Нажмите [E] для взаимодействия.' : ''}`,
          priority: 10,
        });
      }
    } catch { /* schedule engine unavailable during early boot */ }

    // Exploration hints: undiscovered adjacent scenes
    const sceneConfig = SCENE_CONFIG[currentSceneId];
    if (sceneConfig?.exits) {
      const undiscovered = sceneConfig.exits.filter(
        (e) => !discoveredScenes.includes(e.targetScene),
      );
      if (undiscovered.length > 0) {
        result.push({
          id: `exploration_undiscovered_${currentSceneId}`,
          category: 'exploration',
          title: `Неисследованные пути: ${undiscovered.length}`,
          detail: `Обратите внимание на выходы из «${sceneName}» — там могут быть новые места.`,
          priority: 5,
        });
      }
    }

    // Quest hints: active quests related to this location
    try {
      const state = getCombinedGameState();
      const activeQuests = state.quests?.filter((q) => q.status === 'active') ?? [];
      const relevantQuests = activeQuests.filter((q) => {
        const qData = q as { objectiveSceneId?: SceneId; title?: string };
        return qData.objectiveSceneId === currentSceneId;
      });
      if (relevantQuests.length > 0) {
        result.push({
          id: `quest_here_${currentSceneId}`,
          category: 'quest',
          title: `${relevantQuests.length} ${relevantQuests.length === 1 ? 'задание' : 'задания'} в этом месте`,
          detail: 'Проверьте журнал заданий [J] для подробностей.',
          priority: 15,
        });
      }
    } catch { /* quests not loaded yet */ }

    // Contextual hints based on time
    const isNight = timeOfDay >= 21 || timeOfDay < 6;
    if (isNight) {
      result.push({
        id: 'context_night',
        category: 'exploration',
        title: 'Ночное время',
        detail: 'Некоторые персонажи спят. Осмотритесь осторожнее.',
        priority: 2,
      });
    }

    // Time-based hint for leaving NPCs
    if (Math.floor(timeOfDay) >= 20 || Math.floor(timeOfDay) < 7) {
      result.push({
        id: 'context_late_hour',
        category: 'social',
        title: 'Поздний час',
        detail: 'Персонажи могут скоро уйти. Поспешите, если хотите поговорить.',
        priority: 8,
      });
    }

    result.sort((a, b) => b.priority - a.priority);
    return result;
  }, [currentSceneId, timeOfDay, discoveredScenes]);

  const visibleHints = useMemo(
    () => hints.filter((h) => !dismissedHints.has(h.id)),
    [hints, dismissedHints],
  );

  if (visibleHints.length === 0) return null;

  return (
    <div
      className="fixed pointer-events-none hidden lg:block"
      data-testid="exploration-hints-panel"
      style={{
        bottom: EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY + EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY_HEIGHT + 16,
        left: EXPLORATION_HUD_LAYOUT.RIGHT_INSET,
        zIndex: UI_LAYERS.HUD,
        maxWidth: 280,
      }}
    >
      <motion.div
        className="pointer-events-auto rounded-lg border backdrop-blur-md overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(0,0,0,0.72) 0%, rgba(15,23,42,0.6) 50%, rgba(0,0,0,0.5) 100%)',
          borderColor: 'rgba(51,65,85,0.4)',
          boxShadow: '0 0 12px rgba(0,229,255,0.06), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-1.5 px-3 py-2"
          style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}
        >
          <Lightbulb className="size-3 text-amber-400" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            Подсказки
          </span>
          <span className="ml-auto text-[9px] font-mono text-slate-500">
            {visibleHints.length}
          </span>
        </div>

        {/* Hints list */}
        <div className="p-2 space-y-1.5">
          <AnimatePresence>
            {visibleHints.map((hint) => {
              const cfg = CATEGORY_CONFIG[hint.category];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={hint.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-md border overflow-hidden"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderColor: cfg.borderColor,
                  }}
                >
                  <div className="flex items-start gap-2 px-2.5 py-2">
                    <Icon className={`size-3 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-300">{hint.title}</span>
                        <span className={`text-[8px] font-mono uppercase tracking-wider ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <AnimatePresence>
                        {showDetail && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="text-[9px] font-mono text-slate-400 mt-1 leading-relaxed"
                          >
                            {hint.detail}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => dismissHint(hint.id, false)}
                        className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label="Скрыть подсказку"
                      >
                        <X className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissHint(hint.id, true)}
                        className="p-0.5 rounded text-slate-600 hover:text-slate-400 transition-colors"
                        aria-label="Больше не показывать"
                        title="Не показывать снова"
                      >
                        <EyeOff className="size-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(51,65,85,0.3), transparent)',
          }}
        ></div>
        <div className="flex items-center justify-center px-3 py-1">
          <span className="text-[8px] text-slate-600 font-mono">volodka://hints</span>
        </div>
      </motion.div>
    </div>
  );
}
