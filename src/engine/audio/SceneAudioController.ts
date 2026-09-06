/**
 * Central audio conductor — scene/mode transitions, stingers, reverb, motifs.
 * React hook useAudioOrchestrator delegates here.
 */

import { musicEngine } from '../MusicEngine';
import { ambientEngine } from './AmbientEngine';
import { sfxEngine, type StingerId } from './SfxEngine';
import { applyAudioSettings, readAudioSettings } from './AudioSettings';
import {
  getSceneReverbPreset,
  getSceneMusicMood,
  getSceneAudioProfile,
  getCharacterMotif,
  getPoemMotif,
  findEmotionalTransition,
  resolveActMoodOverride,
  type MusicMood,
} from '../../config/proceduralAudioCatalog';
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
import { getGameSnapshot } from '@/engine/GameActionDispatcher';

export interface AmbientPlayContext {
  proceduralOverride?: AmbientSoundType | null;
  /** Файловый ambient story-ноды (например 'sounds/ambient/rain_distant.ogg').
   *  v4.15: раньше поле StoryNode.ambientSound было мёртвыми данными — файлов
   *  не существовало и никто их не играл. Теперь контроллер гоняет зацикленный
   *  HTMLAudio поверх процедурного бэда, громкость — от ambient-шины. */
  storyAudioFile?: string | null;
}

export class SceneAudioController {
  private readonly session = new ControllerSession();
  private lastMusicMood: MusicMood | null = null;
  private enteredScenes = new Set<string>();
  private lastResolvedAmbient: AmbientSoundType | null = null;
  private ambientContext: AmbientPlayContext = {};
  private storyAudio: HTMLAudioElement | null = null;
  private storyAudioFile: string | null = null;

  init(): void {
    this.session.begin();
    applyAudioSettings();
  }

  dispose(): void {
    this.enteredScenes.clear();
    this.stopStoryAudio();
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

    if (phase === 'menu') {
      // FIX S13-21: play menu music instead of stopping all music.
      // playMenuMusic defers via whenAudioReady until the first user gesture
      // (Chrome autoplay policy), so it silently queues on boot and starts
      // when the user clicks anywhere on the menu.
      ambientEngine.stopAll();
      musicEngine.setPresentationDucked(false);
      musicEngine.playMenuMusic();
      return;
    }

    if (phase === 'intro') {
      // Intro wake cinematic — music ducks (cinematic timeline controls duck factor)
      musicEngine.setPresentationDucked(false);
      ambientEngine.stopAll();
      return;
    }

    if (phase === 'exploration' || phase === 'cutscene') {
      musicEngine.resumeSceneMusic(sceneId);
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
    // Per-act mood override — revives the dead `resolveActMoodOverride` feature
    // (20 entries: 5 key scenes × acts 2-5). The same scene now sounds subtly
    // different as the story darkens. Applied AFTER playSceneMusic so the bed
    // exists for the ramp to land on; the ramp itself is a 1.5s setTargetAtTime
    // on padFilter.frequency + padConvolverGain + padDryGain.
    // When no override exists for this scene+act, falls back to the base bed.
    const actOverride = resolveActMoodOverride(sceneId, this.getCurrentAct());
    if (actOverride) {
      musicEngine.applyActMoodOverride(actOverride);
    }
    this.playSceneAmbient(sceneId, timeOfDay);
  }

  /** Read the current story act via the imperative store getter.
   *  Returns 1 when the snapshot is unavailable (early boot / tests). */
  private getCurrentAct(): number {
    try {
      return getGameSnapshot().playerState.progression.currentAct ?? 1;
    } catch {
      return 1;
    }
  }

  /** Duck scene layers before crossfade on scene:unload (EventBus-driven transitions). */
  onSceneUnload(): void {
    if (!this.guard()) return;
    sfxEngine.enableDialogueMuffle(false);
    ambientEngine.setDialogueDucked(false);
    ambientEngine.setCombatMuted(false);
    musicEngine.setPresentationDucked(false);
    musicEngine.stopMusic(0.6);
    ambientEngine.fadeOutAll(600);
    this.lastResolvedAmbient = null;
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

  /** Stinger / motif when a poem power reshapes the world (not just a buff). */
  onPoemWorldEvent(poemId: string, audioCue?: StingerId): void {
    if (!this.guard()) return;
    if (audioCue) {
      sfxEngine.playStinger(audioCue);
      return;
    }
    const motif = getPoemMotif(poemId);
    sfxEngine.playStinger(motif.stinger);
  }

  onQuestAccepted(): void {
    if (!this.guard()) return;
    sfxEngine.playStinger('mystery');
  }

  onCharacterFocus(npcId: string): void {
    if (!this.guard()) return;
    const motif = getCharacterMotif(npcId);
    sfxEngine.playStinger(motif.stinger);
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
    this.setStoryAudioFile(context.storyAudioFile ?? null);
  }

  /** Зацикленный файловый ambient текущей story-ноды (v4.15).
   *  Безопасен в не-браузерной среде (тесты): Audio-гарды + молчаливые catch.
   *  Отказ автоплея (нет жеста) не критичен — процедурный бэд продолжает играть,
   *  файл стартует при следующей смене ноды/контекста. */
  private setStoryAudioFile(file: string | null): void {
    if (file === this.storyAudioFile) return;
    this.storyAudioFile = file;
    this.stopStoryAudioElement();
    if (!file || typeof window === 'undefined' || typeof Audio !== 'function') return;
    try {
      const el = new Audio(file);
      el.loop = true;
      el.volume = this.computeStoryAudioVolume();
      void el.play().catch(() => {});
      this.storyAudio = el;
    } catch {
      /* среда без аудио — файловый слой просто неактивен */
    }
  }

  private stopStoryAudioElement(): void {
    if (!this.storyAudio) return;
    try {
      this.storyAudio.pause();
      this.storyAudio.src = '';
    } catch {
      /* ignore */
    }
    this.storyAudio = null;
  }

  private stopStoryAudio(): void {
    this.storyAudioFile = null;
    this.stopStoryAudioElement();
  }

  /** Громкость файлового слоя = ambient-шина × 0.7 (лупы громче процедурных бэдов).
   *  Пересчитывается при каждой смене story-контекста. */
  private computeStoryAudioVolume(): number {
    try {
      const s = readAudioSettings();
      const muteMul = s.muted ? 0 : 1;
      return Math.max(0, Math.min(1, s.ambientVolume * 0.7 * muteMul));
    } catch {
      return 0.4;
    }
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
