/* ─── Volodka RPG – trigger zones (auto-split module) ─── */

import type { TriggerZone } from './types';

// CONTAINER LOOT
export const zones: TriggerZone[] = [
  /* ═══════════════════════════════════════════════════════════════════
     CONTAINER LOOT — Gothic-style ransack. Open a container, see contents,
     take items individually or all at once. Locked containers need a key.
     ═══════════════════════════════════════════════════════════════════ */

  /* ── Room wardrobe — hidden stash (unlocked, act 1+) ── */
  {
    id: 'room_wardrobe_stash',
    sceneId: 'volodka_room',
    position: [2.2, 0.5, 0],
    size: [0.6, 2.0, 0.4],
    interactionType: 'open',
    interactionLabel: 'Обыскать шкаф',
    enterToast: 'Шкаф у стены — скрипучие петли, но дверца приоткрыта.',
    examineData: {
      title: 'Старый шкаф',
      description: 'Платяной шкаф с треснувшим зеркалом на дверце.',
      detailText: 'За ворохом старых курток на дне — что-то шуршит. Можно обыскать.',
      icon: '🚪',
    },
    containerContents: [
      { itemId: 'coffee', quantity: 2 },
      { itemId: 'cigarettes', quantity: 1 },
      { itemId: 'painkiller', quantity: 1 },
    ],
    lootedFlag: 'room_wardrobe_looted',
    propModelId: 'kenney_wardrobe',
    propOffset: [0, 0, 0],
  },

  /* ── Cafe back room — locked supply crate (needs cafe_key) ── */
  {
    id: 'cafe_supply_crate',
    sceneId: 'cafe_evening',
    position: [-3.5, 0.4, -3.5],
    size: [0.8, 0.8, 0.8],
    interactionType: 'open',
    interactionLabel: 'Открыть ящик',
    enterToast: 'Под барной стойкой — запертый ящик с припасами.',
    examineData: {
      title: 'Ящик с припасами',
      description: 'Деревянный ящик под барной стойкой. На замке — логотип кафе.',
      detailText: 'Бариста хранит здесь запасы «на чёрный день». Замок простой, но без ключа не открыть.',
      icon: '📦',
    },
    lockedKeyId: 'cafe_key',
    containerContents: [
      { itemId: 'energy_drink', quantity: 2 },
      { itemId: 'coffee', quantity: 3 },
      { itemId: 'rare_alloy', quantity: 1 },
    ],
    lootedFlag: 'cafe_supply_looted',
    propModelId: 'kenney_city_table_small',
    propOffset: [0, 0, 0],
  },

  /* ── Library — unlocked reading desk drawer ── */
  {
    id: 'library_desk_drawer',
    sceneId: 'library_day',
    position: [1.5, 0.3, -1.0],
    size: [0.5, 0.5, 0.5],
    interactionType: 'open',
    interactionLabel: 'Ящик стола',
    enterToast: 'Читальный стол. Ящик приоткрыт.',
    examineData: {
      title: 'Ящик читального стола',
      description: 'Деревянный ящик стола в читальном зале.',
      detailText: 'Кто-то забыл здесь свои вещи. Библиотекарь не возражает, если ты их возьмёшь — всё равно никто не вернётся.',
      icon: '🗄️',
    },
    containerContents: [
      { itemId: 'encrypted_scroll', quantity: 1 },
      { itemId: 'old_poetry_book', quantity: 1 },
    ],
    lootedFlag: 'library_desk_looted',
    propModelId: 'kenney_desk',
    propOffset: [0, 0, 0],
  },

  /* ═══════════════════════════════════════════════════════════════════
     COMBAT ENCOUNTERS — replaced by visible patrolling creeps
     (src/data/creepPatrols.ts + PatrollingCreeps.tsx). The old invisible
     autoTrigger zones fired combat with no warning; creeps give the player
     a vision cone to sneak around instead.
     ═══════════════════════════════════════════════════════════════════ */

];
