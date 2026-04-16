// ============================================
// SCENE MANAGER — Управление сценами
// ============================================
// Управляет переходами между сценами,
// визуальными свойствами (CSS-градиенты, оверлеи),
// эмиссией событий при входе/выходе из сцены.

import { eventBus } from './EventBus';
import type { SceneId } from '@/data/types';

// ============================================
// ТИПЫ
// ============================================

export type ScenePhotoBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'darken' | 'lighten';

/** Фон из `public/scenes/{id}.webp` (генерация: `npm run scenes:download`) */
const scenePhoto = (id: SceneId) => `/scenes/${id}.webp`;

export interface SceneVisualConfig {
  id: SceneId;
  name: string;
  description: string;
  /** CSS gradient for background */
  background: string;
  /** Путь к webp/jpg под десктоп (горизонталь); опционально */
  photoUrl?: string;
  /** Портрет / узкий экран; если нет — используется photoUrl */
  mobilePhotoUrl?: string;
  /** 0–1, по умолчанию ~0.55 */
  photoOpacity?: number;
  /** Режим смешивания с градиентом */
  photoBlendMode?: ScenePhotoBlendMode;
  /** Overlay CSS class */
  overlay?: string;
  /** Ambient color tint (hex) */
  ambientColor: string;
  /** Music key (for future audio system) */
  musicKey?: string;
  /** CSS animation class for atmosphere */
  atmosphereAnimation?: string;
  /** Additional CSS classes */
  extraClasses?: string;
}

// ============================================
// СЦЕНОВЫЕ КОНФИГИ — ВИЗУАЛЬНЫЕ СВОЙСТВА
// ============================================

export const SCENE_VISUALS: Record<SceneId, SceneVisualConfig> = {
  kitchen_night: {
    id: 'kitchen_night',
    name: 'Кухня, ночь',
    description: 'Тёмная кухня, холодный свет из окна, пар от чая',
    photoUrl: scenePhoto('kitchen_night'),
    background:
      'linear-gradient(180deg, #020308 0%, #060b14 32%, #0c1220 68%, #05080f 100%)',
    overlay: 'bg-gradient-to-t from-cyan-950/25 via-blue-950/20 to-transparent',
    ambientColor: '#1e3a5f',
    musicKey: 'ambient_night',
    atmosphereAnimation: 'animate-pulse-slow',
    extraClasses:
      'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_20%_28%,rgba(0,255,200,0.06),transparent_55%),radial-gradient(ellipse_at_80%_85%,rgba(255,100,80,0.04),transparent_50%)]',
  },
  kitchen_dawn: {
    id: 'kitchen_dawn',
    name: 'Кухня, рассвет',
    description: 'Тёплый оранжево-розовый рассвет, утренний свет',
    photoUrl: scenePhoto('kitchen_dawn'),
    background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 30%, #4a2040 60%, #8b4025 100%)',
    overlay: 'bg-gradient-to-t from-orange-950/30 to-purple-900/20',
    ambientColor: '#ff8c42',
    musicKey: 'ambient_dawn',
  },
  home_morning: {
    id: 'home_morning',
    name: 'Дом, утро',
    description: 'Мягкий тёплый свет, уют',
    photoUrl: scenePhoto('home_morning'),
    background: 'linear-gradient(180deg, #1a1510 0%, #2a2015 40%, #3a2a1a 100%)',
    overlay: 'bg-gradient-to-t from-amber-950/20 to-transparent',
    ambientColor: '#f5d0a0',
    musicKey: 'ambient_home',
  },
  home_evening: {
    id: 'home_evening',
    name: 'Дом, вечер',
    description: 'Тусклый янтарный свет от лампы',
    photoUrl: scenePhoto('home_evening'),
    background: 'linear-gradient(180deg, #0d0a05 0%, #1a1208 40%, #2a1a0a 100%)',
    overlay: 'bg-gradient-to-t from-amber-900/30 to-transparent',
    ambientColor: '#d4940a',
    musicKey: 'ambient_evening',
    atmosphereAnimation: 'animate-pulse-slow',
    extraClasses: 'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_70%,rgba(212,148,10,0.06),transparent_60%)]',
  },
  office_morning: {
    id: 'office_morning',
    name: 'Офис, утро',
    description: 'Резкий флуоресцентный бело-голубой свет, клинический',
    photoUrl: scenePhoto('office_morning'),
    background:
      'linear-gradient(180deg, #030508 0%, #0a1018 38%, #101a28 72%, #060a10 100%)',
    overlay: 'bg-gradient-to-t from-slate-900/35 to-cyan-900/15',
    ambientColor: '#94a3b8',
    musicKey: 'ambient_office',
    extraClasses: 'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_20%,rgba(148,163,184,0.05),transparent_60%)]',
  },
  server_room: {
    id: 'server_room',
    name: 'Серверная',
    description: 'Темнота с зелёным/янтарным свечением терминалов',
    photoUrl: scenePhoto('server_room'),
    background:
      'linear-gradient(180deg, #010302 0%, #051008 42%, #020805 78%, #030a06 100%)',
    overlay: 'bg-gradient-to-t from-emerald-950/45 via-cyan-950/10 to-transparent',
    ambientColor: '#22c55e',
    musicKey: 'ambient_server',
    atmosphereAnimation: 'animate-terminal-glow',
    extraClasses: 'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_30%_50%,rgba(34,197,94,0.08),transparent_50%)]',
  },
  rooftop_night: {
    id: 'rooftop_night',
    name: 'Крыша, ночь',
    description: 'Глубокий тёмно-синий, огни города внизу, звёзды',
    photoUrl: scenePhoto('rooftop_night'),
    background:
      'linear-gradient(180deg, #010207 0%, #050a18 28%, #0a1228 58%, #060912 100%)',
    overlay: 'bg-gradient-to-t from-orange-950/15 via-slate-900/25 to-transparent',
    ambientColor: '#3b82f6',
    musicKey: 'ambient_rooftop',
    extraClasses:
      'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,255,200,0.06),transparent_48%),radial-gradient(ellipse_at_50%_100%,rgba(255,120,40,0.05),transparent_45%)]',
  },
  dream: {
    id: 'dream',
    name: 'Мир сна',
    description: 'Пурпурно-чёрный водоворот, неземной',
    photoUrl: scenePhoto('dream'),
    background: 'linear-gradient(180deg, #0a0015 0%, #1a0030 30%, #2a0045 60%, #0a0015 100%)',
    overlay: 'bg-gradient-to-t from-purple-950/40 to-transparent',
    ambientColor: '#a855f7',
    musicKey: 'ambient_dream',
    atmosphereAnimation: 'animate-dream-swirl',
    extraClasses: 'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_50%,rgba(168,85,247,0.1),transparent_60%)]',
  },
  battle: {
    id: 'battle',
    name: 'Битва',
    description: 'Красно-чёрный, напряжённый',
    photoUrl: scenePhoto('battle'),
    background: 'linear-gradient(180deg, #0a0000 0%, #1a0505 40%, #2a0a0a 100%)',
    overlay: 'bg-gradient-to-t from-red-950/40 to-transparent',
    ambientColor: '#ef4444',
    musicKey: 'ambient_battle',
    atmosphereAnimation: 'animate-pulse-fast',
  },
  street_winter: {
    id: 'street_winter',
    name: 'Зимняя улица',
    description: 'Холодный серо-голубой, снег',
    photoUrl: scenePhoto('street_winter'),
    background: 'linear-gradient(180deg, #1a2030 0%, #2a3040 40%, #3a4050 100%)',
    overlay: 'bg-gradient-to-t from-slate-800/30 to-transparent',
    ambientColor: '#94a3b8',
    musicKey: 'ambient_winter',
  },
  street_night: {
    id: 'street_night',
    name: 'Улица, ночь',
    description: 'Темнота с оранжевыми лужами света от фонарей',
    photoUrl: scenePhoto('street_night'),
    background:
      'linear-gradient(180deg, #020308 0%, #060a12 45%, #0a101c 85%, #05070e 100%)',
    overlay: 'bg-gradient-to-t from-fuchsia-950/10 via-slate-900/22 to-transparent',
    ambientColor: '#f59e0b',
    musicKey: 'ambient_street',
    extraClasses: 'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_30%_80%,rgba(245,158,11,0.06),transparent_40%)] before:bg-[radial-gradient(ellipse_at_70%_70%,rgba(245,158,11,0.04),transparent_40%)]',
  },
  cafe_evening: {
    id: 'cafe_evening',
    name: 'Кафе "Синяя Яма"',
    description: 'Тёплый янтарный свет, мягкие тени, интимность',
    photoUrl: scenePhoto('cafe_evening'),
    background: 'linear-gradient(180deg, #0d0a05 0%, #1a1208 40%, #2a1a0a 100%)',
    overlay: 'bg-gradient-to-t from-amber-950/30 to-orange-950/10',
    ambientColor: '#d97706',
    musicKey: 'ambient_cafe',
    extraClasses: 'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_50%,rgba(217,119,6,0.06),transparent_60%)]',
  },
  gallery_opening: {
    id: 'gallery_opening',
    name: 'Галерея, вернисаж',
    description: 'Яркий белый свет с цветными акцентами',
    photoUrl: scenePhoto('gallery_opening'),
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 40%, #2a2a2a 100%)',
    overlay: 'bg-gradient-to-t from-neutral-900/20 to-transparent',
    ambientColor: '#ffffff',
    musicKey: 'ambient_gallery',
  },
  underground_club: {
    id: 'underground_club',
    name: 'Подземный клуб',
    description: 'Красно-пурпурный неон, темнота',
    photoUrl: scenePhoto('underground_club'),
    background:
      'linear-gradient(180deg, #050002 0%, #120510 38%, #200818 72%, #080004 100%)',
    overlay: 'bg-gradient-to-t from-fuchsia-950/38 via-cyan-950/8 to-transparent',
    ambientColor: '#c026d3',
    musicKey: 'ambient_club',
    atmosphereAnimation: 'animate-neon-pulse',
  },
  old_library: {
    id: 'old_library',
    name: 'Старая библиотека',
    description: 'Тёплый коричневый, пыльное золотистое освещение',
    photoUrl: scenePhoto('old_library'),
    background: 'linear-gradient(180deg, #0d0a05 0%, #1a1208 40%, #251a0a 100%)',
    overlay: 'bg-gradient-to-t from-yellow-950/20 to-transparent',
    ambientColor: '#b8860b',
    musicKey: 'ambient_library',
  },
  abandoned_factory: {
    id: 'abandoned_factory',
    name: 'Заброшенный завод',
    description: 'Холодный индустриальный серый',
    photoUrl: scenePhoto('abandoned_factory'),
    background: 'linear-gradient(180deg, #0a0a0a 0%, #151515 40%, #1f1f1f 100%)',
    overlay: 'bg-gradient-to-t from-neutral-900/30 to-transparent',
    ambientColor: '#737373',
    musicKey: 'ambient_factory',
  },
  psychologist_office: {
    id: 'psychologist_office',
    name: 'Кабинет психолога',
    description: 'Мягкий нейтральный, успокаивающий',
    photoUrl: scenePhoto('psychologist_office'),
    background: 'linear-gradient(180deg, #0d0f0a 0%, #1a1f15 40%, #252a1f 100%)',
    overlay: 'bg-gradient-to-t from-emerald-950/20 to-transparent',
    ambientColor: '#86efac',
    musicKey: 'ambient_calm',
  },
  train_station: {
    id: 'train_station',
    name: 'Вокзал',
    description: 'Серо-белый, размытие движения',
    photoUrl: scenePhoto('train_station'),
    background: 'linear-gradient(180deg, #0a0a0f 0%, #15151f 40%, #1f1f2f 100%)',
    overlay: 'bg-gradient-to-t from-slate-900/20 to-transparent',
    ambientColor: '#cbd5e1',
    musicKey: 'ambient_station',
  },
  memorial_park: {
    id: 'memorial_park',
    name: 'Мемориальный парк',
    description: 'Зелёно-серый, осень',
    photoUrl: scenePhoto('memorial_park'),
    background: 'linear-gradient(180deg, #050a05 0%, #0a150a 40%, #0f1a0f 100%)',
    overlay: 'bg-gradient-to-t from-emerald-950/30 to-transparent',
    ambientColor: '#4ade80',
    musicKey: 'ambient_park',
  },
  library: {
    id: 'library',
    name: 'Библиотека',
    description: 'Тёплый коричневый, запах книг',
    photoUrl: scenePhoto('library'),
    background: 'linear-gradient(180deg, #0d0a05 0%, #1a1208 40%, #251a0a 100%)',
    overlay: 'bg-gradient-to-t from-yellow-950/20 to-transparent',
    ambientColor: '#b8860b',
    musicKey: 'ambient_library',
  },
  blue_pit: {
    id: 'blue_pit',
    name: 'Синяя яма',
    description: 'Глубокий сине-чёрный, подводный',
    photoUrl: scenePhoto('blue_pit'),
    background:
      'linear-gradient(180deg, #000208 0%, #000c1a 40%, #001428 75%, #000510 100%)',
    overlay: 'bg-gradient-to-t from-blue-950/55 via-cyan-950/12 to-transparent',
    ambientColor: '#1d4ed8',
    musicKey: 'ambient_underwater',
    atmosphereAnimation: 'animate-pulse-slow',
    extraClasses: 'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_80%,rgba(29,78,216,0.08),transparent_60%)]',
  },
};

// ============================================
// SCENE MANAGER CLASS
// ============================================

class SceneManagerClass {
  private currentSceneId: SceneId = 'kitchen_night';
  private previousSceneId: SceneId | null = null;

  /** Get the current scene ID */
  getCurrentSceneId(): SceneId {
    return this.currentSceneId;
  }

  /** Get the previous scene ID */
  getPreviousSceneId(): SceneId | null {
    return this.previousSceneId;
  }

  /** Get visual config for a scene */
  getSceneConfig(sceneId?: SceneId): SceneVisualConfig {
    const id = sceneId || this.currentSceneId;
    return SCENE_VISUALS[id] || SCENE_VISUALS.kitchen_night;
  }

  /** Get the current scene config */
  getCurrentSceneConfig(): SceneVisualConfig {
    return this.getSceneConfig(this.currentSceneId);
  }

  /** Transition to a new scene */
  transitionTo(sceneId: SceneId): void {
    if (sceneId === this.currentSceneId) return;

    const oldSceneId = this.currentSceneId;
    this.previousSceneId = oldSceneId;
    this.currentSceneId = sceneId;

    // Emit events
    eventBus.emit('scene:exit', { sceneId: oldSceneId, toSceneId: sceneId });
    eventBus.emit('scene:enter', { sceneId, fromSceneId: oldSceneId });
  }

  /** Get all available scenes */
  getAllScenes(): SceneVisualConfig[] {
    return Object.values(SCENE_VISUALS);
  }
}

// Singleton instance
export const sceneManager = new SceneManagerClass();
