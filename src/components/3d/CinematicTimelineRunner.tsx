/**
 * R3F runner — single orchestrator for camera + actor + overlay during cinematics.
 * Replaces ad-hoc WakeUpSequence / FollowCamera cutscene / CutsceneOverlay wiring.
 */

import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Group, PerspectiveCamera } from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { getGameStore } from '@/store/gameStore';
import { useCutsceneStore, getActiveCutsceneId } from '@/store/stores/cutsceneStore';
import { prefetchStoryNodes } from '@/data/gameDataLoader';
import { openDiegeticNarrative } from '@/engine/scene/narrativeOverlay';
import { setCinematicHoldActive } from '@/engine/camera/cinematicPresentation';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { devWarn } from '@/shared/utils/devLog';
import { setCinematicPresentationMode } from '@/engine/camera/cinematicPresentation';
import {
  acquireCameraOwnership,
  canWriteCamera,
  releaseCameraOwnership,
} from '@/engine/camera/cameraOwnerState';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import {
  BED_POSITION,
  CHAIR_POSITION,
  WAKEUP_CAMERA_START,
} from '@/engine/wakeup/wakeUpCinematic';
import { shouldOpenAct1PrologueStory } from '@/engine/wakeup/shouldOpenAct1PrologueStory';
import {
  completeCinematicTimeline,
  getActiveCinematicTimelineId,
  skipCinematicTimeline,
  startCinematicTimeline,
  stopCinematicTimeline,
} from '@/engine/cinematic/cinematicTimelineOrchestrator';
import {
  createCinematicTimelineState,
  skipCinematicTimelineState,
  startCinematicTimelineState,
  setCinematicTimelineAnchor,
  updateCinematicTimelineState,
  type CinematicTimelineState,
} from '@/engine/cinematic/cinematicTimelineController';
import { INTRO_WAKE_TIMELINE } from '@/engine/cinematic/introWakeTimeline';
import {
  computeTimelineOverlaySchedule,
  timelineRemainingMs,
} from '@/engine/cinematic/cinematicOverlaySchedule';
import { setCinematicLightCue } from '@/engine/cinematic/cinematicLightStaging';
import type { CinematicTimelineDef } from '@/engine/cinematic/cinematicTimelineTypes';
import { CinematicPlayerAvatar } from './CinematicPlayerAvatar';

const TIMELINE_OWNER = 'timeline' as const;

export function CinematicTimelineRunner() {
  const [active, setActive] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const stateRef = useRef<CinematicTimelineState | null>(null);
  const timelineIdRef = useRef<string | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introWakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prologueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prologueUnsubRef = useRef<(() => void) | null>(null);
  const prologueStoryOpenedRef = useRef(false);
  const sequenceStartedRef = useRef(false);
  const cameraAcquireRetryRef = useRef<string | null>(null);
  const handoffEmittedRef = useRef(false);
  const lastFootstepRef = useRef(-1);
  const audioCuePhaseRef = useRef<string | null>(null);
  const lightCuePhaseRef = useRef<string | null>(null);
  const lastReportedPhaseRef = useRef<string | null>(null);
  // FIX v4.48.20 (P2 «титры wake-таймлайна не доходят до CutsceneOverlay»):
  // оверлеи эмитятся из кадрового тика на первом тике фазы. Тик — кадровый
  // клок (dt кламп 0.05с), фоллбек — настенный. Ниже ~20fps фоллбек срабатывает
  // раньше хвостовых фаз — их первые тики не наступают, эмит теряется
  // (в троттлящейся headless-среде — 0 оверлеев за прогон). Теперь каждый
  // оверлей планируется ещё и настенным таймером на старте фазы; оба пути
  // делят once-guard. Стенный клок гарантирует доставку при любом rAF.
  const overlayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const emittedOverlayPhasesRef = useRef<Set<string>>(new Set());
  /** Wall-clock of the last successful tick — stall detector for the fallback. */
  const lastTickWallRef = useRef(0);
  const playerGroupRef = useRef<Group>(null);
  const currentAnimRef = useRef('idle');
  const modelRotationRef = useRef(0);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;

  const clearFallback = (): void => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  /** Clear pending wall-clock overlay beats (skip/complete/stop/unmount). */
  const clearOverlayTimers = (): void => {
    if (overlayTimersRef.current.length > 0) {
      overlayTimersRef.current.forEach((t) => clearTimeout(t));
      overlayTimersRef.current = [];
    }
  };

  /**
   * Shared once-only overlay emit — used by BOTH the frame-tick path and the
   * wall-clock schedule. Guards: the timeline must still be the live one, and
   * this phase's overlay must not have been emitted yet (either path).
   * FIX v4.48.20: также доставляет одноимённый audioCue 'notify' фазы —
   * на троттлящемся rAF тик не доходит и до звука; пинг композитному оверлею
   * нужен вместе с текстом, не отдельно.
   */
  const emitPhaseOverlay = (def: CinematicTimelineDef, phaseIndex: number): void => {
    const phase = def.phases[phaseIndex];
    const overlay = phase?.overlay;
    if (!overlay || overlay.letterboxStyle === 'none') return;
    if (timelineIdRef.current !== def.id || stateRef.current === null) return;
    if (getActiveCinematicTimelineId() !== def.id) return;
    const phaseKey = `${def.id}:${phase.id}`;
    if (emittedOverlayPhasesRef.current.has(phaseKey)) return;
    emittedOverlayPhasesRef.current.add(phaseKey);

    const remainingMs = timelineRemainingMs(def, phaseIndex);
    eventBus.emit('cutscene:overlay', {
      text: overlay.text ?? '',
      subtitle: overlay.subtitle,
      accentColor: overlay.accentColor ?? '#44ffff',
      durationMs: remainingMs,
      type: overlay.type ?? (overlay.text ? 'character_intro' : 'story_moment'),
      letterboxStyle: overlay.letterboxStyle ?? 'thin',
      showEmbers: overlay.showEmbers ?? false,
      glitchIntensity: overlay.glitchIntensity ?? 0,
      fadeInMs: overlay.fadeInMs ?? 300,
      fadeOutMs: overlay.fadeOutMs ?? 500,
      managedByTimeline: true,
    });

    if (phase.audioCue === 'notify' && audioCuePhaseRef.current !== phase.id) {
      audioCuePhaseRef.current = phase.id;
      audioEngine.playSfx('notify');
    }
  };

  /**
   * FIX v4.48.20: wall-clock overlay beats — один setTimeout на фазу с
   * оверлеем, на старте фазы. Не зависят от rAF: доставляют текст и в
   * троттлящейся среде, и на слабых машинах, где кадровый клок отстаёт от
   * настенного и фоллбек раньше времени завершает таймлайн.
   */
  const scheduleTimelineOverlays = (def: CinematicTimelineDef): void => {
    clearOverlayTimers();
    emittedOverlayPhasesRef.current = new Set();
    for (const beat of computeTimelineOverlaySchedule(def)) {
      overlayTimersRef.current.push(
        setTimeout(() => emitPhaseOverlay(def, beat.phaseIndex), beat.atMs),
      );
    }
  };

  const finishIntroWake = (): void => {
    releaseCameraOwnership(TIMELINE_OWNER);
    setActive(false);
    setShowAvatar(false);
    stateRef.current = null;
    timelineIdRef.current = null;
    sequenceStartedRef.current = false;
    clearFallback();
    clearOverlayTimers();

    const store = getGameStore();
    // Face the desk (monitors at Z=-2.35) instead of the door (Z=+3.5).
    // Rotation 0 = facing -Z in Three.js.
    // FIX S15-CHAIR-CLIP: используем CHAIR_POSITION -1.15, а не -1.3 чтобы не клиповать сквозь кресло
    store.setPlayerPosition([CHAIR_POSITION.x, CHAIR_POSITION.y, CHAIR_POSITION.z]);
    store.setPlayerRotation(0);

    // FIX S15-MUSIC: явно резюмим аудио и запускаем ambient после пробуждения
    // иначе музыка отсутствует после пролога из-за suspended AudioContext
    try {
      import('@/engine/SharedAudioContext').then(({ getSharedAudioContext }) => {
        getSharedAudioContext()?.resume?.();
      });
      import('@/engine/audio/SceneAudioController').then(({ getSceneAudioController }) => {
        const ctrl = getSceneAudioController();
        (ctrl as unknown as { onSceneEnter?: (id: unknown, n: number) => void }).onSceneEnter?.('volodka_room' as any, 0);
      });
    } catch {}
    store.setCutscene(null, []);
    store.setFlag('woke_up', true);
    // NOTE: poem_2 and read_poem_2 are NO LONGER auto-granted on wake-up.
    // The player must interact with the desk (interacted_desk) and then
    // examine the bookshelf (which collects poem_2) to complete the
    // first_reading quest. This restores meaningful player agency — see
    // act1.ts first_reading objectives.
    // Session 12-B: ease the camera from the cinematic handoff pose back to
    // the exploration target over 600ms (cubic-bezier). The completeCinematicTimeline
    // call below ALSO emits ease_back via setCinematicPresentationMode, but
    // the orchestrator's call only fires if `getActiveCinematicTimelineId() ===
    // 'intro_wakeup'` (last line of this function). Setting it here first
    // guarantees the ease fires on the intro→exploration hand-off regardless
    // of the orchestrator guard. The recenter handler preserves the spring
    // via the easeBackPending flag.
    setCinematicPresentationMode('third_person', { easeMs: 600 });
    // Session 12-B: removed the orphaned `intro:wakeup_complete` emit —
    // grep confirmed zero subscribers across the codebase (only the type
    // declaration in introEvents.ts existed). The cutscene:overlay_end +
    // cinematic:timeline_complete events cover the same hand-off semantic
    // for any downstream consumer.

    // CRITICAL: Emit scene:loaded for the current scene. During "New Game",
    // there is no scene transition (we stay in volodka_room), so scene:loaded
    // never fires naturally. Without this, useSceneLoadedGate returns false
    // forever, and TriggerZoneProps, SceneInteriorAssets, and pickup glow
    // never mount after the wake (ScenePropDressing / NPCs are not gated).
    eventBus.emit('scene:loaded', {
      sceneId: 'volodka_room',
      fromSceneId: 'volodka_room',
    });

    // Activate the first quest after the wake-up cinematic so the player
    // has a clear goal: explore the room, then head to the sync.
    dispatchGameAction({ type: 'quest/activate', questId: 'first_reading' });
    // Activate the morning sync quest — this is the main goal after wake-up.
    // The 5-minute timer starts ticking; player must reach the terminal.
    dispatchGameAction({ type: 'quest/activate', questId: 'morning_sync' });

    // FIX v4.48.19: уведомление о синке — гарантированный канал. Фаза monitor
    // катсцены показывает письмо оверлеем, но QA (v4.48.19) выявила, что тексты
    // wake-таймлайна не доходят до CutsceneOverlay (титр «Володька.» не
    // рендерился вообще — преждесуществующая брешь цепочки, см. P2 в worklog).
    // Мысль через immersiveVoiceChannel неуязвима: канал поставит её в очередь
    // на время плашки 'start' и покажет сразу после выбора игрока — тот же
    // нарративный бит, но с доказанной доставкой. Эмит — внутри стейджинг-таймера
    // (после открытия плашки): мысль сразу уходит в очередь, без частичного
    // показа на титульном окне.

    const clearPrologueTimer = (): void => {
      if (prologueTimerRef.current) {
        clearTimeout(prologueTimerRef.current);
        prologueTimerRef.current = null;
      }
    };

    const openPrologueStory = (): void => {
      // ALWAYS clean up the cutscene:overlay_end subscription and the 9s
      // fallback timer the first time we run, regardless of which path
      // triggered this call (early overlay_end fire OR the 9s timeout).
      // Without this, the early-fire path leaked one EventBus subscription
      // per New Game cycle (the unsub was only invoked from the timeout
      // fallback). The ref is nulled after invocation so subsequent calls
      // are no-ops.
      if (prologueUnsubRef.current) {
        prologueUnsubRef.current();
        prologueUnsubRef.current = null;
      }
      clearPrologueTimer();

      if (prologueStoryOpenedRef.current) return;

      const live = getGameStore();
      if (
        !shouldOpenAct1PrologueStory({
          currentNodeId: live.currentNodeId,
          showStoryOverlay: live.showStoryOverlay,
          visitedNodes: live.playerState.visitedNodes,
        })
      ) {
        return;
      }

      prologueStoryOpenedRef.current = true;
      prefetchStoryNodes(['start', 'explore_mode', 'room_table']);
      void import('@/components/game/FirstReadingCelebration');

      if (live.activeCutsceneId) {
        live.setCutscene(null, []);
        eventBus.emit('cutscene:overlay_end', {});
      }
      live.setCurrentNodeId('start');
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'start' });
      // Show the 'start' node as a diegetic HUD dialogue so the player
      // actually reads the opening narration and makes their first choice.
      // Previously this immediately entered the explore hub, silently
      // skipping the start node text. The hub is now entered naturally
      // when the player picks "Подняться и осмотреться" → explore_mode.
      setCinematicHoldActive(false);
      forceEmitInteractionEnd();
      openDiegeticNarrative('start', 'story');
    };

    // FIX v4.46 («АКТ 1 Пробуждение проигрывается два раза»): интро-пробуждение
    // (этот таймлайн, 8 фаз) УЖЕ показало акт I кинематографически — титр-карта
    // act1_prologue следом за ним дублировала «Пробуждение» ещё раз (а по пути
    // «С пролога» — третий: ProloguePerfectionOverlay показывает «ПРОБУЖДЕНИЕ»
    // до New Game). Помечаем one-shot кат-сцену сыгранной, чтобы
    // useCutsceneController её больше не запускал, и сразу открываем стартовый
    // бит — listener/9s-фоллбек больше не нужны (finishIntroWake и так вызывается
    // в момент завершения таймлайна).
    store.markCutsceneTriggered('act1_prologue');
    store.setCurrentNodeId('start');

    // FIX v4.48.19 («стейджинг первой сцены»): раньше титр сцены
    // («Комната Володьки · Монитор мерцает. Тишина и код.», scene:loaded выше)
    // и диегетическая плашка 'start' открывались В ОДИН КАДР — два текстовых
    // слоя на первой секунде комнаты. Теперь завершение катсцены и открытие
    // стартового бита откладываются на WAKE_STAGING_MS: игрок сначала читает
    // титр сцены (2.5с dwell), затем открывается плашка. Всё это время
    // cinematic-hold держит управление (снимается в completeCinematicTimeline /
    // openPrologueStory). Ориентируемся на «таймлайн ещё активен»: если катсцену
    // скипнули Esc — таймлайн уже снят, открываем сразу, без титульной паузы.
    // Orphan-watchdog оркестратора (total + 15с грейс) при такой задержке
    // не срабатывает (22.6с + 2.6с << грейса).
    const WAKE_STAGING_MS = 2600;
    const wakeTimelineStillActive = getActiveCinematicTimelineId() === 'intro_wakeup';
    if (prologueTimerRef.current) clearTimeout(prologueTimerRef.current);
    prologueTimerRef.current = setTimeout(() => {
      prologueTimerRef.current = null;
      openPrologueStory();
      // FIX v4.48.23 (P2-1 хвост, DOM-trap QA): плашка 'start' наблюдалась
      // удалённой через 38мс после монтажа (headless-прогон: insert 70606ms →
      // remove 70644ms), а в другом прогоне хаб-промоушен обогнал стейджинг —
      // гард shouldOpenAct1PrologueStory абортнул открытие (currentNodeId уже
      // 'explore_mode'), плашка не открывалась ВООБЩЕ. Открывающая наррация
      // («Ты просыпаешься от назойливого писка терминала…») обязана дожить
      // до выбора игрока. Одноразовый ре-ассерт на +800мс — ВНЕ гарда, работает
      // в обоих сценариях потери: за 800мс игрок физически не успевает сделать
      // выбор (тайпрайтер ~500 символов), поэтому 'explore_mode' в этот момент —
      // только автопромоушен из цепочки завершения wake. Живую плашку и
      // осознанный выбор не трогаем.
      window.setTimeout(() => {
        const s = getGameStore();
        if (s.currentNodeId !== 'start' && s.currentNodeId !== 'explore_mode') return;
        if (s.diegeticNarrative?.nodeId === 'start') return; // плашка жива
        if (getActiveCinematicTimelineId() === 'intro_wakeup') return;
        devWarn('[WakeStaging] start-plate lost in handoff — re-asserting');
        s.openDiegeticNarrative('start', 'story');
      }, 800);
      if (getActiveCinematicTimelineId() === 'intro_wakeup') {
        completeCinematicTimeline('intro_wakeup');
      }
      // Синк-уведомление — сразу в очередь канала (см. комментарий выше):
      // плашка держит полосу, мысль покажется после выбора игрока.
      eventBus.emit('volodka:thought', {
        text: 'На терминале мигает уведомление: «Скоро синк. Необходимо присутствие». Гильдия не ждёт.',
        duration: 5000,
      });
    }, wakeTimelineStillActive ? WAKE_STAGING_MS : 0);
  };

  const finishGenericTimeline = (timelineId: string): void => {
    releaseCameraOwnership(TIMELINE_OWNER);
    setActive(false);
    setShowAvatar(false);
    stateRef.current = null;
    timelineIdRef.current = null;
    clearFallback();
    clearOverlayTimers();
    completeCinematicTimeline(timelineId);
  };

  /**
   * Clean up the runner's local state (camera ownership, avatar, refs) WITHOUT
   * calling completeCinematicTimeline. Used by onSkippedComplete — the
   * orchestrator's watchdog has ALREADY called completeCinematicTimeline(id,
   * true), which is what fired this event. Calling finishGenericTimeline here
   * would re-invoke completeCinematicTimeline (a no-op due to the
   * activeTimelineId guard, but confusing and fragile). This helper does only
   * the local cleanup. Without it, non-intro timelines skipped by the orphan
   * watchdog would leak stateRef, active=true, and camera ownership —
   * producing dual avatars and a stuck camera on the next frame-sim resume.
   */
  const cleanupRunnerState = (): void => {
    releaseCameraOwnership(TIMELINE_OWNER);
    setActive(false);
    setShowAvatar(false);
    stateRef.current = null;
    timelineIdRef.current = null;
    sequenceStartedRef.current = false;
    cameraAcquireRetryRef.current = null;
    clearFallback();
    clearOverlayTimers();
  };

  const beginTimeline = (
    def: CinematicTimelineDef,
    options: { anchor?: [number, number, number]; npcId?: string; skipMotion?: boolean },
  ): void => {
    if (options.skipMotion ?? isEffectiveReducedMotion()) {
      if (def.id === 'intro_wakeup') finishIntroWake();
      else finishGenericTimeline(def.id);
      return;
    }

    if (sequenceStartedRef.current && timelineIdRef.current === def.id) return;

    // Acquire camera ownership BEFORE committing any runner state. Timeline
    // ownership is priority 4 — if a cutscene (priority 5) is active,
    // acquisition fails. Previously we ignored the return value, leaving
    // stateRef set and active=true with no camera control — the timeline
    // ran blind until the fallback timer (up to 31s) fired. Bail out
    // cleanly instead: stop the orchestrator state so the watchdog doesn't
    // fire, and let the caller decide whether to retry.
    const acquired = acquireCameraOwnership(TIMELINE_OWNER);
    if (!acquired) {
      // Cutscene (priority 5) may still own the camera for a frame or two after
      // overlay end. Stop orchestrator state so the orphan watchdog doesn't fire,
      // then retry once shortly — otherwise non-intro timelines silently never start.
      stopCinematicTimeline(def.id);
      if (
        cameraAcquireRetryRef.current !== def.id &&
        !(options.skipMotion ?? isEffectiveReducedMotion())
      ) {
        cameraAcquireRetryRef.current = def.id;
        window.setTimeout(() => {
          if (sequenceStartedRef.current) return;
          if (getActiveCinematicTimelineId() === def.id) return;
          startCinematicTimeline({ def, options });
        }, 120);
      } else {
        cameraAcquireRetryRef.current = null;
      }
      return;
    }
    cameraAcquireRetryRef.current = null;

    sequenceStartedRef.current = true;
    timelineIdRef.current = def.id;

    const state = createCinematicTimelineState(def, options);
    stateRef.current = state;
    startCinematicTimelineState(state);

    const hasActor = def.phases.some((p) => p.actor.mode !== 'none');
    setShowAvatar(hasActor);
    setActive(true);

    if (def.id === 'intro_wakeup') {
      const store = getGameStore();
      store.setPlayerPosition([BED_POSITION.x, BED_POSITION.y, BED_POSITION.z]);
      store.setPlayerRotation(Math.PI);
      camera.position.copy(WAKEUP_CAMERA_START.position);
      camera.lookAt(WAKEUP_CAMERA_START.lookAt);
      camera.fov = WAKEUP_CAMERA_START.fov;
      camera.updateProjectionMatrix();
      state.prevCamera.position.copy(WAKEUP_CAMERA_START.position);
      state.prevCamera.lookAt.copy(WAKEUP_CAMERA_START.lookAt);
      state.prevCamera.fov = WAKEUP_CAMERA_START.fov;
      audioEngine.playStinger('mystery');
    }

    if (def.fallbackMs) {
      clearFallback();
      // FIX v4.48.20: STALL-AWARE fallback. Таймлайн — кадровый клок (dt кламп
      // 0.05с), старый фиксированный настенный фоллбек (total+2с) убивал
      // таймлайн на машинах ниже ~20fps до того, как хвостовые фазы получали
      // свой первый тик — вместе с ними терялись и оверлеи, и анимация хвоста.
      // Теперь фоллбек — детектор ЗАТИШЬЯ: если тик пробегал недавно (живой
      // rAF, пусть и редкий) — перевооружаемся; если кадров реально нет
      // (скрытая вкладка, мёртвый rAF) — завершаем как раньше.
      const armFallback = (ms: number): void => {
        fallbackTimerRef.current = setTimeout(() => {
          const stalled =
            Date.now() - lastTickWallRef.current > 2500;
          if (!stalled && stateRef.current && timelineIdRef.current === def.id) {
            armFallback(5000);
            return;
          }
          if (def.id === 'intro_wakeup') finishIntroWake();
          else finishGenericTimeline(def.id);
        }, ms);
      };
      lastTickWallRef.current = Date.now();
      armFallback(def.fallbackMs);
    }

    // FIX v4.48.20: настенное расписание оверлеев — гарантированная доставка
    // независимо от частоты кадров (см. комментарий у refs).
    scheduleTimelineOverlays(def);

    handoffEmittedRef.current = false;
    lastFootstepRef.current = -1;
    audioCuePhaseRef.current = null;
    lightCuePhaseRef.current = null;
    lastReportedPhaseRef.current = null;
  };

  useEffect(() => {
    const onStart = ({
      def,
      options,
    }: {
      def: CinematicTimelineDef;
      options: { anchor?: [number, number, number]; npcId?: string; skipMotion?: boolean };
    }) => {
      beginTimeline(def, options);
    };

    const onSkip = ({ timelineId }: { timelineId: string }) => {
      const state = stateRef.current;
      if (!state || timelineIdRef.current !== timelineId) return;
      skipCinematicTimelineState(state);
      if (timelineId === 'intro_wakeup') finishIntroWake();
      else finishGenericTimeline(timelineId);
    };

    const onStop = ({ timelineId }: { timelineId: string }) => {
      if (timelineIdRef.current !== timelineId) return;
      releaseCameraOwnership(TIMELINE_OWNER);
      setActive(false);
      setShowAvatar(false);
      stateRef.current = null;
      timelineIdRef.current = null;
      sequenceStartedRef.current = false;
      clearFallback();
      clearOverlayTimers();
      if (introWakeTimerRef.current) {
        clearTimeout(introWakeTimerRef.current);
        introWakeTimerRef.current = null;
      }
      if (prologueTimerRef.current) {
        clearTimeout(prologueTimerRef.current);
        prologueTimerRef.current = null;
      }
      if (prologueUnsubRef.current) {
        prologueUnsubRef.current();
        prologueUnsubRef.current = null;
      }
    };

    const onSceneTransitionStart = (): void => {
      const orphanId = timelineIdRef.current;
      if (!orphanId) return;
      if (getActiveCinematicTimelineId() === orphanId) {
        stopCinematicTimeline(orphanId);
      }
      cleanupRunnerState();
      sequenceStartedRef.current = false;
      if (introWakeTimerRef.current) {
        clearTimeout(introWakeTimerRef.current);
        introWakeTimerRef.current = null;
      }
      if (prologueTimerRef.current) {
        clearTimeout(prologueTimerRef.current);
        prologueTimerRef.current = null;
      }
      if (prologueUnsubRef.current) {
        prologueUnsubRef.current();
        prologueUnsubRef.current = null;
      }
    };

    const onIntroWakeLegacy = () => {
      startCinematicTimeline({ def: INTRO_WAKE_TIMELINE, options: {} });
    };

    const onIntroSkipLegacy = () => {
      skipCinematicTimeline();
    };

    const onSkippedComplete = ({
      timelineId,
      skipped,
    }: {
      timelineId: string;
      skipped?: boolean;
    }) => {
      if (!skipped) return;
      if (timelineId === 'intro_wakeup') {
        finishIntroWake();
      } else if (timelineIdRef.current === timelineId) {
        // Non-intro timelines skipped via the orphan watchdog (or any other
        // path that calls completeCinematicTimeline(id, true)) must still
        // clean up the runner's local state. Previously this branch was
        // missing — stateRef, active, and camera ownership leaked, causing
        // dual avatars and a stuck camera on the next timeline.
        cleanupRunnerState();
      }
    };

    const unsubs = [
      eventBus.on('cinematic:timeline_start', onStart),
      eventBus.on('cinematic:timeline_skip', onSkip),
      eventBus.on('cinematic:timeline_stop', onStop),
      eventBus.on('scene:transition_start', onSceneTransitionStart),
      eventBus.on('intro:wakeup_sequence', onIntroWakeLegacy),
      eventBus.on('intro:wakeup_skip', onIntroSkipLegacy),
      eventBus.on('cinematic:timeline_complete', onSkippedComplete),
    ];

    // Start the intro wake-up timeline AFTER the first frame renders.
    // Previously this fired immediately on mount — before the RigidBody
    // existed, causing the character to fly above the floor. Waiting for
    // canvas:first-frame ensures the physics world is initialized and the
    // KCC controller has been created.
    const startIntroWakeWhenReady = () => {
      if (sequenceStartedRef.current) return;
      // Read cutscene slice directly — useGameStore facade can lag one rAF behind
      // setCutscene (menu New Game). Stale null here skipped the wake forever when
      // canvas:first-frame already fired under the kept-alive menu canvas.
      if (getActiveCutsceneId() !== 'intro_wakeup') return;
      // Coalesce canvas:first-frame / scene:loaded / poll into one pending start.
      if (introWakeTimerRef.current) return;
      // Small delay after first-frame to let the KCC controller settle.
      introWakeTimerRef.current = setTimeout(() => {
        introWakeTimerRef.current = null;
        if (sequenceStartedRef.current) return;
        if (getActiveCutsceneId() !== 'intro_wakeup') return;
        startCinematicTimeline({ def: INTRO_WAKE_TIMELINE, options: {} });
      }, 200);
    };

    // ALWAYS listen for both events — the useEffect deps are [camera]
    // which doesn't change, so we can't rely on re-mount to pick up
    // activeCutsceneId changes. Listen for canvas:first-frame (fires
    // when the canvas renders its first frame after mount/scene change)
    // AND scene:loaded (fires when a scene finishes loading). Also
    // poll for the cutscene being set (New Game flow sets it after
    // the component is already mounted).
    unsubs.push(eventBus.on('canvas:first-frame', startIntroWakeWhenReady));
    unsubs.push(eventBus.on('scene:loaded', startIntroWakeWhenReady));

    // Subscribe instead of polling — New Game sets activeCutsceneId after mount.
    unsubs.push(
      useCutsceneStore.subscribe(
        (s) => s.activeCutsceneId,
        (id) => {
          if (id === 'intro_wakeup') startIntroWakeWhenReady();
        },
      ),
    );
    // Catch already-set cutscene (hot reload / remount mid-flow).
    if (getActiveCutsceneId() === 'intro_wakeup') {
      startIntroWakeWhenReady();
    }

    return () => {
      unsubs.forEach((u) => u());
      clearFallback();
      clearOverlayTimers();
      if (introWakeTimerRef.current) {
        clearTimeout(introWakeTimerRef.current);
        introWakeTimerRef.current = null;
      }
      if (prologueTimerRef.current) clearTimeout(prologueTimerRef.current);
      // Also tear down the prologue EventBus subscription if neither the
      // overlay_end early-fire path nor the 9s timeout ever ran (e.g. the
      // component unmounted mid-cutscene). Without this, the subscription
      // would leak on unmount.
      if (prologueUnsubRef.current) {
        prologueUnsubRef.current();
        prologueUnsubRef.current = null;
      }
      // Orphaned timeline hold: remount (Strict Mode / canvas churn) must not
      // leave activeTimelineId set with an empty stateRef — start would no-op.
      const orphanId = timelineIdRef.current;
      if (orphanId && getActiveCinematicTimelineId() === orphanId) {
        stopCinematicTimeline(orphanId);
        cleanupRunnerState();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable camera ref
  }, [camera]);

  useFrameTick('misc', ({ delta }) => {
    const state = stateRef.current;
    if (!active || !state || !canWriteCamera(TIMELINE_OWNER)) return;

    if (state.npcId) {
      const npcGroup = getNPCGroup(state.npcId);
      if (npcGroup) setCinematicTimelineAnchor(state, npcGroup.position);
    }

    const result = updateCinematicTimelineState(state, delta, camera);
    if (!result) return;
    lastTickWallRef.current = Date.now();

    // FIX v4.48.20: оверлей уходит через общий once-guard — кадровый путь и
    // настенное расписание не дублируют друг друга, побеждает тот, что первый.
    if (result.overlay) {
      emitPhaseOverlay(state.def, result.phaseIndex);
    }

    const phase = state.def.phases[state.phaseIndex];
    if (phase?.audioCue && audioCuePhaseRef.current !== phase.id) {
      audioCuePhaseRef.current = phase.id;
      switch (phase.audioCue) {
        case 'notify':
          audioEngine.playSfx('notify');
          break;
        case 'ui_open':
          if (result.phaseLocalT > 0.55) audioEngine.playSfx('ui_open');
          break;
        case 'footstep': {
          const step = Math.floor(result.phaseLocalT * 5);
          if (step !== lastFootstepRef.current) {
            lastFootstepRef.current = step;
            audioEngine.playFootstep('wood');
          }
          break;
        }
        case 'mystery':
          audioEngine.playStinger('mystery');
          break;
        default: {
          const _exhaustive: never = phase.audioCue;
          void _exhaustive;
          break;
        }
      }
    }

    if (phase?.lightCue && lightCuePhaseRef.current !== phase.id) {
      lightCuePhaseRef.current = phase.id;
      setCinematicLightCue(phase.lightCue, Math.max(1.2, phase.duration));
    }

    // AAA cinematic atmosphere boost during cutscenes — makes light shafts + dust feel luxurious
    if (result.phaseLocalT > 0.1 && result.phaseLocalT < 0.9) {
      eventBus.emit('cinematic:atmosphere_boost' as any, {
        intensity: 0.6 + (result.phaseLocalT * 0.4),
        sceneId: getGameStore().exploration.currentSceneId,
      });
    }

    if (result.isHandoff && timelineIdRef.current === 'intro_wakeup' && !handoffEmittedRef.current) {
      handoffEmittedRef.current = true;
      // Session 12-B: removed the orphaned `intro:wakeup_handoff` +
      // `cinematic:intro_handoff` emits — grep confirmed zero subscribers
      // across the codebase (only the type declarations in introEvents.ts
      // and cinematicTimelineEvents.ts existed). The handoff semantic is
      // already covered by `cinematic:timeline_phase` (emitted above with
      // the phaseId), which downstream consumers use for phase-based logic.
    }

    if (result.actor && playerGroupRef.current) {
      currentAnimRef.current = result.actor.clip;
      modelRotationRef.current = result.actor.facingY;
      const group = playerGroupRef.current;
      group.position.copy(result.actor.position);
      if (result.actor.rotation) {
        group.rotation.copy(result.actor.rotation);
      }
    }

    if (result.phaseId !== lastReportedPhaseRef.current) {
      lastReportedPhaseRef.current = result.phaseId;

      const phase = state.def.phases[state.phaseIndex];
      if (phase?.cameraShake) {
        eventBus.emit('cutscene:camera_shake', {
          intensity: phase.cameraShake.intensity,
          frequency: phase.cameraShake.frequency,
        });
      }

      eventBus.emit('cinematic:timeline_phase', {
        timelineId: state.def.id,
        phaseId: result.phaseId,
        phaseIndex: result.phaseIndex,
        lightCue: phase?.lightCue,
      });
    }

    if (result.isComplete) {
      const id = timelineIdRef.current;
      if (id === 'intro_wakeup') finishIntroWake();
      else if (id) finishGenericTimeline(id);
    }
  }, { phase: 'pre_physics', label: 'CinematicTimelineRunner' });

  if (!active || !showAvatar) return null;

  return (
    <CinematicPlayerAvatar
      groupRef={playerGroupRef}
      currentAnimRef={currentAnimRef}
      rotationRef={modelRotationRef}
    />
  );
}
