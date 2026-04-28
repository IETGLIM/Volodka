# Карта визуальных референсов → канон проекта

Сопоставляет пожелания по атмосфере (MatrixRain, hacking, IT support, poems, dark fantasy, cyberpunk-adjacent, gothic, комикс-нуар, Psychonauts-adjacent, GTA-tempo, duty support, bank, авторский материал, glitch, noir) с **уже принятой иерархией** в [narrative-style-bible.md](./narrative-style-bible.md) и визуальной правдой в [ART_BIBLE.md](./ART_BIBLE.md).

**Правило:** один жанр или один референс на сцену/экран — достаточно; не смешивать пять отсылок в одном абзаце или одном UI-кадре. Без имён чужих IP и без «лора другой вселенной».

## Таблица: референс → слой → где в продукте

| Референс (ваш список) | Канонический слой (style bible) | Где проявляется (UI / 3D / текст) |
| --------------------- | -------------------------------- | --------------------------------- |
| **DutySupport / IT support** | Ядро A — техподдержка, тикеты, честный жаргон в меру | Тексты `STORY_NODES`, квесты; терминальный слой диалога (VN-ветка в `DialogueRenderer` — токены `--game-ui-terminal-*`); офисный обход `office_morning` |
| **Bank** | Ядро A — банковский инцидент как давление | Сюжет и квесты; не обязательно отдельный «банковский» UI-скин — давление через формулировки и темп |
| **AuthorMaterial / Poems** | Ядро B — стихи, черновик, уязвимость | `PoetryBook`, мини-игры стиха, карточки выбора `--game-ui-story-poem-*` в `StoryRenderer` / `CyberChoiceCard` |
| **MatrixRain** | Презентационный: поток логов / смена, не пародия фильма | `MiniMatrixRain` в [src/app/GameClient.tsx](../src/app/GameClient.tsx) (лоадер); `MatrixRainScreenMesh` в 3D-комнате; **не** на каждой панели |
| **Hacking** | Презентационный + ядро A (инструменты) | Миниигры / оверлеи (например wire-hack), алерты; визуально согласовать с cyan-терминалом и постом «кибер»-сцен |
| **Glitch** | Метафора смен и сбоев, UI-слой | `game-panel-cyber-glitch`, VHS-слой в CSS; `ItGlitchPulseOverlay`; шкала `VisualState.glitchIntensity` в типах — не дублировать конкурирующими полноэкранными эффектами |
| **Noir** | Презентационный: холод света, усталость | Диалог **в обходе** (`explorationLayout`): `presentation="noir"`, `visualVariant="noir"`, токены `--game-ui-noir-*` в [src/ui/game/DialogueRenderer.tsx](../src/ui/game/DialogueRenderer.tsx) |
| **CyberPunk2077** (adj.) | Режим сцены: «неон в голове после смены» | Пост кибер-грейда (`EXPLORATION_CYBER_GRADE_SCENE_IDS`), неон/ Bloom на экранах; **не** отдельный кибер-лор |
| **Gothic / DarkPhantasy** | Style bible §9: зима, подъезд, тяжесть памяти; без драконов в офисе | Улица/зима (`street_winter`), интерьеры тише; IBL `apartment` / `warehouse`; тексты — метафора, не фэнтези-мир |
| **WolfAmongUs** (adj.) | Диалог — крупный план **смысла**, без комикс-IP | Крупные реплики, варианты выбора; визуально noir-ветка обходного диалога **не копирует** Fable |
| **Psychonauts2** (adj.) | Режим сна: сюр с якорем в страхе/памяти | `dream`, фиолетовый слой `--game-ui-story-dream-*`; пост и копирайт экономно |
| **GTA** (adj.) | Улица / ночь — темп и «пустота кадра» | Обход `district`, `street_night`; не стилистика криминального симулятора в UI |
| **MatrixRain + Hacking + Glitch** вместе | Один акцент на экран | Лоадер или одна сцена с мониторами — не наслаивать три полноэкранных шума |

## Связь с токенами и чеклистами

- Токены панелей и диалога: [ui-skin-tokens.md](./ui-skin-tokens.md), источник — [src/app/globals.css](../src/app/globals.css).
- Пост обхода и ART: [exploration-postfx-art-checklist.md](./exploration-postfx-art-checklist.md).
- Приоритизированный бэклог по экранам и сценам: [visual-ui-aaa-audit-backlog.md](./visual-ui-aaa-audit-backlog.md).

## Формулировка цели на Vercel

Цель релиза — **сильный браузерный нарративный вертикальный слайс** с согласованным UI и постом, а не заявление о ритейл-AAA «как у консольного boxed title». Ограничения: GPU мобильных клиентов, размер статики, отсутствие полного E2E в CI — см. [volodka-aaa-expert-audit-2026-04-25.md](./volodka-aaa-expert-audit-2026-04-25.md).
