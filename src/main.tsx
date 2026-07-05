import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppBootRoot } from '@/app/AppBootRoot';
import '@/app/globals.css';
import { bindApplicationLayers } from '@/bootstrap/bindApplicationLayers';
import { markAppStart } from '@/engine/performance/LoadingTimeline';
import { applyGameSettings } from '@/engine/settings/SettingsFacade';
import { initAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';
import { initVoiceLineRegistry } from '@/engine/audio/VoiceLineRegistry';
import { installChunkLoadRecovery, clearChunkReloadFlag } from '@/shared/chunk/chunkLoadRecovery';

// Install vite:preloadError handler BEFORE any lazy chunk can be loaded.
// If this runs after createRoot().render(), Vite may have already attempted
// to preload a lazy chunk (e.g. panel-rest) and fired vite:preloadError
// before the handler was installed — causing an uncaught crash.
clearChunkReloadFlag();
installChunkLoadRecovery();

bindApplicationLayers();
applyGameSettings();
initAccessibilitySettings();
initVoiceLineRegistry();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

/** Opt-in only — StrictMode double-mount breaks Rapier KCC lifecycle in dev. */
const enableStrictMode = import.meta.env.VITE_ENABLE_STRICT_MODE === 'true';

function renderAppTree(): ReactNode {
  return <AppBootRoot />;
}

createRoot(root).render(
  enableStrictMode ? (
    <StrictMode>{renderAppTree()}</StrictMode>
  ) : (
    renderAppTree()
  ),
);

markAppStart();
