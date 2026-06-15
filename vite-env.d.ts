/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string;
  readonly VITE_MODELS_BASE?: string;
  readonly VITE_DEFAULT_PLAYER_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    /** E-key debounce shared with InteractiveTriggers / ExaminePanel / SceneExitIndicator */
    __volodka_ekey_consumed?: boolean;
    /** Enable frame budget tick timing in production (dev panel / e2e). */
    __VOL_PROFILE__?: boolean;
  }
}

export {};

declare module '@dimforge/rapier3d-compat/rapier_wasm3d.js' {
  type RapierWasmInitOptions = {
    module_or_path?: RequestInfo | URL | WebAssembly.Module;
    module?: WebAssembly.Module;
  };
  export default function init(options?: RapierWasmInitOptions): Promise<unknown>;
}
