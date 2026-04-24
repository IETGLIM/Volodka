import type { InteractiveObjectConfig } from '@/config/scenes';
import type { useGameStore } from '@/state/gameStore';
import { CORRIDOR_FROM_ROOM } from '@/lib/volodkaCorridorInteract';
import { explorationNarrativeTeleport } from '@/lib/explorationNarrativeTeleport';

type StoreSnapshot = ReturnType<typeof useGameStore.getState>;

const INSPECT: Partial<Record<string, string>> = {
  volodka_laptop_work:
    'Рабочий ноутбук: VPN, IDE, вкладки с инцидентами. Крышка в отпечатках — как будто сам таск‑трекер пытается удержать тебя в реальности.',
  volodka_laptop_personal:
    'Второй ноутбук — «свой» канал: мессенджеры, плейлисты, черновики. Разделение на два железа честнее любого «work-life balance» в слайдах.',
  volodka_monitor_rack:
    'Три экрана: логи, метрики, чат. Если чуть отодвинуться — ощущение кабины корабля из панели и проводов.',
  volodka_kibana_tail:
    'Длинный хвост запросов в Kibana. Зелёные и жёлтые полоски — как свеча на бирже, только про то, что снова упало ночью.',
  volodka_zabbix_screen:
    'Zabbix: триггеры, «PROBLEM», ACK. Цифры не ругаются — они просто констатируют факт, как погода.',
  volodka_grafana_board:
    'Grafana: кривые CPU и latency. Красиво, пока не начинаешь узнавать в пиках собственный пульс.',
  volodka_desk_main:
    'Основной стол: кабели в кабель‑канале, кружка с отпечатком. Здесь живёт удалёнка.',
  volodka_desk_side:
    'Второй стол под бумаги и мелочь. Реже включается монитор — зато чаще лежит блокнот со стихами.',
  volodka_wardrobe_right:
    'Шкаф справа от рабочей зоны: техника, коробки от железа, запах пыли и горячего пластика.',
  volodka_wardrobe_left:
    'Шкаф слева — вещи и верхняя одежда. За ним ровно настолько тишины, насколько хватает фанеры.',
  volodka_sofa:
    'Диван у двери в коридор: можно рухнуть спиной к стене и слушать, как родители готовят ужин на кухне.',
  volodka_window:
    'Окно справа от стола: двор, фонари, чужие окна. Панелька — как фон, который не выключить.',
  volodka_door_corridor:
    'Дверь в коридор трёхкомнатной квартиры. Узкий проход: отсюда — либо обратно в «офис», либо в кухню и общие комнаты, либо в боковые крылья планировки.',
};

export function volodkaRoomInspectLine(obj: InteractiveObjectConfig): string | null {
  return INSPECT[obj.id] ?? null;
}

/** Дверь в коридор / квартиру: без расхода энергии (внутренняя смена комнаты). */
export function tryVolodkaRoomUse(
  obj: InteractiveObjectConfig,
  _store: StoreSnapshot,
  toast: (text: string) => void,
): boolean {
  if (obj.id !== 'volodka_door_corridor') return false;
  explorationNarrativeTeleport('volodka_corridor', { ...CORRIDOR_FROM_ROOM });
  toast('Коридор. Линолеум, щиток, чужие тапки — короткий буфер между удалёнкой и остальным домом.');
  return true;
}
