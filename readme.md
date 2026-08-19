# ВОЛОДЬКА — киберпанк-сказка между сменами

> Браузерная 3D RPG на русском языке про уставшего инженера, постсоветский киберпанк и стихи, которые меняют реальность.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## О проекте

**ВОЛОДЬКА** — сюжетная web RPG на React, Vite и Three.js. Игра работает прямо в браузере: 3D-исследование, диалоги, квесты, пошаговый бой, стелс, Кабинет Мыслей, dice-roll проверки и поэтическая магия собраны в единый нарративный слой.

Стихи в игре — **авторское произведение Владимира Лебедева** (правообладатель проекта). Они являются частью сюжета и не редактируются контрибьюторами.

## Что уже есть

- **27 режиссированных 3D-локаций**: комната Володьки, коридор, кафе, офис, библиотека, завод, подвал, пирс, ночной город, крыша, лес ЧК и другие сцены.
- **7 актов, эпилог и 6+ концовок**: все сюжетные ветки возвращаются к финальной линии и продолжают последствия выбора.
- **~100 квестов**: основная линия, побочные, скрытые, ежедневные миссии и линия «ЧК · ТОЛПА» (плотный playtime ~10–40 h; 120 h — целевая фабрика, не текущий shipped объём).
- **Стелс и бой**: патрули, конусы зрения, погоня, побег, turn-based combat, комбо, баффы, дебаффы и разные типы врагов.
- **Поэтическая магия**: стихи работают как боевые способности и world effects, например «Путеводная Звезда» сужает зрение врагов.
- **Кабинет Мыслей**: внутренние голоса в духе Disco Elysium, взаимоисключающие идеи и модификаторы к проверкам навыков.
- **Физический мир**: Rapier KCC, коллайдеры сцен, дверные ниши, пинаемые банки и ящики с процедурным звуком.
- **AA visual direction (free stack)**: HDRI/IBL, selective MeshPhysical wet/CRT accents, Poly Haven/Quaternius/Kenney, Bloom, ACES, quality-tier degrade — см. `docs/AA_QUALITY_ROADMAP.md`.

## Технологии

| Стек | |
|---|---|
| Фреймворк | React 19 + Vite 6 |
| 3D | Three.js 0.172 + React Three Fiber 9 |
| Физика | Rapier 2.2, Kinematic Character Controller |
| Пост-обработка | `@react-three/postprocessing` |
| Состояние | Zustand 5 + Zod-валидация сейвов |
| UI | Tailwind CSS 4 + shadcn/ui + Radix UI |
| Анимации | Framer Motion 12 |
| Аудио | Web Audio API, процедурная музыка и SFX |
| Деплой | Vercel SPA |

Карта систем: [ARCHITECTURE.md](./ARCHITECTURE.md). AA quality roadmap: [docs/AA_QUALITY_ROADMAP.md](./docs/AA_QUALITY_ROADMAP.md). История изменений: [CHANGELOG.md](./CHANGELOG.md). Контекст для AI-агентов: [AI_SESSION_CONTEXT.md](./AI_SESSION_CONTEXT.md).

## Быстрый старт

```bash
npm install
npm run dev          # Vite dev server
npm run typecheck    # TypeScript без emit
npm run test:unit    # Vitest unit/component
npm run check        # lint + typecheck + content + assets + build + deploy verify
npm run build        # production build в dist/
```

Dev-сервер Vite по умолчанию поднимается на `localhost:3000`.

## Asset Pipeline

Production build сам готовит ассеты через `assets:prepare`: bootstrap базовых GLB, загрузка Poly Haven моделей, обработка catalog assets, синхронизация shipped flags и валидация.

```bash
npm run assets:bootstrap         # CC0 fallback GLB для первого запуска/deploy
npm run assets:polyhaven-models  # Poly Haven GLTF + textures из manifest
npm run assets:process-catalog   # обработка catalog assets
npm run assets:sync-shipped      # синхронизация shipped flags
npm run assets:validate          # GLB/GLTF gate
npm run assets:status            # сводка pipeline и пропусков
```

Источники ассетов:

- `public/models/` — shipped GLB/GLTF, персонажи, NPC, интерьеры, props, Poly Haven модели.
- `public/hdri/`, `public/textures/polyhaven/`, `public/menu/` — HDRI, PBR surfaces и cinematic menu plate.
- `assets-source/ai3dgen/` — staging для AI3DGen Pro, Kenney, Poly Pizza и ручных CC0 импортов.
- `assets-source/mixamo/` и `assets-source/animations/` — ручные/ретаргетнутые анимации.

Полные правила и лицензии: [public/models/ATTRIBUTION.md](./public/models/ATTRIBUTION.md), [ATTRIBUTION.md](./ATTRIBUTION.md), [assets-source/ai3dgen/README.md](./assets-source/ai3dgen/README.md).

## Качество и визуальный бар

Текущая версия пакета: **4.4.2** (`package.json` / `APP_VERSION`).

- `npm run lint` — ESLint для `src`.
- `npm run typecheck` — TypeScript gate.
- `npm run validate:content` — квесты, история, стихи, golden path.
- `npm run assets:validate` — проверка shipped GLB/GLTF.
- `npm run budgets` — bundle budgets после production build.
- `npm run test:e2e` — production build + Playwright smoke.

Пресеты качества:

| Пресет | DPR | PostFX | Тени | GLB strategy | Назначение |
|--------|-----|--------|------|--------------|------------|
| `low` | 0.75-1 | off | off | Draco/fallback | слабые устройства |
| `medium` | 1-1.25 | on | on | hybrid | базовый desktop |
| `high` | 1-1.75 | on | on | hybrid/PBR | целевой polished режим |
| `ultra` | 1.25-2 | on | on | meshopt/GLB | максимальная картинка |
| `auto` | runtime | runtime | runtime | GPU/battery probe | безопасный default |

`auto` сохраняет выбранный tier в сессии (`autoQualitySession`). При давлении на GPU `adaptiveQualityBridge` и `applyGfxPressureToPreset` снижают нагрузку без потери сейвов и критичного gameplay.

После визуальных, lighting, material, HUD, transition, cutscene или asset изменений запускайте независимую проверку `.cursor/agents/aaa-visual-judge.md`. Судья намеренно строгий: AAA parity важнее оценки «хорошо для браузера».

## Vercel Deploy

`vercel.json` настроен для SPA: фреймворк Vite, команда сборки `npm run build:vercel`
(vite build + `prune-deploy-assets`), вывод в `dist/`, install через `npm install`, SPA
rewrite `(.*) → /index.html`.

Команда `build:vercel` обязательна для деплоя: `vite build` копирует весь `public/`
(~480 МБ моделей, текстур, HDRI) в `dist/`, а `prune-deploy-assets` убирает
неподключённые ассеты (−184 МБ → ~309 МБ итог). Использование plain `vite build`
даёт негабаритный бандл и ломает деплой.

Rapier WASM (`/rapier/rapier_wasm3d_bg.wasm`, ~1.5 МБ) закоммичен в `public/` —
раньше runtime HEAD-probe возвращал 404 и физика падала на inline base64
(+2 МБ в HTML, +1.5 с таймаута на каждой загрузке).

```bash
npm run build:vercel   # production build в dist/ + prune
```

Перед promotion проверьте preview: New Game, загрузка 3D-сцен, отсутствие 404 на
`.glb`, `.gltf`, `.bin`, `.jpg`, `.hdr`, `.wasm`.

Environment variables:

| Variable | Значение |
|----------|----------|
| `VITE_SITE_URL` | Canonical URL и OG preview, например `https://volodka.vercel.app` |

## Управление

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
| F3 | Панель разработчика в dev |

---

*С любовью, от тех, кто верит в слова.*

