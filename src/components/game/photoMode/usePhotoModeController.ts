import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from '@/engine/events';
import {
  PHOTO_FLASH_DURATION_MS,
  PHOTO_MODE_LABELS,
  PHOTO_PREVIEW_DISPLAY_MS,
  type PhotoFilterPreset,
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
  const [filterPreset, setFilterPreset] = useState<PhotoFilterPreset>('neon');

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

  const toggleFilterPreset = useCallback(() => {
    setFilterPreset((prev) => {
      const next: PhotoFilterPreset = prev === 'neon' ? 'noir' : 'neon';
      setLiveAnnouncement(next === 'noir' ? PHOTO_MODE_LABELS.noirOn : PHOTO_MODE_LABELS.noirOff);
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
        toggleFilterPreset();
      }
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        captureScreenshot();
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [active, exitPhotoMode, captureScreenshot, toggleFilterPreset]);

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
    captureHistory,
    liveAnnouncement,
    reducedMotion,
    sceneName,
    timeStr,
    filterPreset,
    exitPhotoMode,
    captureScreenshot,
    selectHistoryCapture,
    toggleFilterPreset,
    downloadPreview,
    sharePreview,
    exportGalleryBatch,
  };
}
