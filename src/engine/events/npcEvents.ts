/** NPC dialogue, animation, gifts — DialogueRenderer, useNPCAnimation. */
import type { NpcEmotion } from '@/engine/npc/npcEmotionTypes';
import type { SceneId } from '@/config/sceneIds';

export interface NpcEvents {
  'npc:talked': { npcId: string; dialogueNodeId?: string };
  'npc:animation': { npcId: string; state: 'idle' | 'walk' | 'talk' | 'sit' | 'listen' | 'gesture' };
  'npc:interact_staged': { npcId: string };
  'npc:gift': { npcId: string; itemId: string; preference: string; affinityChange: number };
  /** Emitted when an NPC has no narrative content to show — UI should display a fallback bark. */
  'npc:no_dialogue': { npcId: string; barkText: string };
  /**
   * Emitted by `npcAmbientBarkSystem` when an NPC mutters an overheard
   * ambient line (player within 4 m, not in dialogue, ≥ 25 s since this
   * NPC's last ambient bark). The targeted NPC component listens and
   * surfaces the text via its existing speech-bubble machinery.
   */
  'npc:ambient_bark': {
    npcId: string;
    text: string;
    band: 'idle' | 'working' | 'pensive' | 'curious' | 'alarmed' | 'contemplative' | 'annoyed' | 'respectful' | 'fearful' | 'weather';
  };
  /**
   * Emitted when an NPC's emotional state changes (triggered by game events
   * like weather, combat nearby, poem reading, outfit perception, proximity).
   * The NPC component listens and adjusts animation, head tracking, and bark
   * behavior accordingly.
   */
  'npc:emotion_triggered': { npcId: string; emotion: NpcEmotion; source: string; duration: number };
  /**
   * Emitted when an NPC's emotion decays back to neutral (after the duration
   * expires). The NPC component restores default animation and behavior.
   */
  'npc:emotion_decayed': { npcId: string; previousEmotion: NpcEmotion };
  /**
   * Emitted when an NPC transitions to a new emotion (replaces the previous
   * one). Used by the world-space NpcEmotionIndicator to show a brief
   * floating label above the NPC's head. Unlike `npc:emotion_triggered`,
   * this event fires on any transition — including decay → neutral.
   */
  'npc:emotion_change': { npcId: string; emotion: NpcEmotion; previousEmotion: NpcEmotion };
  /**
   * Emitted by `checkRelationMilestones` when an NPC's relation value
   * crosses a `relationMilestones` threshold defined on its NPCDefinition.
   * The DialogueRenderer listens and auto-opens `dialogueNodeId` so the
   * player sees the milestone conversation without manually re-talking to
   * the NPC. `direction` indicates whether the crossing was rising
   * (relation gained) or falling (relation lost).
   */
  'npc:relation_milestone': {
    npcId: string;
    milestoneValue: number;
    dialogueNodeId: string;
    direction: 'rising' | 'falling';
  };
  /**
   * Store→engine bridge event: emitted by `worldSlice.setNpcRelation` (via
   * `storeEffects.scheduleNpcRelationChanged` → `emitAppEvent`) when an NPC's
   * relation value changes between commits. The engine subscribes (via
   * `onAppEvent` in `npcRelationMilestones.ts → registerRelationMilestoneBridge`)
   * and runs `checkRelationMilestones` to emit `npc:relation_milestone` for any
   * crossed threshold. Mirrored in `ApplicationEventMap` so the typed
   * `appEventBus` binding forwards it to the singleton bus without an
   * `as never` cast on the event key.
   */
  'store:npc_relation_changed': {
    npcId: string;
    oldRelation: number;
    newRelation: number;
  };
  /**
   * Запуск анимации ухода NPC из сцены.
   * NpcTransitionAnimator плавно перемещает NPC к ближайшему краю
   * и после завершения генерирует событие npc:despawn.
   */
  'npc:exit_start': { npcId: string; sceneId: SceneId };
  /**
   * Запуск анимации появления NPC в сцене.
   * NPC появляется на краю сцены и идёт к целевой позиции,
   * после чего генерируется событие npc:entry_complete.
   */
  'npc:entry_start': {
    npcId: string;
    targetPosition: [number, number, number];
    sceneId: SceneId;
  };
  /**
   * NPC достиг края сцены и должен быть удалён из рендера.
   * Слушается системами управления появлением NPC.
   */
  'npc:despawn': { npcId: string };
  /**
   * NPC достиг целевой позиции после входа в сцену.
   * Переход в обычное поведение (патруль / ожидание).
   */
  'npc:entry_complete': { npcId: string };
}
