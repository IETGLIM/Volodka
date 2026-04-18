import type { InteractiveObjectConfig } from '@/config/scenes';
import { PLAYER_FEET_SPAWN_Y } from '@/lib/playerScaleConstants';
import type { useGameStore } from '@/store/gameStore';

type StoreSnapshot = ReturnType<typeof useGameStore.getState>;

/** Спавн у южной двери (из комнаты Володьки), смотрим вдоль коридора к кухне. */
export const CORRIDOR_FROM_ROOM: { x: number; y: number; z: number; rotation: number } = {
  x: 0,
  y: PLAYER_FEET_SPAWN_Y,
  z: -4.25,
  rotation: 0,
};

/** С северной стороны коридора, лицом к дверям комнат. */
export const CORRIDOR_FROM_HOME: { x: number; y: number; z: number; rotation: number } = {
  x: 0,
  y: PLAYER_FEET_SPAWN_Y,
  z: 4.15,
  rotation: Math.PI,
};

/** В комнате у порога, лицом к двери в коридор. */
export const ROOM_FROM_CORRIDOR: { x: number; y: number; z: number; rotation: number } = {
  x: 0.05,
  y: PLAYER_FEET_SPAWN_Y,
  z: 3.45,
  rotation: Math.PI,
};

/** В общей зоне квартиры, западнее двери в коридор. */
export const HOME_FROM_CORRIDOR: { x: number; y: number; z: number; rotation: number } = {
  x: 4.55,
  y: PLAYER_FEET_SPAWN_Y,
  z: 4.05,
  rotation: -Math.PI / 2,
};

const INSPECT: Partial<Record<string, string>> = {
  corridor_door_volodka_room:
    'Дверь в твою комнату: за ней два стола, мониторы и тот самый «офис» в панельке. Ручка холодная — как будто серверная тянет обратно.',
  corridor_door_home_common:
    'Проём в кухню и общие комнаты: свет теплее, слышна вытяжка и голоса родителей. Короткий переход из туннеля в быт.',
  corridor_shoe_shelf:
    'Полка с обувью: чужие ботинки рядом с твоими кроссовками — карта того, кто сегодня «в сети» дома.',
  corridor_radiator:
    'Батарея щёлкает и пахнет пылью. Тепло неравномерное — как нагрузка по нодам кластера.',
  corridor_ceiling_lamp:
    'Плафон с жёлтым пятном: свет режет коридор пополам — дневной UI поверх ночного лога.',
  corridor_door_wing_left:
    'Налево — санузел и кухня в разных проёмах. Пока без отдельной «сцены», но трубы за стеной напоминают, что дом — тоже инфраструктура.',
  corridor_door_wing_right:
    'Направо — две комнаты с балконами. За дверью не слышно кода — только чужие шаги и иногда гитара из «Синей ямы» в голове.',
};

export function volodkaCorridorInspectLine(obj: InteractiveObjectConfig): string | null {
  return INSPECT[obj.id] ?? null;
}

/**
 * Двери между комнатой / коридором / общей зоной; боковые проёмы — только атмосферный тост.
 * @returns true если обработано
 */
export function tryVolodkaCorridorUse(
  obj: InteractiveObjectConfig,
  store: StoreSnapshot,
  toast: (text: string) => void,
): boolean {
  if (!obj.id.startsWith('corridor_')) return false;

  switch (obj.id) {
    case 'corridor_door_volodka_room': {
      store.travelToScene('volodka_room', { narrativeDriven: true });
      store.setPlayerPosition({ ...ROOM_FROM_CORRIDOR });
      toast('Комната. Захлопни дверь — и снова только ты, мониторы и чужой эфир в наушниках.');
      return true;
    }
    case 'corridor_door_home_common': {
      store.travelToScene('home_evening', { narrativeDriven: true });
      store.setPlayerPosition({ ...HOME_FROM_CORRIDOR });
      toast('Общая зона квартиры. Воздух другой — смесь ужина и «реальной» жизни вне тикетов.');
      return true;
    }
    case 'corridor_door_wing_left':
      toast('Туда — ванная, туалет и кухня по плану трёшки. Отдельные комнаты добавим позже; пока дверь просто держит тишину.');
      return true;
    case 'corridor_door_wing_right':
      toast('Там родительские и гостевая с балконами. Пока без отдельной локации — но стена тоньше, чем кажется.');
      return true;
    default: {
      if (obj.id.startsWith('corridor_')) {
        toast('Пока только смотреть — или открыть одну из дверей в конце коридора.');
        return true;
      }
      return false;
    }
  }
}
