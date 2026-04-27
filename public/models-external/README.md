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

Если Vercel / CI пишет **«exceeded its LFS budget»**, квота GitHub LFS исчерпана: либо [увеличить лимит в Billing](https://github.com/settings/billing), либо вынести модели из LFS (**`git lfs migrate export`**).

```bash
git lfs install
git lfs track "*.glb"
git lfs track "*.fbx"
git add .gitattributes
git push
```

---

## Файлы в этой папке (текущий минимальный набор)

- `khronos_cc0_CesiumMan.glb`, `khronos_cc0_RiggedFigure.glb`, `khronos_cc0_Fox.glb` — см. [CC0_KHRONOS_MODELS.md](./CC0_KHRONOS_MODELS.md)
- `sayuri_dans.glb`, `spartan_armour_mkv_-_halo_reach.glb` — локальные персонажные ассеты

Остальные пути в `MODEL_URLS` и в NPC указывают на эти файлы (или на CDN через `NEXT_PUBLIC_MODELS_BASE`).
