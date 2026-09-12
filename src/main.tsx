import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppBootRoot } from '@/app/AppBootRoot';
import '@/app/globals.css';
import { bindApplicationLayers } from '@/bootstrap/bindApplicationLayers';
import { markAppStart } from '@/engine/performance/LoadingTimeline';
import { applyGameSettings } from '@/engine/settings/SettingsFacade';
import { initAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';
import { initVoiceLineRegistry } from '@/engine/audio/VoiceLineRegistry';
import { installChunkLoadRecovery } from '@/shared/chunk/chunkLoadRecovery';
import { installSceneLoadDebugTap } from '@/engine/core/sceneLoadDebug';

// Install vite:preloadError handler BEFORE any lazy chunk can be loaded.
// If this runs after createRoot().render(), Vite may have already attempted
// to preload a lazy chunk (e.g. panel-rest) and fired vite:preloadError
// before the handler was installed — causing an uncaught crash.
//
// Do NOT clearChunkReloadFlag() here: clearing on every module eval defeats
// the sessionStorage one-shot while HTML/CDN is still briefly stale after
// deploy. AppBootRoot clears the flag only after a successful boot.
installChunkLoadRecovery();

bindApplicationLayers();
applyGameSettings();
initAccessibilitySettings();
initVoiceLineRegistry();
installSceneLoadDebugTap();

// PWA: register the service worker (production only, after first paint).
// The SW (public/sw.js) caches the app shell, physics WASM and game media
// for offline play. Registration failures are non-fatal — the game works
// fine without it; we only log a quiet console warning.
function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err: unknown) => {
        console.warn('[pwa] Не удалось зарегистрировать сервис-воркер:', err);
      });
  }, { once: true });
}
registerServiceWorker();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

/** FIX (v4.22): WebGL2-гейт. three 0.172 / R3F v9 требуют WebGL2 — без него
 *  игрок видел просто чёрный канвас без объяснений. Теперь до монтирования
 *  приложения показываем понятный экран с требованиями (на русском). */
function hasWebGl2(): boolean {
  try {
    if (typeof WebGL2RenderingContext === 'undefined') return false;
    const probe = document.createElement('canvas');
    return probe.getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

/** Opt-in only — StrictMode double-mount breaks Rapier KCC lifecycle in dev. */
const enableStrictMode = import.meta.env.VITE_ENABLE_STRICT_MODE === 'true';

function renderAppTree(): ReactNode {
  return <AppBootRoot />;
}

if (!hasWebGl2()) {
  root.innerHTML = `
    <div style="
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #0a0e14; color: #d8dee6; font-family: system-ui, sans-serif; padding: 24px;
    ">
      <div style="max-width: 520px; line-height: 1.6;">
        <h1 style="font-size: 20px; margin: 0 0 12px; color: #6ee7d8;">Нужна поддержка WebGL&nbsp;2</h1>
        <p style="margin: 0 0 12px;">«Володька» использует WebGL&nbsp;2 для 3D-графики, но ваш браузер его не предоставляет.</p>
        <ul style="margin: 0 0 12px; padding-left: 20px;">
          <li>Обновите браузер (Chrome, Firefox, Edge или Safari&nbsp;15+)</li>
          <li>Включите аппаратное ускорение в настройках браузера</li>
          <li>Проверьте, что видеокарта не занята другой программой</li>
        </ul>
        <p style="margin: 0; opacity: 0.7;">После исправления просто обновите страницу.</p>
      </div>
    </div>`;
} else {
  createRoot(root).render(
    enableStrictMode ? (
      <StrictMode>{renderAppTree()}</StrictMode>
    ) : (
      renderAppTree()
    ),
  );

  markAppStart();
}
