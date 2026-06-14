import { eventBus } from '@/engine/EventBus';
import {
  clampInRange,
  DEFAULT_ACCESSIBILITY_SETTINGS,
} from './accessibilityConstraints';
import { applyAccessibilityDomHooks } from './accessibilityDomPresentation';
import type {
  AccessibilityChangedKey,
  AccessibilitySettingKey,
  AccessibilitySettingsSnapshot,
} from './accessibilityTypes';

export {
  ACCESSIBILITY_NUMERIC_RANGES,
  clampInRange,
  clampNumericAccessibilitySetting,
  createLocomotionSpeed,
  createSubtitleScale,
  createTextSpeed,
  DEFAULT_ACCESSIBILITY_SETTINGS,
} from './accessibilityConstraints';
export type { AccessibilityNumericSettingKey } from './accessibilityConstraints';

export const ACCESSIBILITY_LS_KEYS = {
  colorBlindMode: 'volodka_color_blind_mode',
  reducedMotionOverride: 'volodka_reduced_motion_override',
  subtitleScale: 'volodka_subtitle_scale',
  textSpeed: 'volodka_text_speed',
  locomotionSpeed: 'volodka_locomotion_speed',
} as const satisfies Record<AccessibilitySettingKey, string>;

const LS_KEY_TO_SETTING = Object.fromEntries(
  Object.entries(ACCESSIBILITY_LS_KEYS).map(([settingKey, lsKey]) => [lsKey, settingKey]),
) as Record<string, AccessibilitySettingKey>;

const ALL_LS_KEYS = new Set<string>(Object.values(ACCESSIBILITY_LS_KEYS));

export type AccessibilityStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface AccessibilityManagerOptions {
  storage?: AccessibilityStorage | null;
  root?: HTMLElement | null;
  /** Listen for cross-tab localStorage changes (default true in browser). */
  syncCrossTab?: boolean;
}

function readBool(storage: AccessibilityStorage, key: string, fallback: boolean): boolean {
  try {
    return (storage.getItem(key) ?? String(fallback)) === 'true';
  } catch {
    return fallback;
  }
}

function readNumber(storage: AccessibilityStorage, key: string, fallback: number): number {
  try {
    const n = Number(storage.getItem(key) ?? String(fallback));
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function readString(storage: AccessibilityStorage, key: string, fallback: string): string {
  try {
    return storage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function readAccessibilitySettingsFromStorage(
  storage: AccessibilityStorage,
): AccessibilitySettingsSnapshot {
  return {
    colorBlindMode: clampInRange(
      readString(storage, ACCESSIBILITY_LS_KEYS.colorBlindMode, 'none'),
      'colorBlindMode',
    ),
    reducedMotionOverride: clampInRange(
      readBool(
        storage,
        ACCESSIBILITY_LS_KEYS.reducedMotionOverride,
        DEFAULT_ACCESSIBILITY_SETTINGS.reducedMotionOverride,
      ),
      'reducedMotionOverride',
    ),
    subtitleScale: clampInRange(
      readNumber(storage, ACCESSIBILITY_LS_KEYS.subtitleScale, DEFAULT_ACCESSIBILITY_SETTINGS.subtitleScale),
      'subtitleScale',
    ),
    textSpeed: clampInRange(
      readNumber(storage, ACCESSIBILITY_LS_KEYS.textSpeed, DEFAULT_ACCESSIBILITY_SETTINGS.textSpeed),
      'textSpeed',
    ),
    locomotionSpeed: clampInRange(
      readNumber(
        storage,
        ACCESSIBILITY_LS_KEYS.locomotionSpeed,
        DEFAULT_ACCESSIBILITY_SETTINGS.locomotionSpeed,
      ),
      'locomotionSpeed',
    ),
  };
}

function writeSettingToStorage(
  storage: AccessibilityStorage,
  key: AccessibilitySettingKey,
  value: AccessibilitySettingsSnapshot[AccessibilitySettingKey],
): void {
  const normalized = clampInRange(value, key);
  storage.setItem(ACCESSIBILITY_LS_KEYS[key], String(normalized));
}

function clampSettingValue<K extends AccessibilitySettingKey>(
  key: K,
  value: AccessibilitySettingsSnapshot[K],
): AccessibilitySettingsSnapshot[K] {
  return clampInRange(value, key);
}

function parseSettingFromStorageValue(
  key: AccessibilitySettingKey,
  raw: string | null,
): AccessibilitySettingsSnapshot[AccessibilitySettingKey] {
  if (raw === null) {
    return DEFAULT_ACCESSIBILITY_SETTINGS[key];
  }
  return clampInRange(raw, key);
}

function isDomRootReady(): boolean {
  return typeof document !== 'undefined' && document.documentElement != null;
}

function isDocumentReady(): boolean {
  return typeof document !== 'undefined' && document.readyState !== 'loading';
}

function shouldDeferDomApply(options: AccessibilityManagerOptions): boolean {
  return options.root === undefined;
}

/** Owns accessibility settings state, DOM hooks, and cross-tab sync. */
export class AccessibilityManager {
  private settings: AccessibilitySettingsSnapshot = { ...DEFAULT_ACCESSIBILITY_SETTINGS };
  private cachedSettings: Readonly<AccessibilitySettingsSnapshot> | null = null;
  private initialized = false;
  private readonly options: AccessibilityManagerOptions;
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private pendingDomKeys: Set<AccessibilityChangedKey> | null = null;
  private domReadyListener: (() => void) | null = null;

  constructor(options: AccessibilityManagerOptions = {}) {
    this.options = options;
  }

  /** Snapshot for React — cached immutable copy, invalidated on change. */
  getSettings(): AccessibilitySettingsSnapshot {
    if (!this.initialized) {
      return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
    }
    if (!this.cachedSettings) {
      this.cachedSettings = Object.freeze({ ...this.settings });
    }
    return this.cachedSettings;
  }

  /** Hot-path read — no allocation. */
  getReducedMotionOverride(): boolean {
    return this.initialized
      ? this.settings.reducedMotionOverride
      : DEFAULT_ACCESSIBILITY_SETTINGS.reducedMotionOverride;
  }

  /** Hot-path read — no allocation. */
  getLocomotionSpeed(): AccessibilitySettingsSnapshot['locomotionSpeed'] {
    return this.initialized
      ? this.settings.locomotionSpeed
      : DEFAULT_ACCESSIBILITY_SETTINGS.locomotionSpeed;
  }

  private invalidateSettingsCache(): void {
    this.cachedSettings = null;
  }

  /** Hydrate from storage, apply DOM, optionally bind cross-tab sync. */
  init(): AccessibilitySettingsSnapshot {
    this.hydrateFromStorage('all');
    if (this.options.syncCrossTab !== false) {
      this.bindStorageSync();
    }
    return this.getSettings();
  }

  /** Reload all settings from storage (e.g. after external bulk LS writes). */
  applyFromStorage(): AccessibilitySettingsSnapshot {
    return this.hydrateFromStorage('all');
  }

  /** Reset to defaults in memory, storage, and DOM. */
  reset(): AccessibilitySettingsSnapshot {
    const storage = this.resolveStorage();
    if (storage) {
      for (const key of Object.keys(ACCESSIBILITY_LS_KEYS) as AccessibilitySettingKey[]) {
        writeSettingToStorage(storage, key, DEFAULT_ACCESSIBILITY_SETTINGS[key]);
      }
    }

    this.settings = { ...DEFAULT_ACCESSIBILITY_SETTINGS };
    this.initialized = true;
    this.invalidateSettingsCache();
    this.applyDom('all');
    this.emitChanged('all');
    return this.getSettings();
  }

  updateSetting<K extends AccessibilitySettingKey>(
    key: K,
    value: AccessibilitySettingsSnapshot[K],
  ): AccessibilitySettingsSnapshot {
    const clamped = clampSettingValue(key, value);
    const storage = this.resolveStorage();

    if (!this.initialized && storage) {
      this.settings = readAccessibilitySettingsFromStorage(storage);
      this.initialized = true;
      this.invalidateSettingsCache();
    }

    this.settings = { ...this.settings, [key]: clamped };
    this.invalidateSettingsCache();

    if (storage) {
      writeSettingToStorage(storage, key, clamped);
    }

    this.applyDom(key);
    this.emitChanged(key);
    return this.getSettings();
  }

  bindStorageSync(): void {
    if (typeof window === 'undefined' || this.storageListener) return;

    this.storageListener = (event: StorageEvent) => {
      this.handleCrossTabStorageChange(event);
    };
    window.addEventListener('storage', this.storageListener);
  }

  unbindStorageSync(): void {
    if (typeof window === 'undefined' || !this.storageListener) return;
    window.removeEventListener('storage', this.storageListener);
    this.storageListener = null;
  }

  dispose(): void {
    this.unbindStorageSync();
    this.cancelDomReadyListener();
    this.pendingDomKeys = null;
    this.settings = { ...DEFAULT_ACCESSIBILITY_SETTINGS };
    this.initialized = false;
    this.invalidateSettingsCache();
  }

  private hydrateFromStorage(changedKey: AccessibilityChangedKey): AccessibilitySettingsSnapshot {
    const storage = this.resolveStorage();
    this.settings = storage
      ? readAccessibilitySettingsFromStorage(storage)
      : { ...DEFAULT_ACCESSIBILITY_SETTINGS };
    this.initialized = true;
    this.invalidateSettingsCache();
    this.applyDom(changedKey);
    this.emitChanged(changedKey);
    return this.getSettings();
  }

  private handleCrossTabStorageChange(event: StorageEvent): void {
    if (!event.key || !ALL_LS_KEYS.has(event.key)) return;

    const settingKey = LS_KEY_TO_SETTING[event.key];
    if (!settingKey) return;

    const nextValue = parseSettingFromStorageValue(settingKey, event.newValue);
    this.settings = { ...this.settings, [settingKey]: nextValue };
    this.initialized = true;
    this.invalidateSettingsCache();
    this.applyDom(settingKey);
    this.emitChanged(settingKey);
  }

  private resolveStorage(): AccessibilityStorage | null {
    if (this.options.storage !== undefined) {
      return this.options.storage;
    }
    return typeof localStorage !== 'undefined' ? localStorage : null;
  }

  private resolveRoot(): HTMLElement | null {
    if (this.options.root !== undefined) {
      return this.options.root;
    }
    if (!isDomRootReady()) return null;
    return document.documentElement;
  }

  private applyDom(changedKey: AccessibilityChangedKey): void {
    if (!shouldDeferDomApply(this.options)) {
      const root = this.resolveRoot();
      if (!root) return;
      applyAccessibilityDomHooks(root, this.settings, changedKey);
      return;
    }

    if (!isDomRootReady() || !isDocumentReady()) {
      this.queueDomApply(changedKey);
      return;
    }

    const root = document.documentElement;
    applyAccessibilityDomHooks(root, this.settings, changedKey);
    this.flushPendingDomApply(root);
  }

  private queueDomApply(changedKey: AccessibilityChangedKey): void {
    if (!this.pendingDomKeys) {
      this.pendingDomKeys = new Set();
    }

    if (changedKey === 'all') {
      this.pendingDomKeys.clear();
      this.pendingDomKeys.add('all');
    } else if (!this.pendingDomKeys.has('all')) {
      this.pendingDomKeys.add(changedKey);
    }

    this.scheduleDomFlush();
  }

  private scheduleDomFlush(): void {
    if (this.domReadyListener || !shouldDeferDomApply(this.options)) return;
    if (typeof document === 'undefined') return;

    const flush = () => {
      this.domReadyListener = null;
      if (!isDomRootReady()) return;
      this.flushPendingDomApply(document.documentElement);
    };

    if (isDocumentReady() && isDomRootReady()) {
      flush();
      return;
    }

    this.domReadyListener = flush;
    document.addEventListener('DOMContentLoaded', flush, { once: true });
  }

  private flushPendingDomApply(root: HTMLElement): void {
    if (!this.pendingDomKeys?.size) return;

    const keys = [...this.pendingDomKeys];
    this.pendingDomKeys.clear();

    if (keys.includes('all')) {
      applyAccessibilityDomHooks(root, this.settings, 'all');
      return;
    }

    for (const key of keys) {
      applyAccessibilityDomHooks(root, this.settings, key);
    }
  }

  private cancelDomReadyListener(): void {
    if (this.domReadyListener && typeof document !== 'undefined') {
      document.removeEventListener('DOMContentLoaded', this.domReadyListener);
    }
    this.domReadyListener = null;
  }

  private emitChanged(changedKey: AccessibilityChangedKey): void {
    eventBus.emit('accessibility:changed', {
      changedKey,
      settings: this.getSettings(),
    });
  }
}
