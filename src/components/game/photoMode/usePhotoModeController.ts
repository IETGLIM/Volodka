import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from '@/engine/events';
import {
  PHOTO_FILTER_ORDER,
  PHOTO_FILTER_LABELS,
  PHOTO_FRAME_ORDER,
  PHOTO_FRAME_LABELS,
  PHOTO_FLASH_DURATION_MS,
  PHOTO_GALLERY_STRIP_MAX,
  PHOTO_MODE_LABELS,
  PHOTO_PREVIEW_DISPLAY_MS,
  type PhotoFilterPreset,
  type PhotoFramePreset,
} from '@/engine/photo/photoModeConstants';
import {
  pushPhotoCaptureHistory,
  type PhotoCaptureHistoryEntry,
} from '@/engine/photo/photoCaptureHistory';
import {
  loadPersistedPhotoGallery,
  persistPhotoGallery,
} from '@/engine/photo/photoCapturePersist';
import { exportPhotoGalleryBatch } from '@/engine/photo/photoGalleryBatchExport';
import {
  capturePhotoStill,
  downloadPhotoStill,
  formatGameTimeOfDay,
  getCaptureFailureMessage,
  resolveSceneDisplayName,
  shareOrDownloadPhotoStill,
} from '@/engine/photo/photoModePresentation';
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
  const [captureHistory, setCaptureHistory] = useState<PhotoCaptureHistoryEntry[]>([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [filterPreset, setFilterPreset] = useState<PhotoFilterPreset>('normal');
  const [framePreset, setFramePreset] = useState<PhotoFramePreset>('none');
  const [lightingBoosted, setLightingBoosted] = useState(false);

  const previewTimerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const previewRef = useRef<PhotoPreviewData | null>(null);
  previewRef.current = preview;
  const filterPresetRef = useRef(filterPreset);
  filterPresetRef.current = filterPreset;
  const sceneNameRef = useRef(sceneName);
  sceneNameRef.current = sceneName;

  const bumpPreviewTimer = useCallback(() => {
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    previewTimerRef.current = window.setTimeout(() => setPreview(null), PHOTO_PREVIEW_DISPLAY_MS);
  }, []);

  const exitPhotoMode = useCallback(() => {
    if (!activeRef.current) return;
    setActive(false);
    activeRef.current = false;
    setPhotoModeActive(false);
    setLightingBoosted(false);
    setLiveAnnouncement(PHOTO_MODE_LABELS.exited);
    eventBus.emit(PHOTO_EVENTS.inactive, PHOTO_EMPTY_PAYLOAD);
    // Reset lighting on exit
    eventBus.emit('photo:lighting_boost', { active: false });
    // Re-enable motion blur
    eventBus.emit('photo:motion_blur', { enabled: true });
  }, []);

  const enterPhotoMode = useCallback(() => {
    if (gamePhaseRef.current !== 'exploration') return;
    setActive(true);
    activeRef.current = true;
    setPhotoModeActive(true);
    setLightingBoosted(true);
    setLiveAnnouncement(PHOTO_MODE_LABELS.entered);
    eventBus.emit(PHOTO_EVENTS.active, PHOTO_EMPTY_PAYLOAD);
    // Boost ambient lighting for photo mode
    eventBus.emit('photo:lighting_boost', { active: true });
    // Disable motion blur for crisp screenshots
    eventBus.emit('photo:motion_blur', { enabled: false });
    // Request highest DPR for screenshot quality
    eventBus.emit('photo:dpr_request', { dpr: 2 });
    setLiveAnnouncement(PHOTO_MODE_LABELS.lightingBoost);
  }, []);

  const cycleFilterPreset = useCallback(() => {
    setFilterPreset((prev) => {
      const idx = PHOTO_FILTER_ORDER.indexOf(prev);
      const next = PHOTO_FILTER_ORDER[(idx + 1) % PHOTO_FILTER_ORDER.length];
      setLiveAnnouncement(PHOTO_FILTER_LABELS[next]);
      return next;
    });
  }, []);

  const cycleFramePreset = useCallback(() => {
    setFramePreset((prev) => {
      const idx = PHOTO_FRAME_ORDER.indexOf(prev);
      const next = PHOTO_FRAME_ORDER[(idx + 1) % PHOTO_FRAME_ORDER.length];
      setLiveAnnouncement(PHOTO_FRAME_LABELS[next]);
      return next;
    });
  }, []);

  const captureScreenshot = useCallback(() => {
    if (!activeRef.current) return;

    if (!reducedMotion) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), PHOTO_FLASH_DURATION_MS);
    }

    void capturePhotoStill(filterPreset).then((result) => {
      if (!activeRef.current) return;
      if (result.ok) {
        const timestamp = Date.now();
        setPreview({ dataUrl: result.dataUrl, timestamp });
        setCaptureHistory((prev) => {
          const next = pushPhotoCaptureHistory(prev, {
            dataUrl: result.dataUrl,
            timestamp,
            filter: filterPresetRef.current,
            sceneName: sceneNameRef.current,
          });
          void persistPhotoGallery(next);
          return next;
        });
        bumpPreviewTimer();
        eventBus.emit('sound:play', { type: 'screenshot' });
        eventBus.emit('game:notification', {
          title: PHOTO_MODE_LABELS.captureSuccess,
          type: 'info' as const,
        });
      } else {
        eventBus.emit('game:notification', {
          title: getCaptureFailureMessage(),
          type: 'info' as const,
        });
      }
    });
  }, [reducedMotion, filterPreset, bumpPreviewTimer]);

  const selectHistoryCapture = useCallback((entry: PhotoCaptureHistoryEntry) => {
    setPreview({ dataUrl: entry.dataUrl, timestamp: entry.timestamp });
    bumpPreviewTimer();
    setLiveAnnouncement(`${PHOTO_MODE_LABELS.gallerySelect}: ${entry.sceneName}`);
  }, [bumpPreviewTimer]);

  const downloadPreview = useCallback(() => {
    const current = previewRef.current;
    if (!current) return;
    const result = downloadPhotoStill(current.dataUrl, filterPresetRef.current);
    bumpPreviewTimer();
    eventBus.emit('game:notification', {
      title: result.ok ? PHOTO_MODE_LABELS.downloadSuccess : PHOTO_MODE_LABELS.captureFailed,
      type: 'info' as const,
    });
  }, [bumpPreviewTimer]);

  const sharePreview = useCallback(() => {
    const current = previewRef.current;
    if (!current) return;
    void shareOrDownloadPhotoStill(current.dataUrl, filterPresetRef.current).then((result) => {
      bumpPreviewTimer();
      if (!result.ok) {
        eventBus.emit('game:notification', {
          title: PHOTO_MODE_LABELS.captureFailed,
          type: 'info' as const,
        });
        return;
      }
      eventBus.emit('game:notification', {
        title:
          result.method === 'share'
            ? PHOTO_MODE_LABELS.shareSuccess
            : PHOTO_MODE_LABELS.shareUnavailable,
        type: 'info' as const,
      });
    });
  }, [bumpPreviewTimer]);

  const exportGalleryBatch = useCallback(() => {
    setCaptureHistory((prev) => {
      if (prev.length === 0) return prev;
      void exportPhotoGalleryBatch(prev).then((result) => {
        const title =
          result.downloaded === 0
            ? PHOTO_MODE_LABELS.galleryExportBatchFailed
            : result.failed > 0
              ? PHOTO_MODE_LABELS.galleryExportBatchPartial
              : PHOTO_MODE_LABELS.galleryExportBatchSuccess;
        setLiveAnnouncement(title);
        eventBus.emit('game:notification', { title, type: 'info' as const });
      });
      return prev;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadPersistedPhotoGallery().then((entries) => {
      if (cancelled || entries.length === 0) return;
      setCaptureHistory((prev) => (prev.length > 0 ? prev : entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      if (event.code === 'KeyN' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        cycleFilterPreset();
      }
      if (event.code === 'KeyF' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        cycleFramePreset();
      }
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        captureScreenshot();
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [active, exitPhotoMode, captureScreenshot, cycleFilterPreset, cycleFramePreset]);

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
      eventBus.emit('photo:lighting_boost', { active: false });
      eventBus.emit('photo:motion_blur', { enabled: true });
      eventBus.emit('photo:dpr_request', { dpr: 1 });
    };
  }, []);

  return {
    active,
    flash,
    preview,
    captureHistory: captureHistory.slice(-PHOTO_GALLERY_STRIP_MAX),
    liveAnnouncement,
    reducedMotion,
    sceneName,
    timeStr,
    filterPreset,
    framePreset,
    lightingBoosted,
    exitPhotoMode,
    captureScreenshot,
    selectHistoryCapture,
    cycleFilterPreset,
    cycleFramePreset,
    downloadPreview,
    sharePreview,
    exportGalleryBatch,
  };
}
