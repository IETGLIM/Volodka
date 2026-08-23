import { Sword, Shield, Sparkles, LogOut, ChevronDown } from 'lucide-react';
import { COMBAT_BUTTON_HINTS } from '@/engine/combat/combatGamepadMap';
import type { getAvailableCombatPowers } from '@/engine/CombatSystem';
import { CombatTouchControls } from '@/components/game/CombatTouchControls';
import { PoemPowersSubmenu } from '@/components/game/combatUi/CombatPoemPowers';
import { TerminalButton } from '@/components/game/combatUi/CombatActionChrome';

type CombatPower = ReturnType<typeof getAvailableCombatPowers>[number];

type CombatActionBarProps = {
  isTouchDevice: boolean;
  isPlayerTurn: boolean;
  pendingAction: boolean;
  isSilenced: boolean;
  showPowers: boolean;
  availablePowers: CombatPower[];
  gamepadConnected: boolean;
  gamepadSelectedIdx: number;
  /** Russian name of the special the enemy is CHARGING (telegraph) —
   *  drives the defend-button counter-window hint + highlight. */
  enemyChargingName?: string | null;
  onAttack: () => void;
  onDefend: () => void;
  onFlee: () => void;
  onTogglePowers: () => void;
  onSelectPower: (poemId: string) => void;
  onPoemSwipe: (dir: number) => void;
};

export function CombatActionBar({
  isTouchDevice,
  isPlayerTurn,
  pendingAction,
  isSilenced,
  showPowers,
  availablePowers,
  gamepadConnected,
  gamepadSelectedIdx,
  enemyChargingName,
  onAttack,
  onDefend,
  onFlee,
  onTogglePowers,
  onSelectPower,
  onPoemSwipe,
}: CombatActionBarProps) {
  const actionsDisabled = !isPlayerTurn || pendingAction;
  const poemDisabled = availablePowers.length === 0 || isSilenced;
  // Counter-window tooltip: defending against a CHARGED special cuts its
  // damage hard (extra ×0.4 — see computeSpecialIncomingDamage).
  const defendTooltip = enemyChargingName
    ? `Враг готовит «${enemyChargingName}»! Защита в этот ход сильно снизит урон спец-атаки.`
    : 'Снижает входящий урон на 1 ход.';

  return (
    <>
      {isTouchDevice && (
        <CombatTouchControls
          disabled={actionsDisabled}
          poemDisabled={poemDisabled}
          poemOpen={showPowers}
          onAttack={onAttack}
          onDefend={onDefend}
          onPoemToggle={onTogglePowers}
          onFlee={onFlee}
          onPoemSwipe={onPoemSwipe}
        />
      )}

      {!isTouchDevice && (
        <div className="glass-panel flex gap-1.5 mb-2">
          <TerminalButton
            onClick={onAttack}
            disabled={actionsDisabled}
            accentColor="cyan"
            gamepadHint={gamepadConnected ? COMBAT_BUTTON_HINTS.attack : undefined}
          >
            <Sword className="size-3.5" />
            АТАКА
          </TerminalButton>
          <TerminalButton
            onClick={onDefend}
            disabled={actionsDisabled}
            accentColor="emerald"
            gamepadHint={gamepadConnected ? COMBAT_BUTTON_HINTS.defend : undefined}
            title={defendTooltip}
            highlight={Boolean(enemyChargingName)}
          >
            <Shield className="size-3.5" />
            ЗАЩИТА
          </TerminalButton>
          <div className="relative flex-1">
            <TerminalButton
              onClick={onTogglePowers}
              disabled={actionsDisabled || poemDisabled}
              accentColor="amber"
              gamepadHint={gamepadConnected ? COMBAT_BUTTON_HINTS.poem_cycle_next : undefined}
            >
              <Sparkles className="size-3.5" />
              СТИХ
              <ChevronDown className={`size-2.5 transition-transform ${showPowers ? 'rotate-180' : ''}`} />
            </TerminalButton>
            <PoemPowersSubmenu
              showPowers={showPowers}
              availablePowers={availablePowers}
              gamepadConnected={gamepadConnected}
              gamepadSelectedIdx={gamepadSelectedIdx}
              onSelectPower={onSelectPower}
            />
          </div>
          <TerminalButton
            onClick={onFlee}
            disabled={actionsDisabled}
            accentColor="rose"
            gamepadHint={gamepadConnected ? COMBAT_BUTTON_HINTS.flee : undefined}
          >
            <LogOut className="size-3.5" />
            БЕЖАТЬ
          </TerminalButton>
        </div>
      )}

      {isTouchDevice && (
        <div className="relative mb-2">
          <PoemPowersSubmenu
            showPowers={showPowers}
            availablePowers={availablePowers}
            gamepadConnected={false}
            gamepadSelectedIdx={gamepadSelectedIdx}
            onSelectPower={onSelectPower}
          />
        </div>
      )}
    </>
  );
}
