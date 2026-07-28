# ВОЛОДЬКА — киберпанк-сказка между сменами

> Интерактивная 3D RPG в память о Володьке — уставшем инженере, который искал стихи, спрятанные в коде.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 📖 О проекте

**ВОЛОДЬКА** — сюжетная 3D RPG в стиле киберпанк-нуар, целиком работающая в браузере.
История о программисте, который находит стихи, спрятанные в серверном коде, и обнаруживает,
что слова могут менять реальность.

Стихи в игре — **авторское произведение Владимира Лебедева** (правообладатель проекта).
Они неотъемлемая часть нарратива; тексты неприкосновенны для контрибьюторов.

## 🎮 Особенности

- **27 режиссированных 3D-локаций** (18 core + 9 extension) — от комнаты Володьки до ночного леса, завода и края крыши
- **7 актов сюжета** с 6+ концовками; все концовки ведут в эпилог и акты 6–7
- **55 квестов** — основная линия, побочные, скрытые, ежедневные и линия «ЧК · ТОЛПА»
- **Патрулирующие враги и стелс** — видимые конусы зрения, погоня, побег; контакт = пошаговый бой (11 типов врагов, комбо, баффы/дебаффы)
- **Поэтическая магия** — стихи дают силы в бою и меняют мир: «Путеводная Звезда» сужает зрение врагов
- **Кабинет Мыслей** — 18 внутренних голосов (как в Disco Elysium): «Внутренний Критик», «Серверный Шёпот», «Тёмный Юмор» и другие. 3 mutually exclusive пары — настоящие моральные выборы. Экипированные мысли дают модификаторы к проверкам навыков
- **Dice-roll проверки** — система 2d6 + модификатор vs DC с критическими успехами/провалами и анимированными 3D-кубиками в киберпанк-стиле
- **Глубокий нарратив** — 2100+ строк нового контента: расширенные диалоги с Альбертом (30 нод) и интерактивное исследование комнаты Володьки (28 нод с проверками навыков)
- **Физический мир** — Rapier KCC, дверные ниши, пинаемые банки/ящики с процедурным звуком
- **12+ NPC** с диалоговыми деревьями, расписаниями и отношениями
- **Крафт, торговля, дерево навыков и перков**
- **Процедурная музыка** (Web Audio, три слоя на сцену) и динамическая погода
- **AAA пост-обработка** — Bloom, ACES-тонмаппинг, цветокоррекция, стресс-реактивная виньетка; `ExplorationPostFX` с tier-aware деградацией
- **Работает на любом устройстве** — пресеты качества low→ultra с авто-детектом (GPU probe, Battery API, DPR), graceful degradation (физика KCC, postFX, сейвы)

## 🛠️ Технологии

| Стек | |
|---|---|
| **Фреймворк** | React 19 + Vite 6 |
| **3D-движок** | Three.js 0.172 + React Three Fiber 9 |
| **Физика** | Rapier 2.2 (Kinematic Character Controller, WASM) |
| **Пост-обработка** | @react-three/postprocessing 3.0 |
| **Стейт** | Zustand 5 (+ Zod-валидация сейвов) |
| **UI** | Tailwind CSS 4 + shadcn/ui + Radix UI |
| **Анимации** | Framer Motion 12 |
| **Аудио** | Web Audio API (процедурная музыка и SFX, ноль аудиофайлов) |
| **Деплой** | Vercel (SPA) |

Подробная карта систем — в [ARCHITECTURE.md](./ARCHITECTURE.md).
История изменений — в [CHANGELOG.md](./CHANGELOG.md).

## 🚀 Быстрый старт

```bash
npm install
npm run dev          # Dev-сервер на localhost:3000
npm run typecheck    # tsc --noEmit
npm run test:unit    # Vitest (unit + component)
npm run check        # Полный гейт: lint + typecheck + контент + сборка + бюджеты
npm run build        # Production-сборка в dist/
```

### Пресеты качества

| Пресет | DPR | PostFX | Тени | Сжатие GLB | NPC/среда |
|--------|-----|--------|------|------------|-----------|
| **low** | 0.75–1 | выкл | выкл | Draco | procedural |
| **medium** | 1–1.25 | вкл | вкл | Draco | hybrid |
| **high** | 1–1.75 | вкл | вкл | Draco | hybrid |
| **ultra** | 1.25–2 | вкл | вкл | meshopt | GLB |
| **auto** | эвристика | — | — | — | viewport + GPU probe + battery cap |

`auto` сохраняет разрешённый tier в сессии (`autoQualitySession`). При давлении на GPU срабатывает `applyGfxPressureToPreset` и runtime degrade через `adaptiveQualityBridge`.

### 3D-ассеты (AI3DGen)

Каталог целей: `src/config/ai3dgenAssetCatalog.ts`. Импорт OBJ/GLB с [AI3DGen](https://www.ai3dgen.com/ru/image-to-3d-model-free):

```bash
npm run assets:ai3dgen-import -- --list
npm run assets:ai3dgen-import -- --id npc_albert --file ./downloads/albert.obj
npm run assets:validate
```

Подробный цикл — в [assets-source/ai3dgen/README.md](./assets-source/ai3dgen/README.md).

### Доступность

Настройки (субтитры, скорость текста, reduced motion, дальтонизм) хранятся в `localStorage`, синхронизируются между вкладками и рассылают `accessibility:changed` через `eventBus`. Инициализация — `initAccessibilitySettings()` в `main.tsx`.

## ✅ Качество

Текущая версия пакета: **4.2.42** (`package.json` / `APP_VERSION`).

- typecheck / ESLint: 0 ошибок · unit + component tests: **1300+** · e2e smoke (Playwright, 38)
- `npm run test:unit` — Vitest (unit + component) · `npm run test:e2e` — production build + Playwright
- `npm run validate:content` — квесты, история, стихи, golden path
- Валидатор контента: квесты, история, стихи, golden path — 0 ошибок
- Бюджеты бандла в CI: boot target 450 КБ gzip (hard max 650), game-start target 1.2 МБ (hard max 1.8)
- `npm run assets:bootstrap` — CC0 GLB для первого production-деплоя · `npm run assets:validate` — гейт в build
- Security-заголовки + CSP Report-Only / Permissions-Policy (`vercel.json`)
- Versioned save migrations (`saveMigrations.ts`) before Zod validate

## 📦 Vercel Deploy

`vercel.json` настроен (SPA-rewrites, immutable-кэш `/assets/` и `/models/`, security-заголовки).

**Перед первым деплоем:**

```bash
npm run assets:bootstrap   # скачать CC0 GLB (если ещё не в репо)
npm run check              # lint + typecheck + validate + build + verify:deploy
```

**Vercel Environment Variables** (см. `.env.example`):

| Variable | Значение |
|----------|----------|
| `VITE_SITE_URL` | `https://volodka.vercel.app` — canonical + OG preview |

**Чек-лист production:**

1. `npm run check` — зелёный
2. Preview: New Game → 10 мин без 404 на `.glb`
3. Promote to Production

**Подключение:**

1. Залей репозиторий на GitHub
2. Подключи Vercel к репозиторию
3. Задай `VITE_SITE_URL` в Environment Variables
4. Vercel автоматически определит Vite и соберёт проект

## 🎯 Управление

| Клавиша | Действие |
|---|---|
| WASD | Перемещение |
| Shift | Бег |
| E | Взаимодействие |
| Пробел | Прыжок |
| Левая кнопка мыши (drag) | Вращение камеры |
| Колёсико мыши | Приближение/отдаление |
| Shift+R | Сброс камеры |
| Esc | Меню |
| I | Инвентарь |
| J | Журнал |
| Q | Квесты |
| P | Стихи |
| Shift+P | Фото-режим |
| M | Карта |
| Shift+J | Кабинет Мыслей |
| F3 | Панель разработчика (только dev) |

---

*С любовью, от тех, кто верит в слова.*

Архитектурный контекст для AI-агентов: [AI_SESSION_CONTEXT.md](./AI_SESSION_CONTEXT.md)

