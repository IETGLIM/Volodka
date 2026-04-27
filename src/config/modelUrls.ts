// ============================================
// КОНФИГУРАЦИЯ ВНЕШНИХ URL ДЛЯ 3D МОДЕЛЕЙ
// ============================================
// По умолчанию — `public/models-external` (единая папка для GLB в репо).
// Переопределение: `NEXT_PUBLIC_MODELS_BASE` (например `/models` или CDN URL без завершающего `/`).

/**
 * Публичный префикс для GLB (без завершающего `/`).
 * Старые пути в данных вида `/models/foo.glb` переписываются через `rewriteLegacyModelPath`.
 */
export function getModelsPublicBase(): string {
  const env =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MODELS_BASE != null
      ? String(process.env.NEXT_PUBLIC_MODELS_BASE).trim()
      : '';
  if (env) return env.replace(/\/$/, '');
  return '/models-external';
}

const BASE_URL = getModelsPublicBase();

/**
 * Перенос legacy-путей `/models/…` на актуальный `BASE_URL` (или оставить http(s) как есть).
 * Не добавляйте cache-bust query (`?v=…`) к URL для GLB — иначе кэш загрузчика не стабилен и возможно мерцание.
 */
export function rewriteLegacyModelPath(path: string): string {
  if (!path || typeof path !== 'string') return path;
  const t = path.trim();
  if (t.startsWith('/models/')) {
    const rest = t.slice('/models/'.length);
    return `${BASE_URL}/${rest}`;
  }
  return t;
}

// Для GitHub Releases: задайте NEXT_PUBLIC_MODELS_BASE=https://github.com/.../download/tag
// Для Cloudflare R2: NEXT_PUBLIC_MODELS_BASE=https://pub-xxx.r2.dev/models

// ============================================
// СПИСОК МОДЕЛЕЙ
// ============================================

/** Имя файла эталона игрока (папка — `getModelsPublicBase()`, по умолчанию `public/models-external`). */
export const DEFAULT_PLAYER_GLB_FILENAME = 'khronos_cc0_CesiumMan.glb' as const;

export const MODEL_URLS = {
  /**
   * Главный персонаж-архивный Volodka. Оставлен как ассет, но не default: в файле один клип.
   * Визуальный uniform задаётся в `modelMeta` (`resolveCharacterMeshUniformScale`), не через bbox в рантайме.
   */
  volodka: `${BASE_URL}/Volodka.glb`,
  
  // NPC модели (аниме стиль)
  smolAme: `${BASE_URL}/khronos_cc0_Fox.glb`,
  lillian: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,
  witchApprentice: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,
  missGalaxy: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,
  onAQuest: `${BASE_URL}/khronos_cc0_CesiumMan.glb`,
  sayuriDans: `${BASE_URL}/sayuri_dans.glb`,
  /** Базовый humanoid (Khronos `CesiumMan`, glTF-Sample-Models). */
  lowpolyCyberstyle: `${BASE_URL}/${DEFAULT_PLAYER_GLB_FILENAME}`,
  luoliRun: `${BASE_URL}/khronos_cc0_CesiumMan.glb`,
  alleyana: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,
  bladeSoul: `${BASE_URL}/khronos_cc0_CesiumMan.glb`,
  annie: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,
  burntrap: `${BASE_URL}/khronos_cc0_Fox.glb`,
  shibahu: `${BASE_URL}/khronos_cc0_Fox.glb`,
  /** @deprecated Используйте `lowpolyAnimeCyber` для NPC с idle/walk. */
  cyberpunkChar: `${BASE_URL}/${DEFAULT_PLAYER_GLB_FILENAME}`,
  darkLantern: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,
  calvin: `${BASE_URL}/khronos_cc0_CesiumMan.glb`,
  collegeGirl: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,
  cyberpunkFemale: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,
  antoniGaudi: `${BASE_URL}/khronos_cc0_CesiumMan.glb`,
  destinyBust: `${BASE_URL}/khronos_cc0_CesiumMan.glb`,
  toonCat: `${BASE_URL}/khronos_cc0_Fox.glb`,
  spartanArmour: `${BASE_URL}/spartan_armour_mkv_-_halo_reach.glb`,
  crimsonLaceConfidence: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,
  crimsonLaceHallway: `${BASE_URL}/khronos_cc0_RiggedFigure.glb`,

  // Окружение: legacy `blackhole.glb` вынесен из репо — ключ оставлен для совместимости, URL указывает на лёгкий CC0-ассет в `models-external`.
  blackhole: `${BASE_URL}/khronos_cc0_Fox.glb`,

  /**
   * Бесплатные эталоны **Khronos glTF-Sample-Assets** (CC0 1.0) — см. `public/models-external/CC0_KHRONOS_MODELS.md`.
   * Не персонажи: проп / тест (PBR, morph + анимация); масштаб при необходимости — вручную на примитиве или в DCC.
   */
  cc0KhronosBoxVertexColors: `${BASE_URL}/khronos_cc0_BoxVertexColors.glb`,
  cc0KhronosAnimatedMorphCube: `${BASE_URL}/khronos_cc0_AnimatedMorphCube.glb`,
  cc0KhronosNormalTangentTest: `${BASE_URL}/khronos_cc0_NormalTangentTest.glb`,
  /** Ретро-бумбокс (Microsoft, CC0) — уместен как «железо» на столе в комнате. */
  cc0KhronosBoomBox: `${BASE_URL}/khronos_cc0_BoomBox.glb`,
} as const;

/** Проверка пути к GLB игрока: абсолютный путь приложения или http(s) URL. */
export function isValidPlayerGlbPath(p: string | undefined): p is string {
  if (!p || typeof p !== 'string') return false;
  const t = p.trim();
  if (!t || t === 'undefined' || t === '/undefined') return false;
  if (!/\.glb$/i.test(t)) return false;
  if (t.startsWith('/')) return true;
  return /^https?:\/\//i.test(t);
}

/**
 * Fallback-модель игрока при невалидном `modelPath`.
 * Переопределение: переменная окружения `NEXT_PUBLIC_DEFAULT_PLAYER_MODEL`
 * (например `/models/alternate.glb` или полный URL на `.glb`).
 */
export function getDefaultPlayerModelPath(): string {
  const fromEnv =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEFAULT_PLAYER_MODEL?.trim() : undefined;
  if (fromEnv && isValidPlayerGlbPath(fromEnv)) return rewriteLegacyModelPath(fromEnv);
  return MODEL_URLS.lowpolyCyberstyle;
}

// ============================================
// ИНСТРУКЦИЯ ПО ЗАГРУЗКЕ НА GITHUB RELEASES
// ============================================
/*
1. Создайте репозиторий на GitHub (если ещё нет)

2. Создайте .gitattributes в корне проекта:
   *.glb filter=lfs diff=lfs merge=lfs -text
   *.fbx filter=lfs diff=lfs merge=lfs -text

3. Установите Git LFS:
   git lfs install

4. Добавьте модели:
   git lfs track "*.glb"
   git lfs track "*.fbx"
   git add .gitattributes
   git add public/models/
   git commit -m "Add 3D models via LFS"
   git push

5. Создайте Release:
   - Go to Releases -> Draft a new release
   - Tag: VolodkaModel
   - Title: "3D Models Pack"
   - Прикрепите models.zip с архивом моделей

6. Обновите BASE_URL в этом файле:
   const BASE_URL = 'https://github.com/IETGLIM/Volodka/releases/download/VolodkaModel';

БЕСПЛАТНО НАВЕСГДА:
- GitHub LFS: 1GB storage + 1GB bandwidth/месяц
- GitHub Releases: до 2GB на файл
*/

export default MODEL_URLS;
