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
  getAmbienceForScene,
  getAmbientTransitionDuration,
  type AmbientSoundType,
} from '../../data/ambientSounds';
import type { SceneId } from '@/config/sceneDefinitions';
import type { GamePhase } from '@/shared/gamePhase';
import { ControllerSession } from '@/engine/controller/ControllerSession';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

export class SceneAudioController {
  private readonly session = new ControllerSession();
  private lastMusicMood: MusicMood | null = null;
  private enteredScenes = new Set<string>();

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
  ): void {
    if (!this.guard()) return;

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

    this.setDialogueState(showStoryOverlay, phase);
    ambientEngine.setCombatMuted(phase === 'combat');
  }

  onSceneEnter(sceneId: SceneId, timeOfDay: number): void {
    if (!this.guard()) return;

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

  setDialogueState(showStoryOverlay: boolean, phase: GamePhase): void {
    if (!this.guard()) return;
    const duckPresentation = showStoryOverlay || phase === 'cutscene';
    musicEngine.setPresentationDucked(duckPresentation);
    if (showStoryOverlay) {
      sfxEngine.enableDialogueMuffle(true);
      ambientEngine.setDialogueDucked(true);
    } else if (phase === 'exploration' || phase === 'cutscene') {
      sfxEngine.enableDialogueMuffle(false);
      ambientEngine.setDialogueDucked(phase === 'cutscene');
    }
  }

  onSoundPlay(type: string): void {
    if (!this.guard()) return;
    sfxEngine.playNamedSound(type);
  }

  private playSceneAmbient(sceneId: string, timeOfDay: number): void {
    const ambientType = getAmbienceForScene(sceneId, timeOfDay);
    if (ambientType) {
      const crossfadeMs = getAmbientTransitionDuration(sceneId);
      ambientEngine.play(ambientType as AmbientSoundType, crossfadeMs);
    } else {
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
