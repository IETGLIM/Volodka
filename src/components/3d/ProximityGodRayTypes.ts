export interface ProximityGodRayProps {
  /** Static active flag — omit when using activeRef */
  active?: boolean;
  /** Imperative active flag — avoids React re-renders when toggled from central tick */
  activeRef?: React.RefObject<boolean>;
  color?: string;
  /** Imperative beam color — updated without React re-render */
  colorRef?: React.RefObject<string>;
  beamHeight?: number;
  baseY?: number;
  /** Per-frame proximity factor (0–1) — avoids React re-renders */
  proximityRef?: React.RefObject<number>;
  /** Brief intensity spike on interact — parent sets true for ~200ms */
  flashRef?: React.RefObject<boolean>;
  /** Hover pulse phase in radians — synced from parent distance loop */
  pulsePhaseRef?: React.RefObject<number>;
  /** Steady glow (no sin pulse) — reduced-motion poem highlights */
  staticHighlightRef?: React.RefObject<boolean>;
  /** Base radius of the volumetric cone — widen for area-scale zones (hazard zones). */
  coneRadius?: number;
  /** Mount spot/fill lights at all — false keeps the additive cone only.
   *  PERF (v4.40): default теперь false. Раньше каждая зона/NPC/выход
   *  монтировала spot+point свет (2 источника × 12-19 инстанций = 25-40
   *  лишних light-юнитов на сцену): пухлые шейдеры всех материалов,
   *  пер-кадровый CPU-аплоад light-униформ, риск ре-компиляции при смене
   *  счётчика света. Аддитивный конус + глинт читаются и без реального света. */
  enableLights?: boolean;
  /** Spot cone angle in radians — keep in sync with coneRadius for wide beams. */
  spotAngle?: number;
}
