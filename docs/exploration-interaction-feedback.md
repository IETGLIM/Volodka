# Обход: контур отклика E (`ui:interaction_feedback`)

## Событие

Полезная нагрузка: `kind: 'success' | 'fail' | 'hint_clear'`, `timestamp`, опционально `actionId`.

- **success / fail** — из `emitInteractionFeedback` в `RPGGameCanvas` (лут, реестр, триггер, объект, NPC, пустое E).
- **hint_clear** — сброс подсветки кнопки E / хинта без звука (`useInteractionAnticipation`).

## Подписчики

| Модуль | Роль |
|--------|------|
| `InteractionFeedbackListener` | `ui_success` / `ui_fail`, дедуп по `actionId`, короткий `ui:effect_notif` |
| `explorationCameraShake` | микро-тряска камеры |
| `InteractionHintListener` | синхронизация с HUD / моб. FAB |

Генератор: `src/lib/interactionFeedback.ts` (только success/fail; hint_clear шлётся отдельно по шине).
