/* ─── Volodka RPG – Screen Reader Game Event Announcer ───
 * Subscribes to EventBus events and announces them via ARIA live regions.
 * - aria-live="polite" for most events (quest, poem, scene, dialogue)
 * - aria-live="assertive" for combat events (needs immediate attention)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { eventBus, type EventBusUnsubscribe } from '@/engine/EventBus';
import { findNpcById } from '@/data/allNpcDefinitions';
import { getUnifiedPoem } from '@/data/unifiedPoemRegistry';
import { SCENE_CONFIG } from '@/config/scenes';
import type { SceneId } from '@/config/sceneIds';

interface Announcement {
  id: number;
  message: string;
  priority: 'polite' | 'assertive';
}

let announcementCounter = 0;

/** Scene ID → human-readable name, derived from scene definitions. */
function getSceneName(sceneId: string): string {
  const config = SCENE_CONFIG[sceneId as SceneId];
  if (config?.name) return config.name;
  // Fallback: replace underscores with spaces and capitalize
  return sceneId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** NPC ID → human-readable name, derived from NPC definitions. */
function getNpcName(npcId: string): string {
  const def = findNpcById(npcId);
  return def?.name ?? npcId;
}

/** Poem ID → human-readable title, derived from unified poem registry. */
function getPoemTitle(poemId: string): string {
  const desc = getUnifiedPoem(poemId);
  return desc?.poemTitle ?? desc?.canonicalName ?? poemId;
}

/**
 * GameAnnouncer — invisible component that announces game events to screen readers.
 * Mount once at the root of the game UI (e.g. inside OrchestratorContent).
 */
export function GameAnnouncer() {
  const [politeQueue, setPoliteQueue] = useState<Announcement[]>([]);
  const [assertiveQueue, setAssertiveQueue] = useState<Announcement[]>([]);
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const entry: Announcement = { id: ++announcementCounter, message, priority };
    if (priority === 'assertive') {
      setAssertiveQueue((prev) => [...prev.slice(-2), entry]);
    } else {
      setPoliteQueue((prev) => [...prev.slice(-4), entry]);
    }
  }, []);

  // Clear the live region content after announcement so repeat messages work
  useEffect(() => {
    if (politeQueue.length === 0) return;
    const timer = setTimeout(() => {
      setPoliteQueue([]);
    }, 1000);
    return () => clearTimeout(timer);
  }, [politeQueue]);

  useEffect(() => {
    if (assertiveQueue.length === 0) return;
    const timer = setTimeout(() => {
      setAssertiveQueue([]);
    }, 1500);
    return () => clearTimeout(timer);
  }, [assertiveQueue]);

  // Subscribe to EventBus events
  useEffect(() => {
    const unsubs: EventBusUnsubscribe[] = [];

    // Quest objective completed
    unsubs.push(
      eventBus.on('quest:complete_objective', (payload) => {
        announce(`Цель выполнена: ${payload.objectiveId}`);
      }),
    );

    // Quest objective updated
    unsubs.push(
      eventBus.on('quest:objective_updated', (payload) => {
        announce(`Цель обновлена: ${payload.objectiveId}`);
      }),
    );

    // Combat start — assertive
    unsubs.push(
      eventBus.on('combat:start', (payload) => {
        const enemyName = payload.encounterName ?? payload.enemyType;
        announce(`Бой начался! Противник: ${enemyName}`, 'assertive');
      }),
    );

    // Combat victory — assertive
    unsubs.push(
      eventBus.on('combat:victory', (payload) => {
        announce(`Бой окончен. Победа! Получено опыта: ${payload.xpGained}`, 'assertive');
      }),
    );

    // Combat defeat — assertive
    unsubs.push(
      eventBus.on('combat:defeat', (_payload) => {
        announce('Бой окончен. Поражение.', 'assertive');
      }),
    );

    // Poem collected
    unsubs.push(
      eventBus.on('poem:collected', (payload) => {
        const title = getPoemTitle(payload.poemId);
        announce(`Стихотворение собрано: ${title}`);
      }),
    );

    // Scene transition
    unsubs.push(
      eventBus.on('scene:enter', (payload) => {
        const name = getSceneName(payload.sceneId);
        announce(`Переход: ${name}`);
      }),
    );

    // NPC dialogue
    unsubs.push(
      eventBus.on('npc:talked', (payload) => {
        const name = getNpcName(payload.npcId);
        // Only announce the NPC name; dialogue text is already shown visually
        announce(`${name} говорит`);
      }),
    );

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [announce]);

  const politeText = politeQueue.map((a) => a.message).join('. ');
  const assertiveText = assertiveQueue.map((a) => a.message).join('. ');

  return (
    <>
      {/* Polite live region — announces after current speech finishes */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-a11y-announcer="polite"
      >
        {politeText}
      </div>
      {/* Assertive live region — interrupts current speech */}
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-a11y-announcer="assertive"
      >
        {assertiveText}
      </div>
    </>
  );
}
