# UI skin tokens (волна 2)

Единый набор CSS-переменных и композитных классов для игровых панелей и диалогов. Источник правды в [`src/app/globals.css`](../src/app/globals.css) (`:root` и блоки `.game-panel-skin--*`).

## Переменные (`--game-ui-*`)

| Переменная | Назначение |
|------------|------------|
| `--game-ui-rgb-cyan`, `--game-ui-rgb-cyan-pure` | Базовый акцент (бордеры, полоски glitch-слоя) |
| `--game-ui-border`, `--game-ui-border-medium`, `--game-ui-border-subtle`, `--game-ui-border-briefing` | Прозрачность бордера под контекст |
| `--game-ui-bg-floating`, `--game-ui-bg-journal`, `--game-ui-bg-inventory`, `--game-ui-bg-poetry` | Линейные градиенты фона модальных / плавающих панелей |
| `--game-ui-shadow-*` | Тени неона / глубины для каждого типа оболочки |
| `--game-ui-glow-mood`, `--game-ui-glow-creativity`, `--game-ui-glow-stability`, `--game-ui-glow-esteem` | Свечение полос статов в HUD (совпадают с прежними rgba) |
| `--game-ui-terminal-*` | Терминальный режим диалога (не обход): внешнее свечение рамки, имя NPC, текст реплики |
| `--game-ui-dialogue-choice-glow`, `--game-ui-dialogue-indicator-glow` | Hover и индикатор вариантов ответа (cyber) |
| `--game-ui-noir-choice-glow`, `--game-ui-noir-indicator-glow` | То же для варианта `noir` в обходе |
| `--game-ui-holo-portrait-glow` | Портрет NPC в голографическом режиме |
| `--game-ui-story-*` | Карточки выбора в `StoryRenderer` (dream / poem / cyan): бордеры, hover, индикатор, sweep |

Аудио SFX (мультипликаторы к базовой громкости в `AudioEngine.playSfx`): `--audio-sfx-master`, `--audio-sfx-ui`, `--audio-sfx-footstep`, `--audio-sfx-world` в `globals.css`.

## Композитные классы

Используются вместе с `game-panel` и обычно с `game-panel-cyber-glitch` (лёгкий VHS-слой через `::before`).

| Класс | Где используется |
|-------|------------------|
| `game-panel-skin--floating` | Плавающая панель квестов (`QuestsPanel`) |
| `game-panel-skin--journal` | Журнал выборов (`JournalPanel`) |
| `game-panel-skin--inventory` | Инвентарь |
| `game-panel-skin--poetry` | Книга стихов |
| `game-panel-skin--briefing` | Брифинг обхода (`ExplorationBriefingOverlay`) |

Связка с нарративом: [narrative-style-bible.md](./narrative-style-bible.md) (режимы сцены). Визуальная палитра ART: [ART_BIBLE.md](./ART_BIBLE.md).

## Forced colors

В `prefers-forced-colors: active` у `game-panel-skin--*` фон и бордер сбрасываются на системные `Canvas` / `CanvasText`, декоративные тени отключаются (как у `.game-panel`).
