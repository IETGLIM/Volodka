# QA Matrix — Acts 1–3 (Golden Path)

Manual + dev-panel spot-check matrix. Run with F3 DevPanel, narrative jump, and quest cheats.

**Legend:** Trigger = primary objective type; Reward = key payout; Next = `linkedStoryNodeId` or golden-path successor.

## Act 1 — Пробуждение

| Quest ID | Title | Trigger | Reward (summary) | Next node / gate |
|----------|-------|---------|------------------|------------------|
| `first_reading` | Первое чтение | poem_1 + flag `read_poem_1` | writing +2, karma +5, XP 50 | `fix_success` |
| `maria_connection` | Связь с Викторией | NPC maria + chip + poem | relation, karma | `maria_curious` |
| `incident_scroll_4729` | Инцидент #4729 | office + alexander + code | XP, items | `start_diagnosis` → `fix_success` |
| `vault_backup_trial` | Испытание Хранилища | terminal minigame + vault access | poem, XP | vault chain |
| `poetry_collection` | Сбор стихов | 6× poem_collected | bulk XP/karma | `volodka_inner` |
| `night_shift_mystery` | Ночная смена | flags + logs + dmitry | XP, lore | act1 side |
| `alberts_lesson` | Урок Альберта | albert dialogue + riddle | skills, karma | albert arc |

## Act 2 — Подполье

| Quest ID | Title | Trigger | Reward (summary) | Next node / gate |
|----------|-------|---------|------------------|------------------|
| `network_initiation` | Посвящение в Сеть | maria + hacking minigame + oath | network key, act 2 | `act2_network_oath` |
| `dmitry_defection` | Дезертирство Дмитрия | office_colleague chain | karma, escape | colleague line |
| `vault_key_fragments` | Осколки ключа | 3× item + assemble | vault progress | `act2_vault_revealed` |
| `cafe_safehouse` | Убежище в кафе | barista + albert + terminal | safehouse flag | `act2_safehouse_terminal` |
| `poetry_smuggling` | Контрабанда стихов | library → park → rooftop → cafe | poems, karma | smuggling chain |

## Act 3 — Конфликт

| Quest ID | Title | Trigger | Reward (summary) | Next node / gate |
|----------|-------|---------|------------------|------------------|
| `zarema_rescue` | Спасение Заремы | arrest → infiltration → free | karma, relation | `act3_save_zarema` |
| `vault_defense` | Оборона Хранилища | alert → rally → firewall → hold | XP, items | guild counter |
| `maria_truth` | Правда о Виктории | records → barista → confront | revelation flags | `act3_maria_truth_accepted` |

## Scripted walkthrough (minimum)

1. **Act 1:** New Game → skip intro (E2E bridge) → `first_reading` active → collect poem_1 path → save slot 1.
2. **Act 2:** DevPanel jump to `act2_transition` → activate `network_initiation` → complete hacking objective.
3. **Act 3:** Jump to `act3_transition` → `zarema_rescue` flags via story nodes → verify no soft-lock on `act3_decision_point`.

## Automation

| Check | Command |
|-------|---------|
| Content integrity | `npm run validate` (0 errors) |
| Golden path Act 1 E2E | `npx playwright test e2e/golden-path-act1.spec.ts` |
| Full E2E suite | `npm run test:e2e` |

## Known warnings (non-blocking)

- 3 quests: `questGiverNpcId` differs from story NPC alias (validator warning only).
- Golden-path derived spine 75 vs manual 76 — add `choice.goldenPath` markers over time.
