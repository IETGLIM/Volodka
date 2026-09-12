/* ─── Volodka RPG – Scene Context Chip ───
 * A compact chip showing scene type icon, Russian label, NPC count, and exits count.
 * Styled with cyberpunk aesthetic, backdrop-blur, and a breathing glow border.
 */

import { useMemo } from 'react';
import { Sun, Home, Mountain, Cloud } from 'lucide-react';
import { useMiniMapState, useCurrentSceneId } from '@/store/selectors/explorationSelectors';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { SCENE_CONFIG } from '@/config/scenes';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { SceneDefinition } from '@/shared/types/sceneDefinition';
import { t } from '@/i18n';

/* i18n (этап 115): с волны 4 aria-строка — шаблон каталога с плейсхолдерами
 * {name} и параметрами t(key, fallback, params); ключ литеральный, фолбэк
 * байт-в-байт повторяет прежний литерал. */

type SceneType = SceneDefinition['type'];

/* Акцент типа сцены (v4.30): иконка/рамка/свечение перекрашиваются по типу
 * локации вместо монотонного циана. Токены — из tokens.css. */
const SCENE_TYPE_CONFIG: Record<
  SceneType,
  { icon: typeof Sun; label: string; accentRgbVar: string }
> = {
  outdoor: { icon: Sun, label: t('hud.sceneContext.street', 'Улица'), accentRgbVar: '--cyber-cyan-rgb' },
  indoor: { icon: Home, label: t('hud.sceneContext.indoor', 'Помещение'), accentRgbVar: '--cyber-matrix-rgb' },
  underground: { icon: Mountain, label: t('hud.sceneContext.underground', 'Подземелье'), accentRgbVar: '--cyber-amber-rgb' },
  dream: { icon: Cloud, label: t('hud.sceneContext.dream', 'Сон'), accentRgbVar: '--cyber-violet-rgb' },
};

export function SceneContextChip() {
  const quietStyle = useHudQuietStyle();
  const reducedMotion = useEffectiveReducedMotion();
  const currentSceneId = useCurrentSceneId();
  const { npcStates } = useMiniMapState();

  const sceneDef = SCENE_DEFINITIONS[currentSceneId];

  const { icon: SceneIcon, label: sceneLabel, accentRgbVar } = sceneDef
    ? SCENE_TYPE_CONFIG[sceneDef.type]
    : SCENE_TYPE_CONFIG.indoor;
  const accent = `rgb(var(${accentRgbVar}) / `;

  const npcCount = useMemo(() => {
    if (!npcStates) return 0;
    let count = 0;
    for (const npcDef of ALL_NPC_DEFINITIONS) {
      const state = npcStates[npcDef.id];
      if (state?.sceneId === currentSceneId) {
        count++;
      }
    }
    return count;
  }, [npcStates, currentSceneId]);

  const exitsCount = SCENE_CONFIG[currentSceneId]?.exits?.length ?? 0;

  if (!sceneDef) return null;

  return (
    <div
      key={`chip-${currentSceneId}`}
      className="scene-context-chip relative flex items-center gap-1.5 rounded-md px-2 py-1 select-none pointer-events-none hud-filmic-chip-slide-in hud-filmic-context-chip-fade"
      style={{
        background: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${accent}0.2)`,
        boxShadow: `0 0 6px ${accent}0.15), inset 0 0 3px ${accent}0.05)`,
        ...quietStyle,
      }}
      aria-label={t('hud.sceneContext.aria', `${sceneLabel} — NPC: ${npcCount}, Выходов: ${exitsCount}`, {
        scene: sceneLabel,
        npc: npcCount,
        exits: exitsCount,
      })}
    >
      <SceneIcon
        size={10}
        style={{ color: `${accent}0.7)`, flexShrink: 0 }}
      />
      <span
        className="font-mono text-[9px] tracking-wide uppercase hud-filmic-text-glow hud-filmic-scene-title"
        style={{ color: `${accent}0.8)` }}
      >
        {sceneLabel}
      </span>

      {/* Divider dot */}
      <span
        className="w-px h-3 mx-0.5"
        style={{ background: `${accent}0.2)` }}
      />

      {/* NPC count — одноразовый вспых-пульс значения при смене (v4.30) */}
      <span
        className="font-mono text-[8px] tabular-nums"
        style={{ color: 'rgba(148, 163, 184, 0.6)' }}
      >
        {t('hud.sceneContext.npcPrefix', 'NPC:')}
        <span
          key={`npc-${npcCount}`}
          className={reducedMotion ? undefined : 'hud-filmic-value-pop'}
        >
          {npcCount}
        </span>
      </span>

      {/* Divider dot */}
      <span
        className="w-px h-3 mx-0.5"
        style={{ background: `${accent}0.2)` }}
      />

      {/* Exits count — одноразовый вспых-пульс значения при смене (v4.30) */}
      <span
        className="font-mono text-[8px] tabular-nums"
        style={{ color: 'rgba(148, 163, 184, 0.6)' }}
      >
        {t('hud.sceneContext.exitsPrefix', 'EX:')}
        <span
          key={`exits-${exitsCount}`}
          className={reducedMotion ? undefined : 'hud-filmic-value-pop'}
        >
          {exitsCount}
        </span>
      </span>
    </div>
  );
}