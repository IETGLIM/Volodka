# Идеальный старт — Volodka RPG — ФИНАЛ

> Дата: 2026-08-06 20:30 UTC, main@bd25f80 + fresh push
> Ветки: main, arena/019fd35b-volodka, arena/019fd36e-volodka — все synced

## Что было в оригинале 8b40389

- 3 теста падали: material registry emissiveIntensity 3.0 vs 2.0 кламп, ambient NPC budget 4 vs 7
- CI check failure
- Кровать y=0.35 внутри текстуры, стоя, без анимации сидя
- Кресло -1.5 vs -1.3 — 20см клип
- Окно — 8-битная схематика, emissive 0.9
- Музыка отсутствует — AudioContext suspended
- Очки парят в воздухе в прологе
- Шкаф без книг (GLB пресет пустой)

## Что стало в bd25f80 (15h ago) и сейчас

- WASM: public/rapier/ 1.5MB external streaming, vercel.json immutable
- Тесты: 0 failures, 2082 passed, check success
- Пролог: 5 фаз boot->breath(eye subPhase)->title->handoff, единый источник, глаза со строками
- Первые 5 минут: FirstMinutesDirector + MorningSyncUrgency
- 7 багов пофикшены:
  - Кровать y 0.55 + BED_SIT_EDGE, rot 1.35 лежа, sitting на краю
  - Кресло -1.7 + CHAIR -1.15 зазор 55см
  - Окно emissive 1.8 + city view plane
  - Музыка resume + onSceneEnter
  - Очки скрыты в sleeping
  - Шкаф с книгами и для GLB

## Свежий пуш 2026-08-06 20:30 UTC — подтверждение

Все ветки запушены, CI check success.
