import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from '@/engine/events';
import {
  PHOTO_FLASH_DURATION_MS,
  PHOTO_MODE_LABELS,
  PHOTO_PREVIEW_DISPLAY_MS } from '@/engine/photo/photoModeConstants';
import {
  captureWebGlCanvasScreenshot,
  formatGameTimeOfDay,
  getCaptureFailureMessage,
  resolveSceneDisplayName } from '@/engine/photo/photoModePresentation';
import { setPhotoModeActive } from '@/engine/photo/photoModeState';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { useGamePhase, useWeatherIndicatorState } from '@/store/selectors';

export type PhotoPreviewData = {
  dataUrl: string;
  timestamp: number;
};

export function usePhotoModeController() {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const gamePhase = useGamePhase();
  const gamePhaseRef = useRef(gamePhase);
  gamePhaseRef.current = gamePhase;

  const { currentSceneId, timeOfDay } = useWeatherIndicatorState();
  const sceneName = resolveSceneDisplayName(currentSceneId);
  const timeStr = formatGameTimeOfDay(timeOfDay);

  const [active, setActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const [preview, setPreview] = useState<PhotoPreviewData | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const previewTimerRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const exitPhotoMode = useCallback(() => {
    if (!activeRef.current) return;
    setActive(false);
    activeRef.current = false;
    setPhotoModeActive(false);
    setLiveAnnouncement(PHOTO_MODE_LABELS.exited);
    eventBus.emit(PHOTO_EVENTS.inactive, PHOTO_EMPTY_PAYLOAD);
  }, []);

  const enterPhotoMode = useCallback(() => {
    if (gamePhaseRef.current !== 'exploration') return;
    setActive(true);
    activeRef.current = true;
    setPhotoModeActive(true);
    setLiveAnnouncement(PHOTO_MODE_LABELS.entered);
    eventBus.emit(PHOTO_EVENTS.active, PHOTO_EMPTY_PAYLOAD);
  }, []);

  const captureScreenshot = useCallback(() => {
    if (!activeRef.current) return;

    if (!reducedMotion) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), PHOTO_FLASH_DURATION_MS);
    }

    const result = captureWebGlCanvasScreenshot();

    if (result.ok) {
      setPreview({ dataUrl: result.dataUrl, timestamp: Date.now() });
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = window.setTimeout(() => setPreview(null), PHOTO_PREVIEW_DISPLAY_MS);
      eventBus.emit('sound:play', { type: 'screenshot' });
      eventBus.emit('game:notification', {
        title: PHOTO_MODE_LABELS.captureSuccess,
        type: 'info' as const });
    } else {
      eventBus.emit('game:notification', {
        title: getCaptureFailureMessage(),
        type: 'info' as const });
    }
  }, [reducedMotion]);

  useEffect(() => {
    const unsub = eventBus.on(PHOTO_EVENTS.toggle, () => {
      if (activeRef.current) {
        exitPhotoMode();
      } else {
        enterPhotoMode();
      }
    });
    return unsub;
  }, [enterPhotoMode, exitPhotoMode]);

  useEffect(() => {
    if (!active) return;

    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((event.code === 'KeyP' && !event.ctrlKey && !event.shiftKey) || event.code === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        exitPhotoMode();
      }
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        captureScreenshot();
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [active, exitPhotoMode, captureScreenshot]);

  useEffect(() => {
    if (gamePhase !== 'exploration' && activeRef.current) {
      const timer = window.setTimeout(() => exitPhotoMode(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [gamePhase, exitPhotoMode]);

  useEffect(() => {
    if (activeRef.current && transitionPhase === 'loading') {
      exitPhotoMode();
    }
  }, [transitionPhase, exitPhotoMode]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
      if (activeRef.current) {
        eventBus.emit(PHOTO_EVENTS.inactive, PHOTO_EMPTY_PAYLOAD);
      }
      activeRef.current = false;
      setPhotoModeActive(false);
    };
  }, []);

  return {
    active,
    flash,
    preview,
    liveAnnouncement,
    reducedMotion,
    sceneName,
    timeStr,
    exitPhotoMode,
    captureScreenshot };
}
