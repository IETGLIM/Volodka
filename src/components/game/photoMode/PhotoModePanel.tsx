import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PhotoModeViewfinder } from '@/components/game/photoMode/PhotoModeViewfinder';
import { usePhotoModeController } from '@/components/game/photoMode/usePhotoModeController';

function PhotoModeInner() {
  const photo = usePhotoModeController();

  return (
    <AnimatePresence>
      {photo.active && (
        <PhotoModeViewfinder
          flash={photo.flash}
          preview={photo.preview}
          captureHistory={photo.captureHistory}
          liveAnnouncement={photo.liveAnnouncement}
          reducedMotion={photo.reducedMotion}
          sceneName={photo.sceneName}
          timeStr={photo.timeStr}
          filterPreset={photo.filterPreset}
          onCapture={photo.captureScreenshot}
          onExit={photo.exitPhotoMode}
          onSelectHistory={photo.selectHistoryCapture}
          onDownloadPreview={photo.downloadPreview}
          onSharePreview={photo.sharePreview}
        />
      )}
    </AnimatePresence>
  );
}

export function PhotoMode() {
  return (
    <ErrorBoundary name="PhotoMode" fallback={null}>
      <PhotoModeInner />
    </ErrorBoundary>
  );
}
