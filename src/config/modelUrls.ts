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

/** Перенос legacy-путей `/models/…` на актуальный `BASE_URL` (или оставить http(s) как есть). */
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

export const MODEL_URLS = {
  // Главный персонаж
  volodka: `${BASE_URL}/Volodka.glb`,
  
  // NPC модели (аниме стиль)
  smolAme: `${BASE_URL}/smol_ame_in_an_upcycled_terrarium_hololiveen.glb`,
  lillian: `${BASE_URL}/lillian__vgdc.glb`,
  witchApprentice: `${BASE_URL}/witchapprentice.glb`,
  missGalaxy: `${BASE_URL}/miss_galaxy.glb`,
  onAQuest: `${BASE_URL}/on_a_quest.glb`,
  sayuriDans: `${BASE_URL}/sayuri_dans.glb`,
  lowpolyCyberstyle: `${BASE_URL}/lowpoly_anime_character_cyberstyle.glb`,
  luoliRun: `${BASE_URL}/luoli_run.glb`,
  alleyana: `${BASE_URL}/alleyana.glb`,
  bladeSoul: `${BASE_URL}/blade__soul_kung_fu_sword_stick.glb`,
  annie: `${BASE_URL}/free_annie_anime_gerl_-_without_clothes.glb`,
  burntrap: `${BASE_URL}/burntrap_hd_-_fnaf_security_breach.glb`,
  shibahu: `${BASE_URL}/shibahu.glb`,
  /** @deprecated Используйте `lowpolyAnimeCyber` для NPC с idle/walk. */
  cyberpunkChar: `${BASE_URL}/lowpoly_anime_character_cyberstyle.glb`,
  darkLantern: `${BASE_URL}/witchapprentice.glb`,
  calvin: `${BASE_URL}/calvin_freckle_mcmurray_from_lackadaisy.glb`,
  collegeGirl: `${BASE_URL}/college_girl.glb`,
  cyberpunkFemale: `${BASE_URL}/cyberpunk_female_full-body_character.glb`,
  antoniGaudi: `${BASE_URL}/on_a_quest.glb`,
  destinyBust: `${BASE_URL}/destiny_2_character_bust.glb`,
  toonCat: `${BASE_URL}/toon_cat_free.glb`,
  spartanArmour: `${BASE_URL}/spartan_armour_mkv_-_halo_reach.glb`,
  crimsonLaceConfidence: `${BASE_URL}/alleyana.glb`,
  crimsonLaceHallway: `${BASE_URL}/miss_galaxy.glb`,
  
  // Окружение
  blackhole: `${BASE_URL}/blackhole.glb`,
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
  return MODEL_URLS.volodka;
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
