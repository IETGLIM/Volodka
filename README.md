# ВОЛОДЬКА

**3D web RPG** в браузере (свободный обход, **Rapier**, **React Three Fiber**, стриминг GLB, квесты и диалоги): Уфа, зима, техподдержка, стихи, сны. Сюжетный слой с текстом и выборами остаётся частью игры, но **основной playable-вектор — трёхмерный обход и физика**, а не «картинка + кнопки». Стек: **Next.js**, **React**, **Three.js / R3F**, **Zustand**, **Tailwind**, **Framer Motion**.

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Скрипт `**dev**` явно запускает **Turbopack** (`next dev --turbo`).

## Сборка

Фоны сцен лежат в репозитории в **`public/scenes/`** (отдельный шаг скачивания перед сборкой не нужен). Сборка по умолчанию идёт через **Turbopack** (`next build --turbo`); при необходимости отладки webpack используйте локально `npx next build --webpack`.

```bash
npm run build
npm test
```

**Деплой (Vercel):** если в консоли браузера **«Refused to apply style … MIME type text/plain»** для `/_next/static/...css`, проверьте, что в `vercel.json` **нет** глобального `X-Content-Type-Options: nosniff` на все пути `/(.*)` — иначе при любом сбое `Content-Type` у чанка стили не применятся. В репозитории `nosniff` задаётся только для `/` и `/api/*`.

Предупреждение **`KHR_materials_pbrSpecularGlossiness`** у `GLTFLoader` на части старых GLB — ожидаемо в Three.js r182 (расширение снято из ядра); материалы обычно дают разумный fallback. Убрать шум можно конвертацией моделей в metallic-roughness в DCC/`gltf-transform`.

**Деплой (Vercel и аналоги):** для прохождения игры в браузере **не обязательны** переменные LLM, Blob-загрузки моделей и облачного сейва. Прогресс по умолчанию в **localStorage**. Опционально: `ENABLE_AI_DIALOGUE_API=1` (иначе `/api/ai-dialogue` отдаёт локальный fallback), облако — пункт «Облачные сохранения» ниже, загрузка GLB — `ENABLE_MODEL_UPLOAD_API` и секреты из `src/app/api/models/upload/route.ts`.

## Инженерия, CI и безопасность (аудит 2026)

- **GitHub Actions**: workflow `**.github/workflows/ci.yml`** на push/PR в `main` / `master`: `**npm ci**` → `**npx tsc --noEmit**` → `**npm test**` (Vitest) → `**npm run test:player-animations**` → `**npm run asset-budget**` → `**npm run lint**` → `**npm run build**`.
- **Ручной smoke (Browserbase):** `**.github/workflows/volodka-smoke.yml**` — только ручной запуск (`workflow_dispatch`); в обычный CI не входит. См. `**docs/volodka-room-smoke.md**`.
- **TypeScript**: в `**next.config.ts`** снято `**typescript.ignoreBuildErrors**` — ошибки типов снова **блокируют** `next build`.
- **React**: включён `**reactStrictMode: true`** — в development возможны двойные эффекты; так ловятся утечки подписок и гонки в R3F.
- **Облачные сохранения** (`/api/save`): по умолчанию API отвечает **403** с кодом `CLOUD_SAVE_DISABLED`. Включение только при `**ENABLE_CLOUD_GAME_SAVE=1`**, `**DATABASE_URL**` (Prisma) и секрете `**SAVE_API_SECRET**` на сервере; каждый запрос — с `**Authorization: Bearer <SAVE_API_SECRET>**`. Идентификатор строки в БД задаётся `**SAVE_USER_ID**` (без доверия к `userId` из тела или query). Клиентский прогресс по-прежнему в **localStorage** через стор.
  - **Где задавать `DATABASE_URL` и секреты:** в проде и на превью — только в панели **Vercel → Project → Settings → Environment Variables** (для секретов включите **Sensitive**). Не версионируйте реальные строки подключения в репозитории. Локально для Prisma/`next dev` можно использовать **`.env.local`**: каталог игнорируется git’ом (в **`.gitignore`** есть **`.env*.local`**), но сами значения всё равно не должны оказаться в коммите из‑за ошибки (не добавляйте `.env.local` вручную в `git add -f` и не дублируйте секреты в чат/PR).
- **Черновик сюжета**: файл `**src/data/storyNodesExpansion.ts`** не смержен в `**STORY_NODES**` — не опирайтесь на узлы из него, пока явно не перенесены в `**storyNodes.ts**`.

## Что недавно появилось в проекте

Полный список изменений — **[CHANGELOG.md](./CHANGELOG.md)** (`[Unreleased]` и релизы). Краткий срез рабочей ветки — **[worklog.md](./worklog.md)**.

- **Нарратив и UI:** один playable-слой обхода; оверлей сюжета по `currentNode` и `storyNodeShowsStoryOverlay` — `docs/ADR-single-exploration-narrative-layer.md`. Золотой путь и тесты: `src/data/goldenPath.ts`, `goldenPath.test.ts`.
- **3D:** старт `home_evening`; игрок — `getDefaultPlayerModelPath()` / `modelUrls.ts` (CC0 по умолчанию в `public/models-external/`, env `NEXT_PUBLIC_DEFAULT_PLAYER_MODEL`). Rapier KCC, NPC с явными клипами, триггеры зон, квестовые маркеры, радиальное меню **E**, миникарта, LRU `gltfModelCache.ts`, камера/орбита без конфликта с `data-exploration-ui`.
- **Комната Володьки (`volodka_room`):** lightmap-слоты, merged shell, emissive-мониторы + Bloom — см. CHANGELOG [Unreleased].
- **Сюжетный фон:** `AsciiCyberBackdrop`; webp в `public/scenes/` опциональны для прохождения.
