import type { InteractiveObjectConfig } from '@/config/scenes';
import { rememberExplorationQuestCompleted } from '@/core/memory/MemoryEngine';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { useGameStore } from '@/store/gameStore';

const RACK_Q = 'exploration_volodka_rack';
const AUDIT_OBJECTIVE = 'rack_audit_panels';
const FORCE_OBJECTIVE = 'rack_force_nodes';

const AUDIT_PANEL_IDS = new Set([
  'volodka_kibana_tail',
  'volodka_zabbix_screen',
  'volodka_grafana_board',
]);

function composeToast(prefix: string | null, skillHint: string | null, body: string): string {
  const head = [prefix, skillHint].filter(Boolean).join(' ').trim();
  return head ? `${head}\n\n${body}` : body;
}

/**
 * Ветка B квеста «Разрыв синхронизации»: три осмотра панелей без мини-игры форса.
 * Возвращает `true`, если объект — одна из панелей аудита (сообщение уже отправлено в `toast`).
 */
export function tryApplyVolodkaRackAuditInspect(
  obj: InteractiveObjectConfig,
  toast: (text: string) => void,
  inspectPrefix: string | null,
  skillHint: string | null,
): boolean {
  if (!AUDIT_PANEL_IDS.has(obj.id)) return false;

  const st = useGameStore.getState();
  if (st.completedQuestIds.includes(RACK_Q)) {
    toast(composeToast(inspectPrefix, skillHint, 'Квест по этой стойке уже закрыт в журнале.'));
    return true;
  }

  const prog = st.getQuestProgress(RACK_Q) || {};
  const forced = (prog[FORCE_OBJECTIVE] ?? 0) > 0;
  if (forced) {
    toast(
      composeToast(
        inspectPrefix,
        skillHint,
        'После форса узлов «честный аудит» закрыт — в логе уже другой follow-up.',
      ),
    );
    return true;
  }

  if (!st.isQuestActive(RACK_Q)) {
    st.activateQuest(RACK_Q);
  }

  st.incrementQuestObjective(RACK_Q, AUDIT_OBJECTIVE);
  const st2 = useGameStore.getState();
  const cur = st2.getQuestProgress(RACK_Q)[AUDIT_OBJECTIVE] ?? 0;
  const def = QUEST_DEFINITIONS[RACK_Q];
  const target =
    def?.objectives.find((o) => o.id === AUDIT_OBJECTIVE)?.targetValue ?? 3;

  if (cur >= target) {
    st2.completeQuest(RACK_Q);
    rememberExplorationQuestCompleted(
      RACK_Q,
      def?.title ?? 'Разрыв синхронизации',
      'Ты закрыл квест без форса — три спокойных осмотра панелей, как смена без emergency merge.',
    );
    toast(
      composeToast(
        inspectPrefix,
        skillHint,
        'Квест «Разрыв синхронизации» завершён веткой честного аудита.',
      ),
    );
    return true;
  }

  toast(
    composeToast(
      inspectPrefix,
      skillHint,
      `Аудит панелей: ${cur} / ${target}. Пока идёт эта ветка, зона мини-игры на стойке не предлагается. Оставшиеся экраны — снова «Осмотреть».`,
    ),
  );
  return true;
}
