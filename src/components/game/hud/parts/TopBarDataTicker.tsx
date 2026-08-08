/* ─── Volodka RPG – Top Bar Data Ticker ───
   A scrolling cyberpunk-style data ticker in the top bar.
   Shows dynamic game data: quest count, discovered locations, poems found,
   karma tier, current time, and system status.
*/

import { useMemo } from 'react';
import { useActiveQuests } from '@/store/selectors/questSelectors';
import { useDiscoveredScenes } from '@/store/selectors';
import { useCurrentSceneId, useTimeOfDay } from '@/store/selectors';
import { countCollectedMainPoems, TOTAL_MAIN_POEMS } from '@/data/poemCollectionMeta';
import { useCollectedPoems } from '@/store/selectors/worldSelectors';
import { formatGameClock } from '@/components/game/hud/hudPresentation';
import { SCENE_CONFIG } from '@/config/scenes';
import { APP_VERSION } from '@/shared/constants/appVersion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface TickerItem {
  text: string;
  accent?: string;
}

export function TopBarDataTicker() {
  const activeQuests = useActiveQuests();
  const discovered = useDiscoveredScenes();
  const sceneId = useCurrentSceneId();
  const timeOfDay = useTimeOfDay();
  const collectedPoems = useCollectedPoems();
  const reducedMotion = useEffectiveReducedMotion();

  const sceneName = SCENE_CONFIG[sceneId]?.name ?? sceneId;
  const poemCount = countCollectedMainPoems(collectedPoems);

  const items = useMemo<TickerItem[]>(() => {
    const base: TickerItem[] = [
      { text: `ЗАДАНИЯ: ${activeQuests.length}`, accent: activeQuests.length > 0 ? 'rgb(var(--cyber-cyan-rgb) / 0.9)' : undefined },
      { text: `ЛОКАЦИИ: ${discovered.length}` },
      { text: `СТИХИ: ${poemCount}/${TOTAL_MAIN_POEMS}`, accent: 'rgba(251,191,36,0.8)' },
      { text: `СЦЕНА: ${sceneName.toUpperCase()}` },
      { text: `ВРЕМЯ: ${formatGameClock(timeOfDay)}` },
      { text: `СИСТЕМА: v${APP_VERSION}` },
      { text: '█'.repeat(3) },
      { text: 'ВОЛОДКА://DATASTREAM' },
      { text: `ЗАДАНИЯ: ${activeQuests.length}`, accent: activeQuests.length > 0 ? 'rgb(var(--cyber-cyan-rgb) / 0.9)' : undefined },
      { text: `ЛОКАЦИИ: ${discovered.length}` },
      { text: `СТИХИ: ${poemCount}/${TOTAL_MAIN_POEMS}`, accent: 'rgba(251,191,36,0.8)' },
      { text: `СЦЕНА: ${sceneName.toUpperCase()}` },
      { text: `ВРЕМЯ: ${formatGameClock(timeOfDay)}` },
      { text: `СИСТЕМА: v${APP_VERSION}` },
      { text: '█'.repeat(3) },
      { text: 'ВОЛОДКА://DATASTREAM' },
    ];
    return base;
  }, [activeQuests.length, discovered.length, poemCount, sceneName, timeOfDay]);

  return (
    <div
      className="data-ticker-container hidden sm:block"
      style={{ height: 14, maxWidth: 260 }}
      aria-hidden="true"
    >
      <div
        className="data-ticker-track font-mono hud-filmic-fade-edge hud-filmic-ticker-scroll-glow"
        style={{ animation: reducedMotion ? 'none' : undefined }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="data-ticker-item"
            style={{
              color: item.accent ?? 'rgb(var(--cyber-cyan-rgb) / 0.5)',
              animation: reducedMotion ? 'none' : undefined,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            {item.text}
            {i < items.length - 1 && <span className="data-ticker-separator" />}
          </span>
        ))}
      </div>
    </div>
  );
}