/**
 * PhysicsSceneInner mount-order invariants.
 *
 * PhysicsSceneInner is a thin orchestrator of section wrappers below.
 * Changing section order can break Rapier init, interaction queries,
 * GPU preload, or lighting passes.
 */

/** Ordered mount sections inside `<Physics>` — do not reorder sections relative to each other. */
export const PHYSICS_SCENE_MOUNT_SECTIONS = [
  'colliders_and_player',
  'camera_and_hands',
  'world_dressing',
  'npc_and_ambient',
  'cinematic_and_triggers',
  'interaction_bridges',
  'proximity_and_quests',
  'scene_transitions',
  'lifecycle_bridges',
  'interaction_system',
  'lighting_and_environment',
] as const;

export type PhysicsSceneMountSection = (typeof PHYSICS_SCENE_MOUNT_SECTIONS)[number];

/**
 * Hard ordering rules between named mounts. Indices refer to position within
 * {@link PHYSICS_SCENE_MOUNT_SECTIONS}, not individual JSX siblings.
 */
export const PHYSICS_SCENE_MOUNT_INVARIANTS: ReadonlyArray<{
  before: PhysicsSceneMountSection;
  after: PhysicsSceneMountSection;
  reason: string;
}> = [
  {
    before: 'colliders_and_player',
    after: 'camera_and_hands',
    reason: 'FollowCamera reads livePlayerPositionRef updated by PhysicsPlayer',
  },
  {
    before: 'cinematic_and_triggers',
    after: 'interaction_bridges',
    reason: 'InteractiveTriggers register zones before InteractionQueryBridge scans them',
  },
  {
    before: 'lifecycle_bridges',
    after: 'interaction_system',
    reason: 'GPU/Rapier lifecycle hooks must mount before InteractionSystemBridge subscribes to scene events',
  },
  {
    before: 'interaction_system',
    after: 'lighting_and_environment',
    reason: 'ExplorationLighting and SceneEnvironment must remain last in the Physics subtree',
  },
];

/**
 * Extracted mount wrappers — each expands to the leaf mounts listed in
 * {@link PHYSICS_SCENE_SECTION_MOUNTS}. Order inside a wrapper matches JSX.
 */
export const PHYSICS_SCENE_MOUNT_WRAPPERS = {
  PhysicsScenePlayerMounts: 'colliders_and_player',
  PhysicsSceneCameraMounts: 'camera_and_hands',
  PhysicsSceneWorldDressingMounts: 'world_dressing',
  PhysicsSceneNpcMounts: 'npc_and_ambient',
  PhysicsSceneCinematicMounts: 'cinematic_and_triggers',
  PhysicsSceneInteractionBridges: 'interaction_bridges',
  PhysicsSceneProximityQuestMounts: 'proximity_and_quests',
  PhysicsSceneTransitionMounts: 'scene_transitions',
  PhysicsSceneLifecycleMounts: 'lifecycle_bridges',
  PhysicsSceneInteractionSystemMounts: 'interaction_system',
  PhysicsSceneLightingMounts: 'lighting_and_environment',
} as const satisfies Record<string, PhysicsSceneMountSection>;

/** Individual mount ids within each section (for regression tests). */
export const PHYSICS_SCENE_SECTION_MOUNTS: Record<PhysicsSceneMountSection, readonly string[]> = {
  colliders_and_player: [
    'PhysicsScenePlayerMounts',
    'SceneColliderSelector',
    'EnvironmentalAnimator',
    'PhysicsPlayer',
  ],
  camera_and_hands: ['PhysicsSceneCameraMounts', 'FollowCamera', 'FirstPersonHands'],
  world_dressing: [
    'PhysicsSceneWorldDressingMounts',
    'TriggerZoneProps',
    'WorldItemPickupGlows',
    'ScenePropDressing',
    'SceneManifestAssets',
    'SceneInteriorAssets',
  ],
  npc_and_ambient: [
    'PhysicsSceneNpcMounts',
    'NPCSystemWrapper',
    'NpcAmbientBarkMount',
    'UmkaDog',
    'FootstepDust',
    'DialogueFocusTracker',
    'AmbientNPCs',
    'DynamicProps',
    'PatrollingCreeps',
  ],
  cinematic_and_triggers: [
    'PhysicsSceneCinematicMounts',
    'CinematicTimelineRunner',
    'InteractiveTriggers',
  ],
  interaction_bridges: [
    'PhysicsSceneInteractionBridges',
    'InteractionQueryBridge',
    'InteractionHighlight',
  ],
  proximity_and_quests: [
    'PhysicsSceneProximityQuestMounts',
    'ProximityReactivityRenderer',
    'SceneExitIndicator',
    'QuestWaypoints',
    'ChoiceReactivity',
  ],
  scene_transitions: ['PhysicsSceneTransitionMounts', 'SceneTransitionHandler'],
  lifecycle_bridges: [
    'PhysicsSceneLifecycleMounts',
    'SceneGpuLifecycleBridge',
    'RapierWorldLifecycleBridge',
  ],
  interaction_system: [
    'PhysicsSceneInteractionSystemMounts',
    'InteractionSystemBridge',
    'RotationSyncBridge',
  ],
  lighting_and_environment: [
    'PhysicsSceneLightingMounts',
    'ExplorationLighting',
    'SceneEnvironment',
  ],
};
