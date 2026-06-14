import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppBootRoot } from '@/app/AppBootRoot';
import '@/app/globals.css';
import { bindApplicationLayers } from '@/bootstrap/bindApplicationLayers';
import { markAppStart } from '@/engine/performance/LoadingTimeline';
import { applyVisualSettings } from '@/engine/visualSettings';
import { initAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';
import { initVoiceLineRegistry } from '@/engine/audio/VoiceLineRegistry';

markAppStart();
bindApplicationLayers();
applyVisualSettings();
initAccessibilitySettings();
initVoiceLineRegistry();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <AppBootRoot />
  </StrictMode>,
);
