/* ─── Volodka RPG – Contextual Hint System ───
   Subscribes to EventBus events and player state to produce contextual
   hint messages displayed near the bottom of the exploration HUD.
   Priority: combat > quest > interaction > low stats.
   Debounce: same hint key suppressed for 45 seconds.
*/

import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { useHUDControllerState } from '@/store/selectors/hudSelectors';
import { SCENE_CONFIG } from '@/config/scenes';

/* ── Hint types ── */

export type HintCategory = 'combat' | 'quest' | 'interaction' | 'low_stats' | 'scene' | 'tutorial';

export interface ContextualHintData {
  id: string;
  text: string;
  category: HintCategory;
  /** Auto-dismiss in ms (default 4000) */
  duration?: number;
}

/* ── Priority rank (higher = shown first) ── */
const CATEGORY_PRIORITY: Record<HintCategory, number> = {
  combat: 4,
  quest: 3,
  interaction: 2,
  low_stats: 1,
  scene: 0,
  tutorial: -1,
};

const DEBOUNCE_MS = 45_000;
const DEFAULT_DURATION_MS = 3600;

/* ── Internal queue entry ── */
interface QueuedHint extends ContextualHintData {
  enqueuedAt: number;
  priority: number;
}

/** Dedup key — prevents the same logical hint from appearing twice within the debounce window. */
function hintDedupKey(hint: ContextualHintData): string {
  return `${hint.category}:${hint.id}`;
}

export function useContextualHints() {
  const { energy, stress, currentSceneId } = useHUDControllerState();
  const [currentHint, setCurrentHint] = useState<ContextualHintData | null>(null);
  const queueRef = useRef<QueuedHint[]>([]);
  const shownMapRef = useRef<Map<string, number>>(new Map()); // key → timestamp
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isShowingRef = useRef(false);
  const prevSceneRef = useRef(currentSceneId);

  /* ── Try to advance the queue to the next hint ── */
  const tryShowNext = useCallback(() => {
    // Clean expired debounce entries
    const now = Date.now();
    for (const [key, ts] of shownMapRef.current) {
      if (now - ts > DEBOUNCE_MS) shownMapRef.current.delete(key);
    }

    // Remove expired entries from queue so hints do not surface late.
    queueRef.current = queueRef.current.filter((h) => now - h.enqueuedAt < 8_000);

    if (queueRef.current.length === 0) {
      setCurrentHint(null);
      isShowingRef.current = false;
      return;
    }

    // Sort by priority descending, then FIFO
    queueRef.current.sort((a, b) => b.priority - a.priority || a.enqueuedAt - b.enqueuedAt);

    // Find first non-debounced hint
    let nextIdx = -1;
    for (let i = 0; i < queueRef.current.length; i++) {
      const key = hintDedupKey(queueRef.current[i]);
      const lastShown = shownMapRef.current.get(key);
      if (lastShown === undefined || now - lastShown > DEBOUNCE_MS) {
        nextIdx = i;
        break;
      }
    }

    // Remove all entries we're skipping (debounced)
    if (nextIdx === -1) {
      queueRef.current = [];
      setCurrentHint(null);
      isShowingRef.current = false;
      return;
    }

    const next = queueRef.current.splice(nextIdx, 1)[0];
    shownMapRef.current.set(hintDedupKey(next), now);

    setCurrentHint({
      id: next.id,
      text: next.text,
      category: next.category,
      duration: next.duration,
    });
    isShowingRef.current = true;

    // Auto-dismiss after duration
    const duration = next.duration ?? DEFAULT_DURATION_MS;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrentHint(null);
      isShowingRef.current = false;
      // Check for more in queue
      tryShowNext();
    }, duration);
  }, []);

  /* ── Enqueue a hint ── */
  const enqueueHint = useCallback((hint: ContextualHintData) => {
    const now = Date.now();
    const dedupKey = hintDedupKey(hint);
    const lastShown = shownMapRef.current.get(dedupKey);
    if (lastShown !== undefined && now - lastShown < DEBOUNCE_MS) return; // debounced

    const entry: QueuedHint = {
      ...hint,
      enqueuedAt: now,
      priority: CATEGORY_PRIORITY[hint.category],
    };
    queueRef.current.push(entry);

    // If nothing is currently showing, try to display immediately
    if (!isShowingRef.current) {
      tryShowNext();
    }
  }, [tryShowNext]);

  /* ── Dismiss current hint manually ── */
  const dismissHint = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentHint(null);
    isShowingRef.current = false;
    tryShowNext();
  }, [tryShowNext]);

  /* ── EventBus subscriptions ── */

  // Hover interaction prompts are handled by the crosshair caption; duplicating
  // them here made every nearby NPC feel like a tutorial popup.

  // Interaction proximity hint
  useEffect(() => {
    const unsub = eventBus.on('interaction:in_range', () => {
      enqueueHint({
        id: 'interact_hint',
        text: 'Нажмите E для взаимодействия',
        category: 'interaction',
        duration: 3000,
      });
    });
    return () => { unsub(); };
  }, [enqueueHint]);

  // Startup hint: movement controls shown once
  const startupHintShown = useRef(false);
  useEffect(() => {
    if (startupHintShown.current) return;
    if (!currentSceneId) return;
    startupHintShown.current = true;
    const timer = setTimeout(() => {
      enqueueHint({
        id: 'startup_movement',
        text: 'Shift — бег, Ctrl — крадение',
        category: 'tutorial',
        duration: 5000,
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentSceneId, enqueueHint]);

  // Combat control hint on first combat
  const combatHintShown = useRef(false);
  useEffect(() => {
    const unsub = eventBus.on('combat:start', () => {
      if (combatHintShown.current) return;
      combatHintShown.current = true;
      enqueueHint({
        id: 'combat_controls',
        text: 'ЛКМ — атака, ПКМ — блок',
        category: 'combat',
        duration: 5000,
      });
    });
    return () => { unsub(); };
  }, [enqueueHint]);

  // Combat start
  useEffect(() => {
    const unsubStart = eventBus.on('combat:start', (payload) => {
      enqueueHint({
        id: 'combat_nearby',
        text: `Опасность рядом — ${payload.encounterName ?? 'бой'}`,
        category: 'combat',
      });
    });
    return () => { unsubStart(); };
  }, [enqueueHint]);

  // Quest objective updated / completable
  useEffect(() => {
    const unsubObj = eventBus.on('quest:objective_updated', (payload) => {
      enqueueHint({
        id: `quest_obj_${payload.questId}_${payload.objectiveId}`,
        text: 'Задание обновлено — проверьте журнал [J]',
        category: 'quest',
      });
    });
    const unsubAccepted = eventBus.on('quest:accepted', (payload) => {
      enqueueHint({
        id: `quest_new_${payload.questId}`,
        text: `Новое задание: ${payload.questTitle}`,
        category: 'quest',
      });
    });
    return () => { unsubObj(); unsubAccepted(); };
  }, [enqueueHint]);

  // Scene enter: scene description
  useEffect(() => {
    if (prevSceneRef.current !== currentSceneId) {
      prevSceneRef.current = currentSceneId;
      const sceneConfig = SCENE_CONFIG[currentSceneId];
      if (sceneConfig?.entryText) return;
      const sceneName = sceneConfig?.name ?? 'Неизвестно';
      enqueueHint({
        id: `scene_enter_${currentSceneId}`,
        text: `· ${sceneName} ·`,
        category: 'scene',
        duration: 2400,
      });
    }
  }, [currentSceneId, enqueueHint]);

  /* ── Low stats hints (checked periodically) ── */
  const lastLowStatHintRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastLowStatHintRef.current < DEBOUNCE_MS) return;

    if (energy < 20) {
      lastLowStatHintRef.current = now;
      enqueueHint({
        id: 'low_energy',
        text: 'Сил мало. Кофе вернет дыхание.',
        category: 'low_stats',
      });
    } else if (stress > 80) {
      lastLowStatHintRef.current = now;
      enqueueHint({
        id: 'high_stress',
        text: 'Мысли шумят. Стихи или отдых помогут.',
        category: 'low_stats',
      });
    }
  }, [energy, stress, enqueueHint]);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      queueRef.current = [];
      isShowingRef.current = false;
    };
  }, []);

  return { currentHint, dismissHint };
}
