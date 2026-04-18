# 🎮 ВОЛОДЬКА — Бесплатный хостинг навсегда

> Мемориальная 3D RPG игра в память о Владимире Лебедеве (1992-2026)

---

## 📦 Бесплатные платформы (навсегда)

### 1. Сайт → Vercel (бесплатно)
```
https://vercel.com
```
- Деплой из GitHub
- Автоматический SSL
- Бесплатно для личных проектов
- Лимит: 100GB bandwidth/месяц

### 2. 3D Модели → GitHub Releases (бесплатно)
```
https://github.com/YOUR_USERNAME/volodka/releases
```
- До 2GB на файл
- Прямые ссылки навсегда
- Бесплатно без ограничений

### 3. Альтернатива для моделей → Sketchfab
```
https://sketchfab.com
```
- Бесплатный план
- Embed в сайт
- До 10 загрузок/месяц

---

## 🚀 Инструкция по развёртыванию

### Шаг 1: GitHub

```bash
# 1. Создайте репозиторий на GitHub
# 2. Загрузите код

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/volodka.git
git push -u origin main
```

### Шаг 2: Модели через Git LFS

```bash
# Установите Git LFS
git lfs install

# Настройте отслеживание
git lfs track "*.glb"
git lfs track "*.fbx"

# Добавьте .gitattributes
git add .gitattributes
git commit -m "Enable Git LFS for 3D models"

# Загрузите модели
git add public/models/
git commit -m "Add 3D models"
git push
```

### Шаг 3: Vercel

1. Зайдите на https://vercel.com
2. "Import Project" → выберите GitHub репозиторий
3. Нажмите "Deploy"
4. Готово! Сайт будет жить по адресу:
   `https://volodka.vercel.app`

### Ошибка деплоя: «This repository exceeded its LFS budget»

Vercel при клонировании подтягивает **Git LFS**. У GitHub у бесплатного/дешёвого плана ограничены **хранилище и месячный трафик** LFS; тяжёлые `*.glb` в `public/models-external/` быстро расходуют квоту, после чего любой `git lfs pull` / клон с smudge падает.

**Вариант A — увеличить квоту (самый простой):** [GitHub → Settings → Billing](https://github.com/settings/billing) → **Git LFS Data** / пакеты данных.

**Вариант B — убрать LFS из истории (без ежемесячного LFS-трафика на клон):** один раз переписать коммиты так, чтобы `*.glb` / `*.fbx` / `*.zip` хранились как обычные Git-blob’ы, а не как LFS-указатели. Делайте только с полным бэкапом и после согласования с теми, у кого есть локальные ветки.

```bash
git lfs install
# Убедитесь, что все LFS-файлы скачаны локально (в каталоге реальные .glb, не 130-байтные указатели)
git lfs pull

# Переписать всю историю: вынести перечисленные типы из LFS в обычный Git
git lfs migrate export --include="*.glb,*.fbx,*.zip" --everything

# Проверить .gitattributes — строки filter=lfs для этих масок должны исчезнуть
git status
git push --force-with-lease origin main
```

После **`migrate export`** размер репозитория на GitHub вырастет (зато Vercel и CI клонируют без LFS). При необходимости вручную поправьте **`.gitattributes`**, если там остались лишние правила LFS.

**Вариант C — не полагаться на LFS в репозитории:** держать архив моделей в **GitHub Releases** или на CDN и скачивать их скриптом на этапе `build` (аналогично фонам в `scripts/download-scene-backgrounds.mjs`).

---

## ⚙️ Конфигурация внешних моделей

Если модели не влезают в GitHub LFS (лимит 1GB), используйте GitHub Releases:

```bash
# 1. Создайте архив моделей
cd public/models && zip -r models.zip *.glb *.fbx

# 2. Загрузите на GitHub:
#    Releases → Draft new release → Attach models.zip

# 3. Обновите src/config/modelUrls.ts:
const BASE_URL = 'https://github.com/YOUR_USERNAME/volodka/releases/download/v1.0-models';
```

---

## 🌐 Альтернативы (полностью бесплатные)

### Cloudflare Pages
```
https://pages.cloudflare.com
```
- Неограниченный bandwidth
- Бесплатно навсегда
- Деплой из GitHub

### Netlify
```
https://netlify.com
```
- 100GB bandwidth/месяц
- Бесплатно для личных проектов

---

## 📁 Структура проекта

```
volodka/
├── src/
│   ├── app/           # Next.js страницы
│   ├── components/    # React компоненты
│   ├── data/          # Данные игры (NPC, квесты, стихи)
│   ├── config/        # Конфигурация (включая URL моделей)
│   └── store/         # Zustand state
├── public/
│   ├── models/        # 3D модели (.glb, .fbx)
│   └── textures/      # Текстуры
└── FREE_HOSTING.md    # Этот файл
```

---

## 💾 Резервное копирование

Для вечного хранения рекомендую:
1. **Archive.org** — загрузите архив проекта
2. **GitHub** — основное хранилище кода
3. **Google Drive** — персональный бэкап

---

## 📜 Лицензия

Проект создан в память о Владимире Лебедеве.
Стихи — авторское право Владимира Лебедева.

---

*Создано с любовью, чтобы память жила вечно.* 💜
