# Volodka AAA Expert Audit — 2026-04-25

Роль аудита: CEO + Senior R3F / React / Node.js GameDeveloper. Цель — оценить, насколько текущий `Volodka` готов к вертикальному AAA-срезу в браузере, и какие решения дают максимум качества без разрушения уже работающей RPG/VN-архитектуры.

## Executive Summary

`Volodka` уже не прототип визуальной новеллы, а гибридная RPG-оболочка на Next.js 16, React 19, Zustand, R3F, Three.js и Rapier. Сильная сторона проекта — редкая связка нарратива, 3D-обхода, квестов, расписаний NPC и технических quality gates. Риск уровня CEO: команда может переоценить зрелость 3D-слоя, если считать наличие Canvas/Rapier равным production-grade game loop. Сейчас главный фокус — не расширять контент, а закрепить один безупречный вертикальный срез: комната Володьки, корректный игрок, камера, интерактив, загрузка ассетов и регрессии.

Решение текущей итерации правильное: заменить default player на уже имеющийся GLB с понятными `Idle`/`Walk` клипами и добавить `Chair.glb` через существующий prop pipeline, не создавая отдельный путь загрузки ассетов.

## Product / CEO View

Сильная продуктовая ставка — "сказка между сменами": бытовая панелька, техподдержка, стихи, тревога и RPG-ритуалы. Это отличается от типового cyberpunk-пастиша. Для AAA-ощущения важны не размеры мира, а плотность первого помещения: читаемая мебель, стабильный персонаж, камера без борьбы с геометрией, понятная кнопка `E`, звук шагов и один короткий квестовый мотив.

P0/P1 для продукта:

- Довести `volodka_room` до demo-room качества: игрок, стол, стул, диван, дверь, свет, интерактивы, подсказки.
- Не добавлять новые большие локации до тех пор, пока комната и коридор не проходят ручной smoke без визуальных артефактов.
- Вводить ассеты только через манифесты (`propsManifest`, `modelUrls`, `npcDefinitions`) и проверяемые масштабы.

## R3F / Three / Rapier Architecture

`RPGGameCanvas` правильно держит Canvas как единую точку 3D-обхода: игрок, NPC, физика, коллайдеры, postFX, touch HUD и narrative bridge живут в одном дереве. `PhysicsPlayer` содержит реальную игровую модель: Rapier `kinematicPosition`, KCC, footstep ray, visual yaw, GLB загрузку и crossfade. Это pragmatic architecture, но файл уже является зоной повышенного риска: любое изменение модели игрока может затронуть physics capsule, animation mixer, root-motion stripping и camera feel.

Главный технический риск R3F: lifecycle GLB и Rapier идут разными каденсами. `docs/scene-streaming-spec.md` верно фиксирует, что React mount/unmount и регистрация тел Rapier расходятся минимум на кадр. Это нужно считать архитектурным законом проекта: streaming, cache release и chunk activation не должны опираться только на React state.

Рекомендации:

- Сохранять `useFrame` только для горячего пути: движение, камера, visual yaw, частицы. HUD и narrative UI не должны подписываться на крупные store-срезы.
- Для GLB сохранять текущую схему `useGLTF` + cache retain/release + манифест масштаба. Не возвращаться к runtime bbox-normalize для персонажей.
- Для будущего run-клипа игрока добавить explicit player animation mapping только после появления ассета с `Idle/Walk/Run`, иначе текущая эвристика проще и безопаснее.

## React / Zustand / Node.js

Разделение `src/ui`, `src/game`, `src/engine`, `src/state`, `src/data` стало заметно лучше после архитектурного рефактора. Zustand используется в основном как gameplay state, а тяжелые Three objects остаются в refs и компонентах. Это соответствует хорошей R3F-практике.

Node/Next слой выглядит достаточно зрелым: CI гоняет `tsc`, Vitest, lint и build; облачные сохранения выключены по умолчанию и требуют server secret. Риск: `start` использует POSIX-style `NODE_ENV=production`, что неудобно на Windows, но для Vercel/CI это не P0.

## Asset / Animation Findings

Аудит GLB в `public/models-external` показал, что лучший доступный кандидат на игрока — `lowpoly_anime_character_cyberstyle.glb`: есть skin и клипы `Armature|Idle`, `Armature|Walk`. Текущий `Volodka.glb` имеет один клип `Basic Sing Serious`, поэтому gameplay locomotion вынужденно выглядит как переиспользование одного клипа.

Ограничение выбранной модели: отдельного `Run` нет. Текущий animation planner при sprint будет использовать walk-клип. Это приемлемо для текущего вертикального среза, но не финальное AAA-решение.

`Chair.glb` находится в `public/Chair.glb` и до этой итерации не был подключен. Он корректно ложится в существующий prop pipeline через `chair_volodka`, но имеет очень малый исходный масштаб и z-up ориентацию, поэтому требует большого `baseUniform` и поворота в сцене.

## Verification Strategy

Минимальный gate для подобных изменений:

- `npx vitest run src/config/modelUrls.test.ts src/data/propsManifestCoverage.test.ts`
- `npx vitest run src/game/simulation/explorationGlbAnimation.test.ts src/data/modelMeta.test.ts src/lib/propGlbScale.integration.test.ts`
- `npm run test:character-scale`
- `npx tsc --noEmit`
- `npm run lint`

Для визуального acceptance после запуска dev server:

- Игрок в `volodka_room` загружается как `lowpoly_anime_character_cyberstyle.glb`.
- В idle проигрывается `Armature|Idle`, при WASD — `Armature|Walk`.
- Стул виден рядом со столом, не пробивает пол и не перекрывает интерактив у стола.
- Камера не ныряет в ноги игрока и не ловит z-fighting на мебели.

## Priority Backlog

P0:

- Закрепить default player GLB и тест на путь.
- Подключить `Chair.glb` только через `propsManifest` + `PropModel`.
- Сохранить `CHANGELOG.md` и targeted tests.

P1:

- Добавить финальный player GLB с `Idle/Walk/Run`, единым rig scale и лицензией.
- Вынести explicit player animation map, если ассет перестанет соответствовать простым именам клипов.
- Добавить визуальный smoke для `volodka_room` после старта dev server.

P2:

- Завести asset budget report: GLB size, mesh count, texture estimate, animation count.
- Довести streaming v0.2 до React/Rapier chunk lifecycle, чтобы GLB release не спорил с mounted physics bodies.
