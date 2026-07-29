import { POEMS } from '@/data/poems';
import { validateSaveData } from '@/shared/validation/saveSchema';
import { SAVE_KEY, SCENE_LABELS } from '@/engine/menu/menuConstants';

export type MenuItemDef = {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
  accent?: 'cyan' | 'emerald' | 'amber' | 'magenta';
};

export type MenuAccentColors = {
  border: string;
  borderHover: string;
  bg: string;
  bgHover: string;
  text: string;
  textHover: string;
  glow: string;
  glowHover: string;
  scanColor: string;
};

export type MenuSavePreview = {
  level: number;
  sceneName: string;
  poemsCollected: number;
  poemsTotal: number;
};

export function buildMenuItems(hasSave: boolean): MenuItemDef[] {
  return [
    { id: 'continue', label: 'Продолжить', icon: '▸', disabled: !hasSave, accent: 'emerald' },
    { id: 'new', label: 'Новая игра', icon: '▶', accent: 'cyan' },
    { id: 'settings', label: 'Настройки', icon: '⚙', accent: 'amber' },
    { id: 'about', label: 'Об авторе', icon: '◈', accent: 'magenta' },
  ];
}

export function getAccentColors(accent?: string, isSelected?: boolean): MenuAccentColors {
  switch (accent) {
    case 'cyan':
      return {
        border: isSelected ? 'border-cyan-400/70' : 'border-cyan-500/30',
        borderHover: 'hover:border-cyan-400/80',
        bg: isSelected ? 'bg-cyan-900/40' : 'bg-cyan-950/30',
        bgHover: 'hover:bg-cyan-900/50',
        text: isSelected ? 'text-cyan-100' : 'text-cyan-300/90',
        textHover: 'hover:text-cyan-100',
        glow: isSelected
          ? '0 0 20px rgba(0, 255, 255, 0.15), inset 0 0 15px rgba(0, 255, 255, 0.08)'
          : '0 0 8px rgba(0, 255, 255, 0.1)',
        glowHover: 'inset 0 0 30px rgba(0, 255, 255, 0.2), 0 0 25px rgba(0, 255, 255, 0.15)',
        scanColor: 'rgba(0, 255, 255, 0.08)',
      };
    case 'emerald':
      return {
        border: isSelected ? 'border-emerald-400/70' : 'border-emerald-500/25',
        borderHover: 'hover:border-emerald-400/50',
        bg: isSelected ? 'bg-emerald-900/30' : 'bg-emerald-950/20',
        bgHover: 'hover:bg-emerald-900/30',
        text: isSelected ? 'text-emerald-100' : 'text-emerald-300/80',
        textHover: 'hover:text-emerald-100',
        glow: isSelected
          ? '0 0 15px rgba(52, 211, 153, 0.12), inset 0 0 10px rgba(52, 211, 153, 0.06)'
          : 'none',
        glowHover: 'inset 0 0 20px rgba(52, 211, 153, 0.1), 0 0 15px rgba(52, 211, 153, 0.08)',
        scanColor: 'rgba(52, 211, 153, 0.06)',
      };
    case 'amber':
      return {
        border: isSelected ? 'border-amber-400/60' : 'border-amber-500/25',
        borderHover: 'hover:border-amber-400/50',
        bg: isSelected ? 'bg-amber-900/25' : 'bg-amber-950/15',
        bgHover: 'hover:bg-amber-900/25',
        text: isSelected ? 'text-amber-100' : 'text-amber-300/70',
        textHover: 'hover:text-amber-100',
        glow: isSelected
          ? '0 0 15px rgba(251, 191, 36, 0.1), inset 0 0 10px rgba(251, 191, 36, 0.05)'
          : 'none',
        glowHover: 'inset 0 0 20px rgba(251, 191, 36, 0.1), 0 0 15px rgba(251, 191, 36, 0.08)',
        scanColor: 'rgba(251, 191, 36, 0.06)',
      };
    case 'magenta':
      return {
        border: isSelected ? 'border-fuchsia-400/60' : 'border-fuchsia-500/25',
        borderHover: 'hover:border-fuchsia-400/50',
        bg: isSelected ? 'bg-fuchsia-900/20' : 'bg-fuchsia-950/15',
        bgHover: 'hover:bg-fuchsia-900/25',
        text: isSelected ? 'text-fuchsia-100' : 'text-fuchsia-300/70',
        textHover: 'hover:text-fuchsia-100',
        glow: isSelected
          ? '0 0 15px rgba(217, 70, 239, 0.1), inset 0 0 10px rgba(217, 70, 239, 0.05)'
          : 'none',
        glowHover: 'inset 0 0 20px rgba(217, 70, 239, 0.1), 0 0 15px rgba(217, 70, 239, 0.08)',
        scanColor: 'rgba(217, 70, 239, 0.06)',
      };
    default:
      return {
        border: 'border-cyan-500/30',
        borderHover: 'hover:border-cyan-400/80',
        bg: 'bg-cyan-950/30',
        bgHover: 'hover:bg-cyan-900/50',
        text: 'text-cyan-300/90',
        textHover: 'hover:text-cyan-100',
        glow: 'none',
        glowHover: 'inset 0 0 30px rgba(0, 255, 255, 0.2), 0 0 25px rgba(0, 255, 255, 0.15)',
        scanColor: 'rgba(0, 255, 255, 0.08)',
      };
  }
}

export function getAccentBarColor(accent?: string): string {
  switch (accent) {
    case 'cyan':
      return 'rgba(0, 255, 255, 0.8)';
    case 'emerald':
      return 'rgba(52, 211, 153, 0.8)';
    case 'amber':
      return 'rgba(251, 191, 36, 0.8)';
    case 'magenta':
      return 'rgba(217, 70, 239, 0.8)';
    default:
      return 'rgba(0, 255, 255, 0.8)';
  }
}

/** Session 8 — filmic title-card menu items (no neon card / hex / terminal chrome). */
export function getFilmicMenuItemClass(isSelected: boolean, isDisabled: boolean): string {
  const base =
    'cinematic-menu-item w-full px-4 py-3 font-serif text-base transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-300/50 focus-visible:outline-offset-2';
  if (isDisabled) {
    return `${base} cinematic-menu-item--muted opacity-35 cursor-not-allowed`;
  }
  if (isSelected) {
    return `${base} cinematic-menu-item--selected cursor-pointer`;
  }
  return `${base} cursor-pointer`;
}

export function parseMenuSavePreview(): MenuSavePreview | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const validation = validateSaveData(raw);
    if (!validation.success) return null;

    const data = validation.data;
    const ps = data.playerState;
    const expl = data.exploration;
    const sceneName = expl?.currentSceneId
      ? SCENE_LABELS[expl.currentSceneId] ?? expl.currentSceneId
      : '';

    return {
      level: ps.progression.level,
      sceneName,
      poemsCollected: data.collectedPoems.length,
      poemsTotal: POEMS.length,
    };
  } catch {
    return null;
  }
}

export function safePlayMenuSfx(
  play: (name: 'confirm' | 'click' | 'ui_open' | 'ui_close') => void,
  name: 'confirm' | 'click' | 'ui_open' | 'ui_close',
): void {
  try {
    play(name);
  } catch {
    // AudioEngine may be unavailable in tests or restricted contexts.
  }
}
