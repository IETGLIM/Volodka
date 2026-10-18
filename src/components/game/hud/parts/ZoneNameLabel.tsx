/* ─── Volodka RPG – Zone Name Label ───
 * v4.58.0 «Ровный экран»: единый носитель имени текущей сцены — как имя зоны
 * под миникартой в WoW. Заменяет ТРИ навигационных слоя (QuestDirectionArrow,
 * CompassHUD, ScenePoiCompass) и два чипа-дубликата (SceneContextChip,
 * AudioInfoDisplay), которые вместе застилали экран текстом.
 *
 * Контракт: постоянный, тихий, один. Никаких счётчиков NPC/выходов — только
 * имя зоны. Живёт внутри [data-testid="game-hud"] (маунт в ExplorationHUD),
 * поэтому e2e act1-спеков («Комната Володьки» / «Коридор коммуналки» внутри
 * game-hud) остаются зелёными без правок спеков.
 */

import { useCurrentSceneId } from '@/store/selectors/explorationSelectors';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { EXPLORATION_HUD_LAYOUT } from '@/shared/constants/hudLayout';
import { CLASSIC_UI } from '@/shared/constants/uiTheme';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export function ZoneNameLabel() {
  const sceneId = useCurrentSceneId();
  const sceneName = sceneId ? SCENE_DEFINITIONS[sceneId]?.name : undefined;
  if (!sceneName) return null;

  return (
    <div
      data-testid="zone-name-label"
      className="pointer-events-none absolute right-4 max-w-[240px] text-right"
      style={{
        /* Слот бывшего DifficultyIndicator (снят в v4.58.0): под миникартой,
         * над квест-трекером (его CLASSIC-отступ 10+MINIMAP+8+34 не тронут). */
        top: CLASSIC_UI ? 10 + EXPLORATION_HUD_LAYOUT.MINIMAP_HEIGHT + 8 : 48,
        zIndex: UI_LAYERS.HUD + 1,
      }}
    >
      <p
        className="truncate text-[11px] font-mono uppercase tracking-[0.22em] text-amber-100/85"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
      >
        {sceneName}
      </p>
      <div
        className="ml-auto mt-0.5 h-px w-10 bg-gradient-to-l from-amber-200/45 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
