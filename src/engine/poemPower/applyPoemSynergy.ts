import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import {
  findPoemSynergy,
  getPoemSynergyById,
  type PoemSynergyDefinition,
} from '@/config/poemSynergies';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import { isTrainablePlayerSkill, warnInvalidValue } from '@/shared/validation/typeGuards';
import { selectHeartBondTarget, HEART_BOND_BONUS_MIN_VALUE } from '@/engine/npcRelationship/selectHeartBondTarget';
import { scalePoemPowerDurationMs, scalePoemPowerSkillDelta } from '@/engine/skills/passiveSkillModifiers';
import { ttlExpiryFromDurationMs } from '@/shared/ttlClock';

function snap() {
  return getGameSnapshot();
}

function addSkill(skill: TrainablePlayerSkill, amount: number) {
  const snapshot = snap();
  const scaled = scalePoemPowerSkillDelta(
    amount,
    snapshot.playerState.progression.unlockedSkills,
    snapshot.playerState.flags,
    snapshot.playerState.skills.coding,
  );
  dispatchGameAction({ type: 'player/addSkill', skill, amount: scaled });
}

function setFlag(key: string, value: boolean) {
  dispatchGameAction({ type: 'player/setFlag', key, value });
}

function setNpcRelation(npcId: string, delta: number) {
  dispatchGameAction({ type: 'player/setNpcRelation', npcId, delta });
}

function upsertSynergyTTLFlags(synergy: PoemSynergyDefinition): void {
  if (synergy.flagsToSet.length === 0) return;
  const snapshot = snap();
  for (const flag of synergy.flagsToSet) {
    setFlag(flag.key, true);
  }
  dispatchGameAction({
    type: 'poem/upsertTTLFlags',
    flags: synergy.flagsToSet.map((flag) => ({
      key: flag.key,
      poemId: flag.reverseId ?? synergy.synergyId,
      expiryTimestamp: ttlExpiryFromDurationMs(
        scalePoemPowerDurationMs(
          flag.durationMs,
          snapshot.playerState.progression.unlockedSkills,
          snapshot.playerState.flags,
        ),
      ),
    })),
  });
}

function applyHeartBondBonus(): void {
  const snapshot = snap();
  const best = selectHeartBondTarget(snapshot.npcRelations, snapshot.playerState.flags);
  if (!best || best.value < HEART_BOND_BONUS_MIN_VALUE) return;
  setNpcRelation(best.npcId, 20);
}

function applySynergyImmediateEffects(synergy: PoemSynergyDefinition): void {
  if (synergy.immediateSkills) {
    for (const [skill, amount] of Object.entries(synergy.immediateSkills)) {
      if (isTrainablePlayerSkill(skill)) {
        addSkill(skill, amount);
      } else {
        warnInvalidValue('poem synergy immediateSkills', skill);
      }
    }
  }

  if (synergy.synergyId === 'heart_bond') {
    applyHeartBondBonus();
  }
}

export function getPoemRhythmState(): {
  lastUsedPoemId: string | null;
  lastUsedPoemTimestamp: number | null;
} {
  const snapshot = getGameSnapshot();
  return {
    lastUsedPoemId: snapshot.lastUsedPoemId,
    lastUsedPoemTimestamp: snapshot.lastUsedPoemTimestamp,
  };
}

export function recordPoemRhythm(poemId: string, timestamp = Date.now()): void {
  dispatchGameAction({ type: 'poem/recordLastUsed', poemId, timestamp });
}

/** Detect and apply synergy bonus when the second poem in a pair fires within the rhythm window. */
export function tryApplyPoemSynergy(currentPoemId: string, now = Date.now()): PoemSynergyDefinition | null {
  const { lastUsedPoemId, lastUsedPoemTimestamp } = getPoemRhythmState();
  const synergy = findPoemSynergy(currentPoemId, lastUsedPoemId, lastUsedPoemTimestamp, now);
  if (!synergy) return null;

  applySynergyImmediateEffects(synergy);
  upsertSynergyTTLFlags(synergy);

  dispatchGameAction({
    type: 'notification/push',
    notificationType: 'poem',
    text: `Синергия: ${synergy.name}`,
  });

  eventBus.emit('poem:synergy_triggered', {
    synergyId: synergy.synergyId,
    synergyName: synergy.name,
    poemIds: [...synergy.poemIds] as [string, string],
    triggeredByPoemId: currentPoemId,
    pairedWithPoemId: lastUsedPoemId!,
  });

  return synergy;
}

export function resolveSynergyWorldProfile(synergyId: string) {
  return getPoemSynergyById(synergyId)?.worldProfile;
}
