import type { InteractiveObjectConfig } from '@/config/scenes';
import type { SceneId } from '@/data/types';
import type { RadialMenuAction } from '@/components/game/RadialMenu';

const RADIAL_ACTION_ORDER: RadialMenuAction[] = ['inspect', 'take', 'use', 'drop'];

/**
 * Есть ли смысл показывать «Использовать» для объекта в обходе (без дублирования полной логики `GameOrchestrator`).
 * Сцены без веток ниже получают `use` только при чтении/стихах (`canBeRead` / `poemId`).
 */
export function explorationObjectSupportsUse(sceneId: SceneId, obj: InteractiveObjectConfig): boolean {
  if (obj.canBeRead || obj.poemId) return true;
  if (sceneId === 'home_evening' && obj.id.startsWith('home_')) return true;
  if (sceneId === 'volodka_corridor' && obj.id.startsWith('corridor_')) return true;
  if (sceneId === 'volodka_room' && obj.id === 'volodka_door_corridor') return true;
  return false;
}

/**
 * Действия радиального меню E у интерактива: только то, что реально доступно для объекта и сцены.
 */
export function getExplorationRadialMenuActions(
  sceneId: SceneId,
  obj: InteractiveObjectConfig,
  hasItem: (itemId: string) => boolean,
): RadialMenuAction[] {
  const set = new Set<RadialMenuAction>(['inspect']);
  if (obj.itemId) {
    set.add('take');
    if (hasItem(obj.itemId)) {
      set.add('drop');
    }
  }
  if (explorationObjectSupportsUse(sceneId, obj)) {
    set.add('use');
  }
  return RADIAL_ACTION_ORDER.filter((a) => set.has(a));
}
