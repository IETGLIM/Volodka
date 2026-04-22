# 3D Models Hosting

**Каноничная папка в этом репозитории:** `public/models-external` — пути в данных вида `/models/*.glb` автоматически перенаправляются сюда (см. `getModelsPublicBase` / `rewriteLegacyModelPath` в `src/config/modelUrls.ts`). Для CDN задайте `NEXT_PUBLIC_MODELS_BASE`.

**Бесплатные CC0 (Khronos):** файлы `khronos_cc0_*.glb` и описание лицензий — в **[CC0_KHRONOS_MODELS.md](./CC0_KHRONOS_MODELS.md)**.

---

## Бесплатные варианты хранения моделей:

### Вариант 1: GitHub Releases (рекомендуется)
1. Создайте релиз на GitHub
2. Загрузите модели как assets (до 2GB)
3. Используйте прямые ссылки:
   https://github.com/USERNAME/volodka/releases/download/v1.0/model.glb

### Вариант 2: Sketchfab (бесплатно навсегда)
1. Загрузите модели на sketchfab.com
2. Получите embed или прямую ссылку
3. Бесплатный план: до 10 загрузок/месяц

### Вариант 3: Google Drive + публичная ссылка
1. Загрузите в Google Drive
2. Сделайте публичным
3. Используйте ссылку вида:
   https://drive.google.com/uc?export=download&id=FILE_ID

### Вариант 4: GitHub LFS (квота хранилища и трафика)

Если Vercel / CI пишет **«exceeded its LFS budget»**, квота GitHub LFS исчерпана: либо [увеличить лимит в Billing](https://github.com/settings/billing), либо вынести модели из LFS (**`git lfs migrate export`**) — см. **`FREE_HOSTING.md`**.

```bash
git lfs install
git lfs track "*.glb"
git lfs track "*.fbx"
git add .gitattributes
git push
```

---

## Список моделей в проекте:

-rwxr-xr-x 1 z z 2.0M Apr  3 16:39 /home/z/my-project/public/models/KnightCharacter.fbx
-rwxr-xr-x 1 z z 4.9M Mar 31 20:14 /home/z/my-project/public/models/Volodka.glb
-rwxr-xr-x 1 z z  11M Mar 31 17:09 /home/z/my-project/public/models/alleyana.glb
-rwxr-xr-x 1 z z  17M Mar 31 17:09 /home/z/my-project/public/models/antoni_gaudi.glb
-rwxr-xr-x 1 z z 8.4M Mar 31 17:09 /home/z/my-project/public/models/blackhole.glb
-rwxr-xr-x 1 z z 4.9M Mar 31 17:09 /home/z/my-project/public/models/blade__soul_kung_fu_sword_stick.glb
-rwxr-xr-x 1 z z  21M Mar 31 17:09 /home/z/my-project/public/models/burntrap_hd_-_fnaf_security_breach.glb
-rwxr-xr-x 1 z z 5.4M Mar 31 17:09 /home/z/my-project/public/models/calvin_freckle_mcmurray_from_lackadaisy.glb
-rwxr-xr-x 1 z z  16M Mar 31 17:09 /home/z/my-project/public/models/college_girl.glb
-rwxr-xr-x 1 z z 8.9M Mar 31 17:09 /home/z/my-project/public/models/crimson_lace_confidence.glb
-rwxr-xr-x 1 z z 7.8M Mar 31 17:09 /home/z/my-project/public/models/crimson_lace_in_the_hallway.glb
-rwxr-xr-x 1 z z 7.4M Mar 31 17:09 /home/z/my-project/public/models/cyberpunk_character.glb
-rwxr-xr-x 1 z z 6.1M Mar 31 17:09 /home/z/my-project/public/models/cyberpunk_female_full-body_character.glb
-rwxr-xr-x 1 z z  43M Mar 31 17:09 /home/z/my-project/public/models/dark_lantern_huntress.glb
-rwxr-xr-x 1 z z 5.6M Mar 31 17:09 /home/z/my-project/public/models/destiny_2_character_bust.glb
-rwxr-xr-x 1 z z 5.3M Mar 31 17:09 /home/z/my-project/public/models/free_annie_anime_gerl_-_without_clothes.glb
-rwxr-xr-x 1 z z 5.8M Mar 31 17:09 /home/z/my-project/public/models/lillian__vgdc.glb
-rwxr-xr-x 1 z z 5.2M Mar 31 17:09 /home/z/my-project/public/models/lowpoly_anime_character_cyberstyle.glb
-rwxr-xr-x 1 z z 5.1M Mar 31 17:09 /home/z/my-project/public/models/luoli_run.glb
-rwxr-xr-x 1 z z 3.4M Mar 31 17:09 /home/z/my-project/public/models/miss_galaxy.glb
-rwxr-xr-x 1 z z 3.5M Mar 31 17:09 /home/z/my-project/public/models/on_a_quest.glb
-rwxr-xr-x 1 z z  19M Mar 31 17:09 /home/z/my-project/public/models/sayuri_dans.glb
-rwxr-xr-x 1 z z  16M Mar 31 17:09 /home/z/my-project/public/models/shibahu.glb
-rwxr-xr-x 1 z z 3.9M Mar 31 17:09 /home/z/my-project/public/models/smol_ame_in_an_upcycled_terrarium_hololiveen.glb
-rwxr-xr-x 1 z z  32M Mar 31 17:09 /home/z/my-project/public/models/spartan_armour_mkv_-_halo_reach.glb
-rwxr-xr-x 1 z z 201K Mar 31 17:09 /home/z/my-project/public/models/toon_cat_free.glb
-rwxr-xr-x 1 z z 2.4M Mar 31 17:09 /home/z/my-project/public/models/witchapprentice.glb
