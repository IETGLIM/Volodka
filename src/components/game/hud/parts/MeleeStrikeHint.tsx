/* ─── Volodka RPG – HUD-подсказка «враг в зоне опережающего удара» ───
 *                                                              (v4.11.0)
 *
 * Стеклянная янтарная капсула над нижним HUD-стеком: «⚔ {враг} — удар (ЛКМ)».
 * Показывается, когда реал-тайм слой (meleeStrike.ts) видит живую цель
 * в зоне замаха. Поллинг 150 мс — рендер только при смене состояния
 * (паттерн StaminaBar: никаких подписок на кадр).
 *
 * «tired» — цель есть, но выносливости меньше цены замаха: капсула тускнеет
 * и подпись меняется на «не хватает выносливости» — честный show-don't-tell.
 *
 * «finishable» (v4.8.8) — цель ослаблена до порога добивания (≤35% HP
 * после побега игрока, creepVitality.ts): капсула перекрашивается в
 * красный, иконка меняется на череп, действие — «добить — ЛКМ».
 *
 * «backstab» (v4.11.0) — цель не осведомлена и стоит спиной (стелс-гейт
 * attemptMeleeStrike): фиолетовая капсула (в рифму с чипом «Мир Снов»),
 * иконка EyeOff, действие — «в спину — ЛКМ». Приоритет стейтов
 * finishable > backstab > обычный решается ЗДЕСЬ, в компоненте
 * (data-backstab ставится только при backstab && !finishable) — CSS
 * остаётся свободным от разрешения конфликтов состояний.
 */

import { useEffect, useRef, useState } from 'react';
import { EyeOff, Skull, Sword } from 'lucide-react';
import {
  getMeleeStrikeHint,
  MELEE_STRIKE_STAMINA_COST,
  type MeleeStrikeHint as MeleeStrikeHintData,
} from '@/engine/combat/realtime/meleeStrike';
import { getPlayerStamina } from '@/engine/player/playerStamina';
import { useTouchDevice } from '@/hooks/useTouchDevice';

const POLL_INTERVAL_MS = 150;

type HintUiState = {
  visible: boolean;
  name: string;
  tired: boolean;
  finishable: boolean;
  backstab: boolean;
};

const HIDDEN: HintUiState = {
  visible: false,
  name: '',
  tired: false,
  finishable: false,
  backstab: false,
};

export function MeleeStrikeHint() {
  const isTouch = useTouchDevice();
  const [ui, setUi] = useState<HintUiState>(HIDDEN);
  const prevRef = useRef<HintUiState>(HIDDEN);

  useEffect(() => {
    const apply = () => {
      const hint: MeleeStrikeHintData | null = getMeleeStrikeHint();
      const prev = prevRef.current;

      if (!hint) {
        if (prev.visible) {
          prevRef.current = HIDDEN;
          setUi(HIDDEN);
        }
        return;
      }

      // «tired» вычисляется в отчёте крипа, но выносливость могла
      // восстановиться после последнего отчёта — сверяем с живым снимком.
      const tiredNow = getPlayerStamina().current < MELEE_STRIKE_STAMINA_COST;
      const tired = tiredNow || hint.tired;
      // Стелс-состояние приходит готовым из отчёта крипа (двойной гейт:
      // не в погоне + задняя дуга) — здесь только приоритет стейтов.
      const backstab = hint.backstab && !hint.finishable;

      if (
        !prev.visible
        || prev.name !== hint.name
        || prev.tired !== tired
        || prev.finishable !== hint.finishable
        || prev.backstab !== backstab
      ) {
        const next: HintUiState = {
          visible: true,
          name: hint.name,
          tired,
          finishable: hint.finishable,
          backstab,
        };
        prevRef.current = next;
        setUi(next);
      }
    };

    apply();
    const timer = window.setInterval(apply, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (!ui.visible) return null;

  return (
    <div
      className="melee-strike-hint"
      data-exploration-ui
      data-testid="melee-strike-hint"
      role="status"
      aria-live="polite"
      data-tired={ui.tired ? 'true' : 'false'}
      data-finishable={ui.finishable ? 'true' : 'false'}
      data-backstab={ui.backstab ? 'true' : 'false'}
    >
      {ui.finishable ? (
        <Skull size={13} aria-hidden="true" className="melee-strike-hint__icon" />
      ) : ui.backstab ? (
        <EyeOff size={13} aria-hidden="true" className="melee-strike-hint__icon" />
      ) : (
        <Sword size={13} aria-hidden="true" className="melee-strike-hint__icon" />
      )}
      <span className="melee-strike-hint__enemy">{ui.name}</span>
      <span className="melee-strike-hint__sep" aria-hidden="true">·</span>
      {ui.tired ? (
        <span className="melee-strike-hint__action">не хватает выносливости</span>
      ) : (
        <span className="melee-strike-hint__action">
          {ui.finishable
            ? (isTouch ? 'кнопка «Удар»' : 'добить — ЛКМ')
            : ui.backstab
              ? (isTouch ? 'кнопка «Удар»' : 'в спину — ЛКМ')
              : (isTouch ? 'кнопка «Удар»' : 'удар — ЛКМ')}
        </span>
      )}
    </div>
  );
}
