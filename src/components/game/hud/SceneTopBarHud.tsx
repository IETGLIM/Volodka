/* ─── Volodka RPG – Scene Top Bar HUD ───
 * Cohesive top-bar cluster mounting orphaned-but-built widgets:
 *   - SceneContextChip     (top-left:  scene type · NPC count · exits)
 *   - (v4.55.0: TopBarDataTicker удалён — CLASSIC_UI никогда его не показывал)
 *   - ExplorationProgressBadge + EnvironmentMoodIndicator (top-right)
 *
 * All widgets are existing built components — this wrapper only positions
 * them in a unified frame so they share the quiet-HUD fade behavior and
 * don't overlap with CompassHUD (which sits below at top: 58px) or the
 * AutoSaveIndicator (top-right toast).
 *
 * Pure additive: no state writes, no new data. Safe to mount during
 * exploration profile only.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SceneContextChip } from '@/components/game/hud/parts/SceneContextChip';
import { PlayerStatusFrame } from '@/components/game/hud/parts/PlayerStatusFrame';
import { ExplorationProgressBadge } from '@/components/game/hud/parts/ExplorationProgressBadge';
import { EnvironmentMoodIndicator } from '@/components/game/hud/parts/EnvironmentMoodIndicator';
import { KarmaTierBadge } from '@/components/game/hud/parts/KarmaTierBadge';
import { KarmaRing } from '@/components/game/hud/parts/KarmaRing';
import { LevelBadge } from '@/components/game/hud/parts/LevelBadge';
import { CompassIndicator } from '@/components/game/hud/parts/CompassIndicator';
import { StatPulse } from '@/components/game/hud/parts/StatPulse';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { CLASSIC_UI } from '@/shared/constants/uiTheme';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { usePlayerKarma } from '@/store/selectors/playerSelectors';
import { usePlayerEnergy, usePlayerStress } from '@/store/selectors/playerSelectors';
import { useProgressionSummary } from '@/store/selectors';
import {
  HUD_ENERGY_WARN_THRESHOLD,
  HUD_STRESS_HIGH_THRESHOLD,
} from '@/components/game/hud/hudThresholds';
import { t } from '@/i18n';

export const SceneTopBarHud = memo(function SceneTopBarHud() {
  const quietStyle = useHudQuietStyle();
  const reducedMotion = useEffectiveReducedMotion();
  const karma = usePlayerKarma();
  const energy = usePlayerEnergy();
  const stress = usePlayerStress();
  // Порог из hudThresholds: WARN (иконка) — раннее предупреждение, LOW (25) — эффекты.
  const isLowEnergy = energy <= HUD_ENERGY_WARN_THRESHOLD;
  const isHighStress = stress >= HUD_STRESS_HIGH_THRESHOLD;
  // Compact-widget data: level + XP + perk count — узкая подписка (этап 100):
  // memo-виджет больше не ре-рендерится на смену погоды/энергии/кармы.
  // (justLeveled is left false here — the LevelBadge internally animates the XP bar
  //  width on every prop change, so the pulse is purely a bonus, not a correctness gap.)
  const { level, xp, xpToNextLevel: xpToNext, unlockedPerks } = useProgressionSummary();
  const perkCount = unlockedPerks?.length ?? 0;

  return (
    <div
      data-exploration-ui
      data-testid="scene-top-bar-hud"
      className="fixed left-0 right-0 top-0 pointer-events-none"
      style={{ zIndex: UI_LAYERS.HUD + 1, ...quietStyle }}
      role="region"
      aria-label={t('hud.topBar.aria', 'Верхняя панель интерфейса: сцена, уровень, опыт, компас и время')}
    >
      {/* Top-left: WoW-стиль фрейм героя (портрет + бары ЭН/СТР/КАР) + сцена-чип.
          Фрейм скрыт на мобильных (compact тач-HUD) — как и правый кластер.
          FIX (orphan): KarmaHudMeter существовал, но не монтировался; его роль
          теперь выполняет постоянный PlayerStatusFrame в топ-баре. */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-2 left-2.5 flex items-start gap-2"
      >
        <div className="hidden sm:block">
          <PlayerStatusFrame />
        </div>
        <SceneContextChip />
      </motion.div>

      {/* Top-right: v4.51.0 «Классический UI» — правый верх отдаётся миникарте
          (как в WoW): карма-кольцо, бейдж уровня, компас, настроение среды и
          прогресс исследования спрятаны — их дублирует юнит-фрейм слева и
          миникарта справа. XP переехал в классическую полосу над панелью. */}
      {!CLASSIC_UI && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-2 right-2 flex items-start gap-2"
        >
          <KarmaTierBadge karma={karma} />
          <div className="hidden sm:flex items-center gap-2">
            <KarmaRing karma={karma} />
            <LevelBadge
              level={level}
              perkCount={perkCount}
              xp={xp}
              xpToNext={xpToNext}
              justLeveled={false}
            />
            <CompassIndicator />
          </div>
          <div className="relative">
            <EnvironmentMoodIndicator />
            <StatPulse active={isLowEnergy || isHighStress} color={isHighStress ? 'rose' : 'amber'} />
          </div>
          <ExplorationProgressBadge />
        </motion.div>
      )}

      {/* v4.45.0: нижний левый кластер (шагомер + таймер сессии + координаты)
          ДЕМОНТИРОВАН. Три цифровые метрики выглядели отладкой и тянули
          внимание (арт-ревью HUD). Компоненты сохранены — при желании
          возвращаются одной строкой. <FootstepPedometer /> <SessionPlayTimer />
          <PlayerCoordinatesDisplay /> */}
    </div>
  );
});
