/**
 * Central audio conductor — scene/mode transitions, stingers, reverb, motifs.
 * React hook useAudioOrchestrator delegates here.
 */

import { musicEngine } from '../MusicEngine';
import { ambientEngine } from './AmbientEngine';
import { sfxEngine } from './SfxEngine';
import { applyAudioSettings } from './AudioSettings';
import {
  getSceneReverbPreset,
  getSceneMusicMood,
  getSceneAudioProfile,
  getCharacterMotif,
  getPoemMotif,
  findEmotionalTransition,
  type MusicMood,
} from '../../config/audioManifest';
import {
  resolveAmbienceForScene,
  getAmbienceAccessibilityText,
  type AmbientSoundType,
} from '../../data/ambientSounds';
import { deriveSceneWeather } from '@/shared/weather/deriveSceneWeather';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { isPageVisible } from '@/engine/frame/frameVisibility';
import type { SceneId } from '@/config/sceneDefinitions';
import type { GamePhase } from '@/shared/gamePhase';
import type { NarrativeKind } from '@/shared/types/narrativeKind';
import { ControllerSession } from '@/engine/controller/ControllerSession';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

export interface AmbientPlayContext {
  proceduralOverride?: AmbientSoundType | null;
}

export class SceneAudioController {
  private readonly session = new ControllerSession();
  private lastMusicMood: MusicMood | null = null;
  private enteredScenes = new Set<string>();
  private lastResolvedAmbient: AmbientSoundType | null = null;
  private ambientContext: AmbientPlayContext = {};

  init(): void {
    this.session.begin();
    applyAudioSettings();
  }

  dispose(): void {
    this.session.dispose();
  }

  isDisposed(): boolean {
    return this.session.isDisposed();
  }

  private guard(): boolean {
    return !this.session.isDisposed();
  }

  /* ─── Mode / scene ─── */

  onModeChange(
    phase: GamePhase,
    sceneId: SceneId,
    timeOfDay: number,
    showStoryOverlay: boolean,
    ambientContext?: AmbientPlayContext,
    narrativeKind: NarrativeKind | null = null,
  ): void {
    if (!this.guard()) return;
    if (ambientContext) {
      this.ambientContext = ambientContext;
    }

    if (phase === 'menu' || phase === 'intro') {
      musicEngine.stopMusic(1);
      ambientEngine.stopAll();
      musicEngine.setPresentationDucked(false);
      return;
    }

    if (phase === 'exploration' || phase === 'cutscene') {
      musicEngine.playSceneMusic(sceneId);
      this.playSceneAmbient(sceneId, timeOfDay);
    }

    this.setDialogueState(showStoryOverlay, phase, narrativeKind);
    ambientEngine.setCombatMuted(phase === 'combat');
  }

  onSceneEnter(sceneId: SceneId, timeOfDay: number, ambientContext?: AmbientPlayContext): void {
    if (!this.guard()) return;
    if (ambientContext) {
      this.ambientContext = ambientContext;
    }

    const preset = getSceneReverbPreset(sceneId);
    if (preset) {
      sfxEngine.setReverbPreset(preset);
      ambientEngine.setReverbPreset(preset);
    }

    const nextMood = getSceneMusicMood(sceneId);
    if (nextMood && this.lastMusicMood && nextMood !== this.lastMusicMood) {
      const transition = findEmotionalTransition(this.lastMusicMood, nextMood);
      if (transition?.stinger) sfxEngine.playStinger(transition.stinger);
    }
    if (nextMood) this.lastMusicMood = nextMood;

    if (!this.enteredScenes.has(sceneId)) {
      this.enteredScenes.add(sceneId);
      const enterStinger = getSceneAudioProfile(sceneId)?.enterStinger;
      if (enterStinger) sfxEngine.playStinger(enterStinger);
    }

    musicEngine.playSceneMusic(sceneId);
    this.playSceneAmbient(sceneId, timeOfDay);
  }

  /** Duck scene layers before crossfade on scene:unload (EventBus-driven transitions). */
  onSceneUnload(): void {
    if (!this.guard()) return;
    ambientEngine.setDialogueDucked(false);
    ambientEngine.setCombatMuted(false);
  }

  onCombatStart(): void {
    if (!this.guard()) return;
    sfxEngine.playStinger('danger');
    ambientEngine.setCombatMuted(false);
    ambientEngine.play('combat', 1500);
  }

  onCombatEnd(sceneId: SceneId, timeOfDay: number): void {
    if (!this.guard()) return;
    ambientEngine.setCombatMuted(false);
    this.playSceneAmbient(sceneId, timeOfDay);
  }

  onPoemCollected(poemId?: string): void {
    if (!this.guard()) return;
    const motif = getPoemMotif(poemId ?? 'default');
    sfxEngine.playStinger(motif.stinger);
  }

  onQuestAccepted(): void {
    if (!this.guard()) return;
    sfxEngine.playStinger('mystery');
  }

  onCharacterFocus(npcId: string): void {
    if (!this.guard()) return;
    const motif = getCharacterMotif(npcId);
    if (motif) sfxEngine.playStinger(motif.stinger);
  }

  onTimeOfDayBoundary(sceneId: SceneId, timeOfDay: number): void {
    if (!this.guard()) return;
    this.playSceneAmbient(sceneId, timeOfDay);
  }

  setDialogueState(
    showStoryOverlay: boolean,
    phase: GamePhase,
    narrativeKind: NarrativeKind | null = null,
  ): void {
    if (!this.guard()) return;
    const duckPresentation = showStoryOverlay || phase === 'cutscene';
    const duckProfile =
      narrativeKind === 'dialogue' ? 'dialogue' : 'cinematic';
    musicEngine.setPresentationDucked(duckPresentation, duckProfile);
    if (showStoryOverlay) {
      sfxEngine.enableDialogueMuffle(true);
      ambientEngine.setDialogueDucked(true, duckProfile);
    } else if (phase === 'exploration' || phase === 'cutscene') {
      sfxEngine.enableDialogueMuffle(false);
      ambientEngine.setDialogueDucked(phase === 'cutscene', 'cinematic');
    }
  }

  onAccessibilityChanged(): void {
    if (!this.guard()) return;
    ambientEngine.setReducedMotion(isEffectiveReducedMotion());
  }

  onVisibilityChanged(visible: boolean): void {
    if (!this.guard()) return;
    ambientEngine.setPaused(!visible);
  }

  getLastResolvedAmbient(): AmbientSoundType | null {
    return this.lastResolvedAmbient;
  }

  getAmbienceAccessibilityCaption(): string | null {
    return getAmbienceAccessibilityText(this.lastResolvedAmbient);
  }

  setAmbientPlayContext(context: AmbientPlayContext): void {
    if (!this.guard()) return;
    this.ambientContext = context;
  }

  refreshSceneAmbient(sceneId: SceneId, timeOfDay: number): void {
    if (!this.guard()) return;
    this.playSceneAmbient(sceneId, timeOfDay);
  }

  onSoundPlay(type: string): void {
    if (!this.guard()) return;
    sfxEngine.playNamedSound(type);
  }

  private syncAccessibilityAndVisibility(): void {
    ambientEngine.setReducedMotion(isEffectiveReducedMotion());
    ambientEngine.setPaused(!isPageVisible());
  }

  private playSceneAmbient(sceneId: SceneId, timeOfDay: number): void {
    this.syncAccessibilityAndVisibility();

    const weather = deriveSceneWeather(sceneId, timeOfDay).type;
    const resolved = resolveAmbienceForScene(sceneId, timeOfDay, {
      proceduralOverride: this.ambientContext.proceduralOverride ?? undefined,
      weather,
    });

    if (resolved) {
      this.lastResolvedAmbient = resolved.sound;
      ambientEngine.play(resolved.sound, resolved.transitionDuration);
    } else {
      this.lastResolvedAmbient = null;
      ambientEngine.stopAll();
    }
  }
}

let controllerInstance: SceneAudioController | null = null;

export function getSceneAudioController(): SceneAudioController {
  if (!controllerInstance) {
    controllerInstance = new SceneAudioController();
  }
  return controllerInstance;
}

/** Invalidate controller session timers (unmount / HMR). */
export function disposeSceneAudioController(): void {
  controllerInstance?.dispose();
  controllerInstance = null;
}

registerHmrDispose(disposeSceneAudioController);
