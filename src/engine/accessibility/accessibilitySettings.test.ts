import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';

import {
  AccessibilityManager,
  DEFAULT_ACCESSIBILITY_SETTINGS,
} from './AccessibilityManager';
import { createSubtitleScale, createTextSpeed } from './accessibilityConstraints';
import {
  getAccessibilitySettings,
  initAccessibilitySettings,
  replaceDefaultAccessibilityManager,
  resetDefaultAccessibilityManager,
  setTextSpeed,
} from './accessibilitySettings';

const lsStore: Record<string, string> = {};

function createLocalStorageMock() {
  return {
    getItem: (key: string) => lsStore[key] ?? null,
    setItem: (key: string, value: string) => {
      lsStore[key] = value;
    },
    removeItem: (key: string) => {
      delete lsStore[key];
    },
    clear: () => {
      for (const key of Object.keys(lsStore)) delete lsStore[key];
    },
  };
}

function createDomRoot() {
  return {
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    style: { setProperty: vi.fn() },
  } as unknown as HTMLElement;
}

describe('AccessibilityManager', () => {
  let root: HTMLElement;
  let storage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    for (const key of Object.keys(lsStore)) delete lsStore[key];
    storage = createLocalStorageMock();
    root = createDomRoot();
  });

  it('returns defaults before init (SSR-safe)', () => {
    const manager = new AccessibilityManager({ storage, root, syncCrossTab: false });
    expect(manager.getSettings()).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
  });

  it('hydrates from storage on init', () => {
    lsStore['volodka_text_speed'] = '1.8';
    const manager = new AccessibilityManager({ storage, root, syncCrossTab: false });
    manager.init();
    expect(manager.getSettings().textSpeed).toBe(1.8);
  });

  it('updateSetting writes one LS key without reading the rest', () => {
    const manager = new AccessibilityManager({ storage, root, syncCrossTab: false });
    manager.init();
    const readSpy = vi.spyOn(storage, 'getItem');

    manager.updateSetting('textSpeed', createTextSpeed(1.4));

    expect(readSpy).not.toHaveBeenCalled();
    expect(lsStore['volodka_text_speed']).toBe('1.4');
    expect(manager.getSettings().textSpeed).toBe(1.4);
  });

  it('reset restores defaults in storage and memory', () => {
    const manager = new AccessibilityManager({ storage, root, syncCrossTab: false });
    manager.init();
    manager.updateSetting('textSpeed', createTextSpeed(1.9));
    manager.reset();
    expect(manager.getSettings()).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
    expect(lsStore['volodka_text_speed']).toBe('1');
  });

  it('syncs a single key from cross-tab storage events', () => {
    const storageListeners: Array<(event: StorageEvent) => void> = [];
    vi.stubGlobal('window', {
      addEventListener: (_type: string, handler: (event: StorageEvent) => void) => {
        storageListeners.push(handler);
      },
      removeEventListener: (_type: string, handler: (event: StorageEvent) => void) => {
        const index = storageListeners.indexOf(handler);
        if (index >= 0) storageListeners.splice(index, 1);
      },
    });

    const manager = new AccessibilityManager({ storage, root, syncCrossTab: false });
    manager.init();
    manager.bindStorageSync();

    expect(storageListeners).toHaveLength(1);
    storageListeners[0]?.({
      key: 'volodka_text_speed',
      newValue: '1.5',
    } as StorageEvent);

    expect(manager.getSettings().textSpeed).toBe(1.5);
    manager.dispose();
    vi.unstubAllGlobals();
  });

  it('emits typed accessibility:changed with changedKey', () => {
    const manager = new AccessibilityManager({ storage, root, syncCrossTab: false });
    manager.init();
    const handler = vi.fn();
    eventBus.on('accessibility:changed', handler);

    manager.updateSetting('textSpeed', createTextSpeed(1.2));

    expect(handler).toHaveBeenCalledWith({
      changedKey: 'textSpeed',
      settings: expect.objectContaining({ textSpeed: 1.2 }),
    });
  });

  it('defers DOM hooks until DOMContentLoaded when the document is still loading', () => {
    const htmlRoot = createDomRoot();
    const domReadyHandlers: Array<() => void> = [];
    const doc = {
      readyState: 'loading',
      documentElement: htmlRoot,
      addEventListener: (type: string, handler: () => void) => {
        if (type === 'DOMContentLoaded') domReadyHandlers.push(handler);
      },
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('document', doc);

    lsStore['volodka_reduced_motion_override'] = 'true';
    const manager = new AccessibilityManager({ storage, syncCrossTab: false });
    manager.init();

    expect(htmlRoot.setAttribute).not.toHaveBeenCalled();
    expect(domReadyHandlers).toHaveLength(1);

    doc.readyState = 'interactive';
    domReadyHandlers[0]();

    expect(htmlRoot.setAttribute).toHaveBeenCalledWith('data-reduced-motion', 'true');
    manager.dispose();
    vi.unstubAllGlobals();
  });
});

describe('accessibilitySettings facade', () => {
  beforeEach(() => {
    for (const key of Object.keys(lsStore)) delete lsStore[key];
    vi.stubGlobal('localStorage', createLocalStorageMock());
    vi.stubGlobal('document', { readyState: 'complete', documentElement: createDomRoot() });
    resetDefaultAccessibilityManager();
  });

  afterEach(() => {
    resetDefaultAccessibilityManager();
    vi.unstubAllGlobals();
  });

  it('default facade delegates to replaceable manager instance', () => {
    const facadeStorage = createLocalStorageMock();
    facadeStorage.setItem('volodka_text_speed', '1.7');
    const isolated = new AccessibilityManager({
      storage: facadeStorage,
      root: createDomRoot(),
      syncCrossTab: false,
    });
    replaceDefaultAccessibilityManager(isolated);

    initAccessibilitySettings();
    expect(getAccessibilitySettings().textSpeed).toBe(1.7);

    setTextSpeed(1.1);
    expect(getAccessibilitySettings().textSpeed).toBe(1.1);
  });
});
