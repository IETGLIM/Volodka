/// <reference types="vite/client" />

declare module '@dimforge/rapier3d-compat/rapier_wasm3d.js' {
  type RapierWasmInitOptions = {
    module_or_path?: RequestInfo | URL | WebAssembly.Module;
    module?: WebAssembly.Module;
  };
  export default function init(options?: RapierWasmInitOptions): Promise<unknown>;
}
