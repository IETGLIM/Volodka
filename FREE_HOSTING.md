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
