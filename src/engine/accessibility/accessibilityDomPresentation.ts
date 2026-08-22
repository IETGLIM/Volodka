import type {
  AccessibilityChangedKey,
  AccessibilitySettingKey,
  AccessibilitySettingsSnapshot,
} from './accessibilityTypes';

type AccessibilityDomHookBase = {
  settingKey: AccessibilitySettingKey;
};

export type AccessibilityCssVarDomHook = AccessibilityDomHookBase & {
  type: 'cssVar';
  cssVar: `--${string}`;
  serialize: (settings: AccessibilitySettingsSnapshot) => string;
};

export type AccessibilityDataAttributeDomHook = AccessibilityDomHookBase & {
  type: 'dataAttribute';
  attribute: `data-${string}`;
  serialize: (settings: AccessibilitySettingsSnapshot) => string | null;
};

export type AccessibilityDomHook = AccessibilityCssVarDomHook | AccessibilityDataAttributeDomHook;

/** Setting key → DOM presentation (CSS variables and data attributes on document root). */
export const ACCESSIBILITY_DOM_HOOKS: readonly AccessibilityDomHook[] = [
  {
    settingKey: 'colorBlindMode',
    type: 'dataAttribute',
    attribute: 'data-color-blind-mode',
    serialize: (settings) =>
      settings.colorBlindMode === 'none' ? null : settings.colorBlindMode,
  },
  {
    settingKey: 'reducedMotionOverride',
    type: 'dataAttribute',
    attribute: 'data-reduced-motion',
    serialize: (settings) => (settings.reducedMotionOverride ? 'true' : null),
  },
  {
    settingKey: 'subtitleScale',
    type: 'cssVar',
    cssVar: '--subtitle-scale',
    serialize: (settings) => String(settings.subtitleScale),
  },
  {
    settingKey: 'highContrast',
    type: 'dataAttribute',
    attribute: 'data-high-contrast',
    serialize: (settings) => (settings.highContrast ? 'true' : null),
  },
  {
    settingKey: 'uiTextScale',
    type: 'cssVar',
    cssVar: '--volodka-ui-text-scale',
    serialize: (settings) => String(settings.uiTextScale),
  },
] as const;

function shouldApplyDomHook(
  hook: AccessibilityDomHook,
  changedKey: AccessibilityChangedKey,
): boolean {
  return changedKey === 'all' || changedKey === hook.settingKey;
}

function applyDomHook(root: HTMLElement, hook: AccessibilityDomHook, settings: AccessibilitySettingsSnapshot): void {
  switch (hook.type) {
    case 'cssVar':
      root.style.setProperty(hook.cssVar, hook.serialize(settings));
      break;
    case 'dataAttribute': {
      const value = hook.serialize(settings);
      if (value === null) {
        root.removeAttribute(hook.attribute);
      } else {
        root.setAttribute(hook.attribute, value);
      }
      break;
    }
    default: {
      const _exhaustive: never = hook;
      return _exhaustive;
    }
  }
}

/** Apply accessibility presentation hooks to the document root. */
export function applyAccessibilityDomHooks(
  root: HTMLElement,
  settings: AccessibilitySettingsSnapshot,
  changedKey: AccessibilityChangedKey,
): void {
  for (const hook of ACCESSIBILITY_DOM_HOOKS) {
    if (!shouldApplyDomHook(hook, changedKey)) continue;
    applyDomHook(root, hook, settings);
  }
}

/** Keys that currently surface on the document root (for tests and docs). */
export const ACCESSIBILITY_DOM_SETTING_KEYS = ACCESSIBILITY_DOM_HOOKS.map(
  (hook) => hook.settingKey,
);
