// ============================================
// КОНФИГУРАЦИЯ ВНЕШНИХ URL ДЛЯ 3D МОДЕЛЕЙ
// ============================================
// После загрузки моделей на GitHub Releases, замените BASE_URL на свой

// Базовый URL для моделей (замените на свой GitHub Release URL)
const BASE_URL = '/models'; // Локально - используется /public/models/

// Для GitHub Releases раскомментируйте и замените:
// const BASE_URL = 'https://github.com/USERNAME/volodka/releases/download/v1.0-models';

// Для Cloudflare R2 / D1:
// const BASE_URL = 'https://pub-xxx.r2.dev/models';

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
  cyberpunkChar: `${BASE_URL}/cyberpunk_character.glb`,
  darkLantern: `${BASE_URL}/dark_lantern_huntress.glb`,
  calvin: `${BASE_URL}/calvin_freckle_mcmurray_from_lackadaisy.glb`,
  collegeGirl: `${BASE_URL}/college_girl.glb`,
  cyberpunkFemale: `${BASE_URL}/cyberpunk_female_full-body_character.glb`,
  antoniGaudi: `${BASE_URL}/antoni_gaudi.glb`,
  destinyBust: `${BASE_URL}/destiny_2_character_bust.glb`,
  toonCat: `${BASE_URL}/toon_cat_free.glb`,
  spartanArmour: `${BASE_URL}/spartan_armour_mkv_-_halo_reach.glb`,
  crimsonLaceConfidence: `${BASE_URL}/crimson_lace_confidence.glb`,
  crimsonLaceHallway: `${BASE_URL}/crimson_lace_in_the_hallway.glb`,
  
  // Окружение
  blackhole: `${BASE_URL}/blackhole.glb`,
} as const;

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
   - Tag: v1.0-models
   - Title: "3D Models Pack"
   - Прикрепите models.zip с архивом моделей

6. Обновите BASE_URL в этом файле:
   const BASE_URL = 'https://github.com/YOUR_USERNAME/volodka/releases/download/v1.0-models';

БЕСПЛАТНО НАВЕСГДА:
- GitHub LFS: 1GB storage + 1GB bandwidth/месяц
- GitHub Releases: до 2GB на файл
*/

export default MODEL_URLS;
