/**
 * Авторский масштаб GLB персонажей: одна таблица по имени файла + простые правила сцены/интро.
 * Не вычисляем bbox в рантайме — подгонка ассета в данных (AAA: правка в DCC + число здесь).
 */

import { rewriteLegacyModelPath } from '@/config/modelUrls';
import type { SceneId } from '@/data/types';
import {
  applyExplorationPlayerGlobalVisualScale,
  PLAYER_GLB_VISUAL_UNIFORM_MAX,
  PLAYER_GLB_VISUAL_UNIFORM_MIN,
} from '@/lib/playerScaleConstants';

/**
 * Коэффициент до `roomModelScale` и до `applyExplorationPlayerGlobalVisualScale` (÷5):
 * произведение должно после ÷5 попадать между `PLAYER_GLB_VISUAL_UNIFORM_*`, иначе всё «липнет» к MIN.
 */
const DEFAULT_CHARACTER_UNIFORM_BASE = 1.17;

/**
 * Имя файла (нижний регистр) → коэффициент (ещё без `roomModelScale` и до глобального ÷5).
 * Подбирается вручную по кадру в типичных сценах; новый GLB — добавить строку.
 */
export const GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME: Record<string, number> = {
  'volodka.glb': 1.08,
  /** Khronos glTF-Sample-Models — humanoid walk (CesiumMan). */
  'khronos_cc0_cesiumman.glb': 1.12,
  /** Тонкий скинированный манекен (RiggedFigure). */
  'khronos_cc0_riggedfigure.glb': 1.22,
  /** Khronos Fox — компактное животное; без завышения «как люди» (иначе ломает кап bbox). */
  'khronos_cc0_fox.glb': 0.42,
  'sayuri_dans.glb': 1.05,
  'spartan_armour_mkv_-_halo_reach.glb': 0.94,
};

/** Потолок uniform по узким интерьерам (как прежние жёсткие капы в `playerScaleConstants`). */
const NARROW_SCENE_UNIFORM_CAP: Partial<Record<SceneId, number>> = {
  /** Комната 10×8: ниже потолок — ещё ужимаем uniform, чтобы игрок не «съедал» кадр. */
  zarema_albert_room: 0.24,
  /** Кинокадр в комнате героя: баланс «читаемый рост» vs кадр узкой комнаты. */
  volodka_room: 0.31,
  volodka_corridor: 0.29,
  home_evening: 0.26,
};

/** 3D-интро: чуть ужимаем относительно геймплея + абсолютный потолок (кинокамера ближе TPS). */
export const INTRO_CUTSCENE_UNIFORM_SHRINK = 0.62;
/** Абсолютный потолок после shrink; 0.055 давал «муравья» в интро при нормальном геймплей-uniform. */
export const INTRO_CUTSCENE_UNIFORM_CAP = 0.088;

export function glbBasenameFromUrl(url: string): string {
  const u = rewriteLegacyModelPath(url.trim());
  const noQuery = u.split('?')[0] ?? u;
  const i = Math.max(noQuery.lastIndexOf('/'), noQuery.lastIndexOf('\\'));
  return noQuery.slice(i + 1).toLowerCase();
}

export function getCharacterUniformBaseForGlbUrl(modelUrl: string): number {
  const k = glbBasenameFromUrl(modelUrl);
  const v = GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME[k];
  return v != null && Number.isFinite(v) && v > 0 ? v : DEFAULT_CHARACTER_UNIFORM_BASE;
}

/**
 * Итоговый uniform для `<primitive scale={…} />` персонажа: таблица × комната × карточка NPC × глобальный ÷5 × кап по сцене × интро.
 */
export function resolveCharacterMeshUniformScale(
  modelUrl: string,
  opts: {
    roomModelScale: number;
    definitionModelScale?: number;
    introCutsceneActive?: boolean;
    clampSceneId?: SceneId;
  },
): number {
  const base = getCharacterUniformBaseForGlbUrl(modelUrl);
  const def =
    opts.definitionModelScale != null &&
    Number.isFinite(opts.definitionModelScale) &&
    opts.definitionModelScale > 0
      ? opts.definitionModelScale
      : 1;
  const rs = Number.isFinite(opts.roomModelScale)
    ? Math.max(0.28, Math.min(1.25, opts.roomModelScale))
    : 1;
  let u = base * rs * def;
  u = applyExplorationPlayerGlobalVisualScale(u);
  const cap = opts.clampSceneId ? NARROW_SCENE_UNIFORM_CAP[opts.clampSceneId] : undefined;
  if (cap != null && Number.isFinite(cap)) {
    u = Math.min(u, cap);
  }
  if (opts.introCutsceneActive) {
    u = Math.min(u * INTRO_CUTSCENE_UNIFORM_SHRINK, INTRO_CUTSCENE_UNIFORM_CAP);
  }
  return Math.max(PLAYER_GLB_VISUAL_UNIFORM_MIN, Math.min(PLAYER_GLB_VISUAL_UNIFORM_MAX, u));
}
