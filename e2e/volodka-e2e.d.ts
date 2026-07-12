import type { VolodkaE2EBridge } from '../src/engine/e2e/e2eBridge';

declare global {
  interface Window {
    __volodka_e2e?: VolodkaE2EBridge;
  }
}

export {};
