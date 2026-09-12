/* ─── Volodka RPG – Top Bar Data Ticker ───
   A scrolling cyberpunk-style data ticker in the top bar.
   Shows dynamic game data: quest count, discovered locations, poems found,
   karma tier, current time, and system status.

   AI-новости: строка из /api/city-news (FreeRouter-прокси) подмешивается
   в ротацию с бейджем «ЭФИР». Если прокси недоступен (нет ключа, сеть,
   таймаут) — хук отдаёт null и тикер работает как раньше, только со
   статичными строками (graceful degradation).
*/

import { useMemo } from 'react';
import { useActiveQuests } from '@/store/selectors/questSelectors';
import { useDiscoveredScenes } from '@/store/selectors';
import { useCurrentSceneId, useTimeOfDay } from '@/store/selectors';
import { usePlayerCurrentAct } from '@/store/selectors/playerSelectors';
import { countCollectedMainPoems, TOTAL_MAIN_POEMS } from '@/data/poemCollectionMeta';
import { useCollectedPoems } from '@/store/selectors/worldSelectors';
import { formatGameClock } from '@/components/game/hud/hudPresentation';
import { SCENE_CONFIG } from '@/config/scenes';
import { APP_VERSION } from '@/shared/constants/appVersion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useCityNews } from '@/hooks/useCityNews';
import { t } from '@/i18n';

/* i18n (этап 115): с волны 4 составные строки тикера — шаблоны каталога
 * с плейсхолдерами {name} и параметрами t(key, fallback, params); ключи
 * литеральные, фолбэки байт-в-байт повторяют прежние литералы — вывод не меняется. */

interface TickerItem {
  text: string;
  accent?: string;
  /** Бейдж перед текстом (например «ЭФИР» у AI-новостей). */
  badge?: string;
}

export function TopBarDataTicker() {
  const activeQuests = useActiveQuests();
  const discovered = useDiscoveredScenes();
  const sceneId = useCurrentSceneId();
  const timeOfDay = useTimeOfDay();
  const collectedPoems = useCollectedPoems();
  const reducedMotion = useEffectiveReducedMotion();
  const act = usePlayerCurrentAct();

  // AI-новость ночного города: пуллинг не чаще раза в 3.5 минуты, кэш
  // localStorage, при недоступности API — null и тикер без «ЭФИР»-строки.
  const { news: aiNews } = useCityNews(sceneId, act, timeOfDay);

  const sceneName = SCENE_CONFIG[sceneId]?.name ?? sceneId;
  const poemCount = countCollectedMainPoems(collectedPoems);

  const items = useMemo<TickerItem[]>(() => {
    const half: TickerItem[] = [
      { text: t('hud.ticker.quests', `ЗАДАНИЯ: ${activeQuests.length}`, { n: activeQuests.length }), accent: activeQuests.length > 0 ? 'rgb(var(--cyber-cyan-rgb) / 0.9)' : undefined },
      { text: t('hud.ticker.locations', `ЛОКАЦИИ: ${discovered.length}`, { n: discovered.length }) },
      { text: t('hud.ticker.poems', `СТИХИ: ${poemCount}/${TOTAL_MAIN_POEMS}`, { done: poemCount, total: TOTAL_MAIN_POEMS }), accent: 'rgba(251,191,36,0.8)' },
      { text: t('hud.ticker.scene', `СЦЕНА: ${sceneName.toUpperCase()}`, { name: sceneName.toUpperCase() }) },
      { text: t('hud.ticker.time', `ВРЕМЯ: ${formatGameClock(timeOfDay)}`, { time: formatGameClock(timeOfDay) }) },
      { text: t('hud.ticker.system', `СИСТЕМА: v${APP_VERSION}`, { version: APP_VERSION }) },
      { text: '█'.repeat(3) },
      { text: t('hud.ticker.datastream', 'ВОЛОДКА://DATASTREAM') },
    ];
    // AI-строка городского эфира — только когда прокси вернул текст.
    if (aiNews) {
      half.push({ text: aiNews, accent: 'rgba(251,191,36,0.85)', badge: t('hud.ticker.badge.onAir', 'ЭФИР') });
    }
    // Дублируем половину — бесшовная ротация бегущей строки (как раньше:
    // без AI-новости это ровно тот же список из 16 статичных строк).
    return [...half, ...half];
  }, [activeQuests.length, discovered.length, poemCount, sceneName, timeOfDay, aiNews]);

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
            {item.badge ? (
              <span
                aria-hidden="true"
                style={{
                  color: 'rgba(251,191,36,0.95)',
                  border: '1px solid rgba(251,191,36,0.4)',
                  borderRadius: 2,
                  padding: '0 3px',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  lineHeight: '10px',
                  flexShrink: 0,
                }}
              >
                {item.badge}
              </span>
            ) : null}
            {item.text}
            {i < items.length - 1 && <span className="data-ticker-separator" />}
          </span>
        ))}
      </div>
    </div>
  );
}