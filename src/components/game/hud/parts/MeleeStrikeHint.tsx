/* ─── Volodka RPG – HUD-подсказка «враг в зоне опережающего удара» ───
 *                                                              (v4.8.7)
 *
 * Стеклянная янтарная капсула над нижним HUD-стеком: «⚔ {враг} — удар (ЛКМ)».
 * Показывается, когда реал-тайм слой (meleeStrike.ts) видит живую цель
 * в зоне замаха. Поллинг 150 мс — рендер только при смене состояния
 * (паттерн StaminaBar: никаких подписок на кадр).
 *
 * «tired» — цель есть, но выносливости меньше цены замаха: капсула тускнеет
 * и подпись меняется на «не хватает выносливости» — честный show-don't-tell.
 */

import { useEffect, useRef, useState } from 'react';
import { Sword } from 'lucide-react';
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
};

const HIDDEN: HintUiState = { visible: false, name: '', tired: false };

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

      if (!prev.visible || prev.name !== hint.name || prev.tired !== tired) {
        const next: HintUiState = { visible: true, name: hint.name, tired };
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
    >
      <Sword size={13} aria-hidden="true" className="melee-strike-hint__icon" />
      <span className="melee-strike-hint__enemy">{ui.name}</span>
      <span className="melee-strike-hint__sep" aria-hidden="true">·</span>
      {ui.tired ? (
        <span className="melee-strike-hint__action">не хватает выносливости</span>
      ) : (
        <span className="melee-strike-hint__action">
          {isTouch ? 'кнопка «Удар»' : 'удар — ЛКМ'}
        </span>
      )}
    </div>
  );
}
