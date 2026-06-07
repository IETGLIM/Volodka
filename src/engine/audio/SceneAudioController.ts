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

export class SceneAudioController {
  private disposed = false;
  private lastMusicMood: MusicMood | null = null;
  private enteredScenes = new Set<string>();

  init(): void {
    applyAudioSettings();
  }

  dispose(): void {
    this.disposed = true;
  }

  isDisposed(): boolean {
    return this.disposed;
  }

  /* ─── Mode / scene ─── */

  onModeChange(
    phase: GamePhase,
    sceneId: SceneId,
    timeOfDay: number,
    showStoryOverlay: boolean,
  ): void {
    if (this.disposed) return;

    if (phase === 'menu' || phase === 'intro') {
      musicEngine.stopMusic(1);
      ambientEngine.stopAll();
      return;
    }

    if (phase === 'exploration') {
      musicEngine.playSceneMusic(sceneId);
      this.playSceneAmbient(sceneId, timeOfDay);
    }

    this.setDialogueState(showStoryOverlay, phase);
    ambientEngine.setCombatMuted(phase === 'combat');
  }

  onSceneEnter(sceneId: SceneId, timeOfDay: number): void {
    if (this.disposed) return;

    const preset = getSceneReverbPreset(sceneId);
    if (preset) sfxEngine.setReverbPreset(preset);

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

    this.playSceneAmbient(sceneId, timeOfDay);
  }

  onCombatStart(): void {
    if (this.disposed) return;
    sfxEngine.playStinger('danger');
    ambientEngine.setCombatMuted(false);
    ambientEngine.play('combat', 1500);
  }

  onCombatEnd(sceneId: SceneId, timeOfDay: number): void {
    if (this.disposed) return;
    ambientEngine.setCombatMuted(false);
    this.playSceneAmbient(sceneId, timeOfDay);
  }

  onPoemCollected(poemId?: string): void {
    if (this.disposed) return;
    const motif = getPoemMotif(poemId ?? 'default');
    sfxEngine.playStinger(motif.stinger);
  }

  onQuestAccepted(): void {
    if (this.disposed) return;
    sfxEngine.playStinger('mystery');
  }

  onCharacterFocus(npcId: string): void {
    if (this.disposed) return;
    const motif = getCharacterMotif(npcId);
    if (motif) sfxEngine.playStinger(motif.stinger);
  }

  onTimeOfDayBoundary(sceneId: SceneId, timeOfDay: number): void {
    if (this.disposed) return;
    this.playSceneAmbient(sceneId, timeOfDay);
  }

  setDialogueState(showStoryOverlay: boolean, phase: GamePhase): void {
    if (this.disposed) return;
    if (showStoryOverlay) {
      sfxEngine.enableDialogueMuffle(true);
      ambientEngine.setDialogueDucked(true);
    } else if (phase === 'exploration') {
      sfxEngine.enableDialogueMuffle(false);
      ambientEngine.setDialogueDucked(false);
    }
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

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    controllerInstance?.dispose();
    controllerInstance = null;
  });
}
