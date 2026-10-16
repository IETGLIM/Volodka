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
import { AUDIO_SETTINGS_CHANGED } from './AudioSettings';
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
    this.bindAudioSettingsListener();
  }

  dispose(): void {
    this.removeAudioSettingsListener();
    this.enteredScenes.clear();
    this.stopStoryAudio();
    this.session.dispose();
  }

  /* FIX: файловый ambient-луп теперь реагирует на смену громкости/мьюта
   * в настройках мгновенно (раньше громкость фиксировалась при создании
   * элемента и не менялась до следующей story-ноды). */
  private readonly onAudioSettingsChanged = (): void => {
    if (!this.storyAudio) return;
    try {
      this.storyAudio.volume = this.computeStoryAudioVolume();
    } catch {
      /* элемент уже освобождён — игнорируем */
    }
  };

  private bindAudioSettingsListener(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener(AUDIO_SETTINGS_CHANGED, this.onAudioSettingsChanged);
  }

  private removeAudioSettingsListener(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener(AUDIO_SETTINGS_CHANGED, this.onAudioSettingsChanged);
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
   *  файл стартует при следующей смене ноды/контекста.
   *  v4.53.0: жёсткое переключение лупов заменено кроссфейдом — старый
   *  элемент плавно гаснет, новый нарастает (раньше была слышна щель/скачок
   *  на каждой смене story-ноды).
   *  v4.54.1 (судья раунд 1, P0): таймеры фейда — ПЕР-ЭЛЕМЕНТНЫЕ (WeakMap).
   *  Раньше был один общий storyAudioFadeTimer: fade-in нового лупа убивал
   *  fade-out уходящего ДО первого тика — уходящий луп застревал на полной
   *  громкости и наслаивался на новый (какофония при каждой смене ноды). */
  private setStoryAudioFile(file: string | null): void {
    if (file === this.storyAudioFile) return;
    this.storyAudioFile = file;
    this.fadeOutStoryAudioElement();
    if (!file || typeof window === 'undefined' || typeof Audio !== 'function') return;
    try {
      const el = new Audio(resolvePublicAssetUrl(file));
      el.loop = true;
      const target = this.computeStoryAudioVolume();
      el.volume = 0;
      void el.play().catch(() => {});
      this.fadeInStoryAudioElement(el, target);
      this.storyAudio = el;
    } catch {
      /* среда без аудио — файловый слой просто неактивен */
    }
  }

  /** Пер-элементные таймеры фейда: fade-out старого и fade-in нового
   *  живут одновременно и не мешают друг другу (fix P0 раунд-1). */
  private readonly fadeTimers = new WeakMap<HTMLAudioElement, ReturnType<typeof setInterval>>();

  private clearFadeTimerFor(el: HTMLAudioElement): void {
    const timer = this.fadeTimers.get(el);
    if (timer !== undefined) {
      clearInterval(timer);
      this.fadeTimers.delete(el);
    }
  }

  /** Плавное затухание уходящего лупа (~0.7с), затем освобождение элемента. */
  private fadeOutStoryAudioElement(): void {
    const el = this.storyAudio;
    this.storyAudio = null;
    if (!el) return;
    try {
      const start = el.volume;
      if (!(start > 0.001)) {
        this.clearFadeTimerFor(el);
        el.pause();
        el.src = '';
        return;
      }
      this.clearFadeTimerFor(el);
      const step = start / 8;
      const timer = setInterval(() => {
        try {
          const v = el.volume - step;
          if (!(v > 0.001)) {
            clearInterval(timer);
            this.fadeTimers.delete(el);
            el.pause();
            el.src = '';
            return;
          }
          el.volume = v;
        } catch {
          clearInterval(timer);
          this.fadeTimers.delete(el);
        }
      }, 90);
      this.fadeTimers.set(el, timer);
    } catch {
      /* ignore */
    }
  }

  /** Плавный подъём нового лупа до целевой громкости (~0.8с). */
  private fadeInStoryAudioElement(el: HTMLAudioElement, target: number): void {
    if (!(target > 0.001)) return;
    try {
      this.clearFadeTimerFor(el);
      const step = target / 10;
      let v = 0;
      const timer = setInterval(() => {
        try {
          v += step;
          if (v >= target) {
            el.volume = target;
            clearInterval(timer);
            this.fadeTimers.delete(el);
            return;
          }
          el.volume = v;
        } catch {
          clearInterval(timer);
          this.fadeTimers.delete(el);
        }
      }, 80);
      this.fadeTimers.set(el, timer);
    } catch {
      /* ignore */
    }
  }

  private stopStoryAudioElement(): void {
    if (!this.storyAudio) return;
    this.clearFadeTimerFor(this.storyAudio);
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
   *  Пересчитывается при каждой смене story-контекста и по событию настроек. */
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

/* ─── URL-нормализация публичных ассетов ─── */

/** FIX (Vercel/404): данные story-нод хранят относительные пути вида
 *  'sounds/ambient/rain_distant.ogg'. Относительный URL резолвится от
 *  текущего адреса страницы — на деплоях с не-корневым базовым путём
 *  (или при глубокой ссылке) запрос уходил мимо файла и Vercel отдавал
 *  index.html вместо .ogg → тихий отказ файлового эмбиента.
 *  Приводим путь к абсолютному от BASE_URL сборки. */
export function resolvePublicAssetUrl(file: string): string {
  if (/^(https?:|data:|blob:)/i.test(file)) return file;
  if (typeof window === 'undefined') return file;
  try {
    const base = import.meta.env.BASE_URL || '/';
    const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
    const normalized = file.replace(/^\//, '');
    return new URL(`${baseWithSlash}${normalized}`, window.location.href).href;
  } catch {
    return file;
  }
}

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
