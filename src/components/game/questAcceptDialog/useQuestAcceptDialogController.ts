import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { useNpcRelationValue } from '@/store/selectors/worldSelectors';
import {
  QUEST_ACCEPT_CLOSE_DELAY_MS,
  QUEST_ACCEPT_DIALOG_LABELS,
} from '@/engine/quest/questAcceptDialogConstants';
import {
  findQuestDefinition,
  isMainQuest,
  resolveQuestAcceptContext,
} from '@/engine/quest/questAcceptDialogPresentation';

export type QuestAcceptDialogProps = {
  questId: string | null;
  npcId?: string;
  onClose: () => void;
  onAccept: (questId: string) => void;
};

export function useQuestAcceptDialogController({
  questId,
  npcId,
  onClose,
  onAccept,
}: QuestAcceptDialogProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const [visible, setVisible] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const acceptBtnRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questDef = useMemo(() => findQuestDefinition(questId), [questId]);
  const context = useMemo(
    () => (questDef ? resolveQuestAcceptContext(questDef, npcId) : null),
    [questDef, npcId],
  );

  const npcRelation = useNpcRelationValue(context?.resolvedNpcId);
  const mainQuest = questDef ? isMainQuest(questDef) : false;

  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, reducedMotion ? 0 : QUEST_ACCEPT_CLOSE_DELAY_MS);
  }, [onClose, reducedMotion]);

  const handleClose = useCallback(() => {
    setVisible(false);
    scheduleClose();
  }, [scheduleClose]);

  const handleAccept = useCallback(() => {
    if (questId) {
      onAccept(questId);
    }
    setVisible(false);
    scheduleClose();
  }, [questId, onAccept, scheduleClose]);

  const handleDecline = useCallback(() => {
    handleClose();
  }, [handleClose]);

  useEffect(() => {
    if (questId) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [questId]);

  useEffect(() => {
    if (transitionPhase === 'loading') {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setVisible(false);
      onClose();
    }
  }, [transitionPhase, onClose]);

  useEffect(() => {
    if (!visible || !questDef) return;
    setLiveAnnouncement(QUEST_ACCEPT_DIALOG_LABELS.openedAnnouncement(questDef.title));
    acceptBtnRef.current?.focus();
  }, [visible, questDef]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleClose]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  return {
    reducedMotion,
    visible,
    questDef,
    context,
    npcRelation,
    mainQuest,
    liveAnnouncement,
    acceptBtnRef,
    handleAccept,
    handleDecline,
    handleClose,
  };
}

export type QuestAcceptDialogController = ReturnType<typeof useQuestAcceptDialogController>;
