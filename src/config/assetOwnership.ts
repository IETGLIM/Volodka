import type { SceneId } from '@/shared/types/game';
import { INTERIOR_SHELL_MODELS } from '@/config/interiorShellModels';
import { POLYHAVEN_MODELS } from '@/config/polyhavenAssets';

export type AssetOwner =
  | 'authored_shell'
  | 'scene_prop_dressing'
  | 'polyhaven_street'
  | 'procedural'
  | 'kenney_fallback'
  | 'glb_npc'
  | 'manifest_environment';

export type SceneAssetSlot =
  | 'interior_shell'
  | 'prop_dressing'
  | 'street_setpiece'
  | 'procedural_overlay'
  | 'manifest_environment'
  | 'npc_character';

export type AssetPlacementSystem =
  | 'AuthoredInteriorShell'
  | 'SceneInteriorAssets'
  | 'ScenePropDressing'
  | 'SceneManifestAssets'
  | 'PhysicsSceneInner'
  | 'ProceduralAaaHybridOverlay'
  | 'NPCSystem'
  | 'prune-deploy-assets';

export interface QualityOwnershipRules {
  highUltra: 'enabled' | 'deferred' | 'blocked';
  lite: 'enabled' | 'deferred' | 'blocked';
}

export interface SceneAssetOwnershipEntry {
  sceneId: SceneId;
  slot: SceneAssetSlot;
  owner: AssetOwner;
  systems: readonly AssetPlacementSystem[];
  quality: QualityOwnershipRules;
  exclusive?: boolean;
  assetIds?: readonly string[];
  publicUrls?: readonly string[];
  notes?: string;
}

const ENABLED_ALL: QualityOwnershipRules = { highUltra: 'enabled', lite: 'enabled' };
const HIGH_ONLY: QualityOwnershipRules = { highUltra: 'enabled', lite: 'blocked' };
const DEFERRED_HIGH_ONLY: QualityOwnershipRules = { highUltra: 'deferred', lite: 'blocked' };

export const SCENE_ASSET_OWNERSHIP: readonly SceneAssetOwnershipEntry[] = [
  {
    sceneId: 'volodka_room',
    slot: 'interior_shell',
    owner: 'authored_shell',
    systems: ['AuthoredInteriorShell', 'prune-deploy-assets'],
    quality: HIGH_ONLY,
    exclusive: true,
    assetIds: ['interior_room_bedroom'],
    publicUrls: [INTERIOR_SHELL_MODELS.volodkaBedroom],
    notes: 'The room visual owns its shell; generic interior bundles must not duplicate it.',
  },
  {
    sceneId: 'cafe_evening',
    slot: 'interior_shell',
    owner: 'authored_shell',
    systems: ['AuthoredInteriorShell', 'prune-deploy-assets'],
    quality: HIGH_ONLY,
    exclusive: true,
    assetIds: ['interior_cafe'],
    publicUrls: [INTERIOR_SHELL_MODELS.cafe],
  },
  {
    sceneId: 'office_day',
    slot: 'interior_shell',
    owner: 'authored_shell',
    systems: ['AuthoredInteriorShell', 'prune-deploy-assets'],
    quality: HIGH_ONLY,
    exclusive: true,
    assetIds: ['interior_office'],
    publicUrls: [INTERIOR_SHELL_MODELS.office],
  },
  {
    sceneId: 'library_day',
    slot: 'interior_shell',
    owner: 'authored_shell',
    systems: ['AuthoredInteriorShell', 'prune-deploy-assets'],
    quality: HIGH_ONLY,
    exclusive: true,
    assetIds: ['interior_library'],
    publicUrls: [INTERIOR_SHELL_MODELS.library],
  },
  ...([
    ['volodka_corridor', 'interior_corridor'],
    ['factory_basement', 'interior_basement'],
    ['rooftop_edge', 'interior_rooftop'],
  ] as const).map(([sceneId, assetId]): SceneAssetOwnershipEntry => ({
    sceneId,
    slot: 'interior_shell',
    owner: 'kenney_fallback',
    systems: ['SceneInteriorAssets', 'prune-deploy-assets'],
    quality: DEFERRED_HIGH_ONLY,
    exclusive: true,
    assetIds: [assetId],
  })),
  ...([
    ['abandoned_factory', 'interior_factory', INTERIOR_SHELL_MODELS.factory],
    ['river_pier', 'interior_pier', INTERIOR_SHELL_MODELS.pier],
    ['chk_forest_zorge', 'interior_forest_clearing', INTERIOR_SHELL_MODELS.forestClearing],
  ] as const).map(([sceneId, assetId, publicUrl]): SceneAssetOwnershipEntry => ({
    sceneId,
    slot: 'interior_shell',
    owner: 'kenney_fallback',
    systems: ['AuthoredInteriorShell', 'prune-deploy-assets'],
    quality: DEFERRED_HIGH_ONLY,
    exclusive: true,
    assetIds: [assetId],
    publicUrls: [publicUrl],
    notes: 'Hero backdrop shell owned by scene visual; SceneInteriorAssets must not duplicate it.',
  })),
  {
    sceneId: 'street_night',
    slot: 'street_setpiece',
    owner: 'polyhaven_street',
    systems: ['ScenePropDressing', 'PhysicsSceneInner', 'prune-deploy-assets'],
    quality: HIGH_ONLY,
    exclusive: true,
    assetIds: [
      'polyhaven_street_lamp',
      'polyhaven_utility_box',
      'polyhaven_power_box',
      'polyhaven_exterior_aircon_unit',
      'polyhaven_security_camera',
    ],
    publicUrls: [
      POLYHAVEN_MODELS.streetLamp,
      POLYHAVEN_MODELS.utilityBox,
      POLYHAVEN_MODELS.powerBox,
      POLYHAVEN_MODELS.exteriorAirconUnit,
      POLYHAVEN_MODELS.securityCamera,
    ],
    notes: 'Street hero set dressing owns utility props; Kenney city clutter stays fallback-only.',
  },
  {
    sceneId: 'street_night',
    slot: 'procedural_overlay',
    owner: 'procedural',
    systems: ['ProceduralAaaHybridOverlay', 'PhysicsSceneInner'],
    quality: { highUltra: 'enabled', lite: 'blocked' },
    exclusive: false,
  },
  {
    sceneId: 'cafe_evening',
    slot: 'manifest_environment',
    owner: 'manifest_environment',
    systems: ['SceneManifestAssets', 'PhysicsSceneInner', 'prune-deploy-assets'],
    quality: HIGH_ONLY,
    exclusive: false,
    assetIds: ['env_cafe_props'],
  },
  {
    sceneId: 'park_day',
    slot: 'manifest_environment',
    owner: 'manifest_environment',
    systems: ['SceneManifestAssets', 'PhysicsSceneInner', 'prune-deploy-assets'],
    quality: HIGH_ONLY,
    exclusive: false,
    assetIds: ['veg_tree_pine'],
  },
  {
    sceneId: 'chk_forest_zorge',
    slot: 'manifest_environment',
    owner: 'manifest_environment',
    systems: ['SceneManifestAssets', 'PhysicsSceneInner', 'prune-deploy-assets'],
    quality: HIGH_ONLY,
    exclusive: false,
    assetIds: ['veg_tree_pine'],
    notes: 'Shipped pine LODs at clearing perimeter; backdrop shell + props own hero clutter.',
  },
  ...([
    'volodka_room',
    'volodka_corridor',
    'office_day',
    'library_day',
    'cafe_evening',
    'rooftop_edge',
    'river_pier',
    'chk_forest_zorge',
    'zarema_albert_room',
    'abandoned_factory',
    'factory_basement',
  ] as const).map(
    (sceneId): SceneAssetOwnershipEntry => ({
      sceneId,
      slot: 'prop_dressing',
      owner: 'scene_prop_dressing',
      systems: ['ScenePropDressing'],
      quality: ENABLED_ALL,
      exclusive: false,
      notes: 'ScenePropDressing registry owns interior/outdoor clutter for this location.',
    }),
  ),
  {
    sceneId: 'street_night',
    slot: 'prop_dressing',
    owner: 'scene_prop_dressing',
    systems: ['ScenePropDressing'],
    quality: ENABLED_ALL,
    exclusive: false,
    notes: 'Kenney street clutter; PolyHaven hero setpieces stay in street_setpiece slot.',
  },
];

export function getSceneAssetOwnership(sceneId: SceneId): readonly SceneAssetOwnershipEntry[] {
  return SCENE_ASSET_OWNERSHIP.filter((entry) => entry.sceneId === sceneId);
}

export function getSceneSlotOwnership(
  sceneId: SceneId,
  slot: SceneAssetSlot,
): readonly SceneAssetOwnershipEntry[] {
  return getSceneAssetOwnership(sceneId).filter((entry) => entry.slot === slot);
}

export function isSceneAssetSystemAllowed(
  sceneId: SceneId,
  slot: SceneAssetSlot,
  system: AssetPlacementSystem,
): boolean {
  const entries = getSceneSlotOwnership(sceneId, slot);
  if (entries.length === 0) return true;
  return entries.some((entry) => entry.systems.includes(system));
}

export function collectAssetOwnershipPublicUrls(): string[] {
  const urls = new Set<string>();
  for (const entry of SCENE_ASSET_OWNERSHIP) {
    if (!entry.systems.includes('prune-deploy-assets')) continue;
    for (const url of entry.publicUrls ?? []) urls.add(url);
  }
  return [...urls];
}

export function validateSceneAssetOwnershipConflicts(): string[] {
  const conflicts: string[] = [];
  const exclusiveBySceneSlot = new Map<string, SceneAssetOwnershipEntry>();

  for (const entry of SCENE_ASSET_OWNERSHIP) {
    if (!entry.exclusive) continue;
    const key = `${entry.sceneId}:${entry.slot}`;
    const previous = exclusiveBySceneSlot.get(key);
    if (previous && previous.owner !== entry.owner) {
      conflicts.push(`${key} has ${previous.owner} and ${entry.owner}`);
    } else if (previous) {
      conflicts.push(`${key} is declared more than once for ${entry.owner}`);
    } else {
      exclusiveBySceneSlot.set(key, entry);
    }
  }

  return conflicts;
}
