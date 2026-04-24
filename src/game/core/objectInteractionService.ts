import { getInteractiveObjectsForScene } from '@/config/scenes';
import { items as GAME_ITEM_TABLE } from '@/data/items';
import { eventBus } from '@/engine/EventBus';
import { homeApartmentInspectLine, tryHomeApartmentUse } from '@/lib/homeApartmentInteract';
import { getInteractiveSkillBlockMessage } from '@/lib/interactiveSkillRequirements';
import { tryApplyVolodkaRackAuditInspect } from '@/lib/volodkaRackQuestBranch';
import { volodkaCorridorInspectLine, tryVolodkaCorridorUse } from '@/lib/volodkaCorridorInteract';
import { volodkaRoomInspectLine, tryVolodkaRoomUse } from '@/lib/volodkaRoomInteract';
import { useGameStore } from '@/state/gameStore';
import { dispatchQuestEvent } from '@/game/core/questEvents';

function explorationToast(text: string): void {
  eventBus.emit('ui:exploration_message', { text });
}

function handleObjectInteract({ objectId, action }: { objectId: string; action: string }): void {
  const sid = useGameStore.getState().exploration.currentSceneId;
  const objects = getInteractiveObjectsForScene(sid);
  const obj = objects.find((o) => o.id === objectId);

  if (!obj) {
    explorationToast('Объект не найден в этой сцене.');
    return;
  }

  const store = useGameStore.getState();

  switch (action) {
    case 'inspect': {
      const skillHint = getInteractiveSkillBlockMessage(obj, store.playerState.skills);
      const homeLine = sid === 'home_evening' ? homeApartmentInspectLine(obj) : null;
      const volLine = sid === 'volodka_room' ? volodkaRoomInspectLine(obj) : null;
      const corLine = sid === 'volodka_corridor' ? volodkaCorridorInspectLine(obj) : null;
      if (homeLine) {
        explorationToast(skillHint ? `${homeLine} ${skillHint}` : homeLine);
      } else if (volLine) {
        if (
          sid === 'volodka_room' &&
          tryApplyVolodkaRackAuditInspect(obj, explorationToast, volLine, skillHint ? `${skillHint}` : null)
        ) {
          /* одно сообщение: осмотр + прогресс аудита внутри helper */
        } else {
          explorationToast(skillHint ? `${volLine} ${skillHint}` : volLine);
        }
      } else if (corLine) {
        explorationToast(skillHint ? `${corLine} ${skillHint}` : corLine);
      } else if (obj.canBeRead && obj.poemId) {
        explorationToast(
          skillHint
            ? `«${obj.type}»: можно прочитать — «Использовать». ${skillHint}`
            : `«${obj.type}»: можно прочитать — действие «Использовать».`,
        );
      } else {
        explorationToast(
          skillHint
            ? `Объект «${obj.id}» (${obj.type}). ${skillHint}`
            : `Объект «${obj.id}» (${obj.type}).`,
        );
      }
      break;
    }
    case 'take': {
      const block = getInteractiveSkillBlockMessage(obj, store.playerState.skills);
      if (block) {
        explorationToast(block);
        break;
      }
      if (obj.itemId) {
        store.addItem(obj.itemId, 1);
        const label = GAME_ITEM_TABLE[obj.itemId]?.name ?? obj.itemId;
        explorationToast(`В инвентарь: ${label}`);
      } else {
        explorationToast('С объекта нечего взять.');
      }
      break;
    }
    case 'use': {
      const blockUse = getInteractiveSkillBlockMessage(obj, store.playerState.skills);
      if (blockUse) {
        explorationToast(blockUse);
        break;
      }
      if (sid === 'home_evening' && tryHomeApartmentUse(obj, store, explorationToast, dispatchQuestEvent)) {
        break;
      }
      if (sid === 'volodka_room' && tryVolodkaRoomUse(obj, store, explorationToast)) {
        break;
      }
      if (sid === 'volodka_corridor' && tryVolodkaCorridorUse(obj, store, explorationToast)) {
        break;
      }
      explorationToast('Использование привязано к сюжету — скоро.');
      break;
    }
    case 'drop': {
      if (obj.itemId) {
        store.removeItem(obj.itemId, 1);
        explorationToast(`Выброшено: ${obj.itemId}`);
      } else {
        explorationToast('Нельзя выбросить привязку к этому объекту.');
      }
      break;
    }
    default:
      explorationToast(`Действие «${action}» не обработано.`);
  }
}

let objectInteractUnsub: (() => void) | null = null;

export function startObjectInteractionService(): () => void {
  objectInteractUnsub?.();
  objectInteractUnsub = eventBus.on('object:interact', handleObjectInteract);
  return () => {
    objectInteractUnsub?.();
    objectInteractUnsub = null;
  };
}
