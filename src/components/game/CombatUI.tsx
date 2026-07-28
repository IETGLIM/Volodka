/* ─── Volodka RPG – Enhanced Combat UI Overlay ─── */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { CombatLogEntry } from '@/shared/types/game';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CombatDamageTimeline } from '@/components/game/hud/parts/CombatDamageTimeline';
import { TurnPhaseIndicator } from '@/components/game/hud/parts/TurnPhaseIndicator';
import { CombatIntroSplash } from '@/components/game/combatUi/CombatIntroSplash';
import { CombatLogLine } from '@/components/game/combatUi/CombatLogLine';
import { CombatScreenFlash, DamageNumber } from '@/components/game/combatUi/CombatDamageFx';
import { CombatEnemyPanel } from '@/components/game/combatUi/CombatEnemyPanel';
import { CombatActionBar } from '@/components/game/combatUi/CombatActionBar';
import { CombatPlayerCard } from '@/components/game/combatUi/CombatPlayerCard';
import { CombatOutcomeChrome } from '@/components/game/combatUi/CombatOutcomeChrome';
import { useCombatUiController } from '@/components/game/combatUi/useCombatUiController';

export function CombatUI() {
  const ui = useCombatUiController();

  if (ui.mode !== 'combat' || !ui.combatState) return null;

  const combatState = ui.combatState;
  const isActive = combatState.status === 'active';
  const isPlayerTurn = combatState.isPlayerTurn && isActive && !ui.introVisible;
  const isSilenced = combatState.buffs.some(
    (b) => b.target === 'player' && b.effect.type === 'silence_specials',
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Бой"
        className={`fixed inset-0 flex flex-col pointer-events-none ${ui.screenShake ? 'combat-shake' : ''} ${isActive ? 'combat-vignette-active' : ''}`}
        style={{ zIndex: UI_LAYERS.COMBAT }}
      >
        <AnimatePresence mode="wait">
          {ui.introVisible && ui.introMeta && (
            <CombatIntroSplash
              key={`${ui.introMeta.name}-${ui.introMeta.emoji}`}
              emoji={ui.introMeta.emoji}
              name={ui.introMeta.name}
              onDone={ui.dismissIntro}
            />
          )}
        </AnimatePresence>

        <CombatScreenFlash flashColor={ui.flashColor} />

        <CombatEnemyPanel
          combatState={combatState}
          enemyBuffs={ui.enemyBuffs}
          introVisible={ui.introVisible}
        />

        <div className="relative flex-1 flex items-center justify-center">
          <AnimatePresence>
            {ui.damageNumbers.map((dn) => (
              <DamageNumber
                key={dn.id}
                damage={dn.damage}
                type={dn.type}
                isCritical={dn.isCritical}
              />
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          className="pointer-events-auto px-3 pb-3"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: ui.introVisible ? 20 : 0, opacity: ui.introVisible ? 0.35 : 1 }}
          transition={{ delay: ui.introVisible ? 0 : 0.4, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <CombatPlayerCard
            playerHp={combatState.playerHp}
            playerMaxHp={combatState.playerMaxHp}
            playerBuffs={ui.playerBuffs}
          />

          <CombatOutcomeChrome
            status={combatState.status}
            rewards={combatState.rewards}
            maxCombo={combatState.maxCombo}
          />

          {isActive && (
            <>
              <div className="mb-1.5 flex flex-col items-center gap-0.5">
                <TurnPhaseIndicator />
                <div className="flex items-center gap-2 text-[9px] font-mono">
                  {isSilenced && (
                    <span className="text-red-400">🔇 СПОСОБНОСТИ ЗАБЛОКИРОВАНЫ</span>
                  )}
                  {combatState.fleeAttempts > 0 && (
                    <span className="text-amber-400/60">
                      <Zap className="inline size-2.5" /> Побег: +{combatState.fleeAttempts * 15}%
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-center mb-1.5">
                <CombatDamageTimeline />
              </div>

              <div className="signal-wave mb-1.5">
                <span /><span /><span /><span /><span />
              </div>

              <CombatActionBar
                isTouchDevice={ui.isTouchDevice}
                isPlayerTurn={isPlayerTurn}
                pendingAction={ui.pendingAction}
                isSilenced={isSilenced}
                showPowers={ui.showPowers}
                availablePowers={ui.availablePowers}
                gamepadConnected={ui.gamepadConnected}
                gamepadSelectedIdx={ui.gamepadSelectedIdx}
                onAttack={ui.handleAttack}
                onDefend={ui.handleDefend}
                onFlee={ui.handleFlee}
                onTogglePowers={ui.togglePowers}
                onSelectPower={ui.handlePower}
                onPoemSwipe={ui.cyclePoemSelection}
              />
            </>
          )}

          <div
            aria-live={isActive ? 'off' : 'polite'}
            aria-label="Combat log"
            className="max-h-28 overflow-y-auto bg-black/70 border border-slate-800/30 rounded-lg p-2 font-mono"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
          >
            {combatState.log.map((entry: CombatLogEntry, i: number) => (
              <CombatLogLine
                key={`log-${i}-${entry.turn}-${entry.type}-${entry.text.slice(0, 20)}`}
                entry={entry}
                className="typing-cursor"
              />
            ))}
            <div ref={ui.logEndRef} />
          </div>
        </motion.div>

        <div
          className="fixed inset-0 pointer-events-none opacity-[0.02]"
          style={{
            zIndex: UI_LAYERS.COMBAT,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.1) 2px, rgba(0,255,65,0.1) 4px)',
          }}
        />
        <div className="combat-grid-overlay" />
      </div>
    </TooltipProvider>
  );
}
