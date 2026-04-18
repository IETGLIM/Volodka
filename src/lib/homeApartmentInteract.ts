import type { InteractiveObjectConfig } from '@/config/scenes';
import { getSceneConfig } from '@/config/scenes';
import { POEMS } from '@/data/poems';
import { eventBus } from '@/engine/EventBus';
import { poemMechanics } from '@/engine/PoemMechanics';
import type { QuestEvent } from '@/hooks/useQuestProgress';
import { useGameStore } from '@/store/gameStore';

type StoreSnapshot = ReturnType<typeof useGameStore.getState>;

/** Осмотр: нуар + кибер-деталь + быт (Volodka / BR / gothic-noir RPG). */
const INSPECT: Partial<Record<string, string>> = {
  home_door_volodka_room:
    'Дверь в твою комнату. За ней — два стола, мониторы и тот самый «офис» в панельке, где мама с папой называют это «работаешь из дома».',
  home_radio:
    'Потёртый корпус, ручка громкости заедает. На шкале — города, между ними только «шум»: белый, как пустой канал без приглашения.',
  home_book_bedside:
    'Корешок в потёртом переплёте. Закладка держит середину — будто кто-то оставил тебе сохранение, а не просто страницу.',
  home_water_pitcher:
    'Стекло в каплях. Вода без вкуса и без легенды — честный протокол: организм ещё в сети, пульс не списан.',
  home_notebook_desk:
    'Спираль, чернила, жирные отпечатки пальцев. Слева — сроки и «просто уточнить», справа — строки, которые не уходят в почту.',
  home_tea_mug:
    'Кружка с отколом на краю. Чай остыл, но запах остался — как след от чужой жизни в твоей комнате.',
  home_chocolate_box:
    'Половина плитки. Не клад для «чёрного дня», а короткий бафф против серости — съешь и снова пойдёшь в рейд.',
  home_window_corner:
    'Снег липнет к стеклу, внизу — чужие окна и жёлтые пятна света. Город не отвечает; это тоже ответ.',
  home_fridge:
    'Мотор гудит ровно, как вентилятор в серверной. На двери — магниты, объявления и один пустой лист: квест без описания.',
  home_phone_coffee_table:
    'Экран в царапинах. Пропущенные звонят не теми именами — и всё равно палец тянется, как к рычагу в старом квесте.',
  home_potted_plant:
    'Фикус пережил три переезда. Земля сухая — маленькая живая правда, которую нельзя закрыть тикетом.',
};

export function homeApartmentInspectLine(obj: InteractiveObjectConfig): string | null {
  return INSPECT[obj.id] ?? null;
}

/**
 * @returns true если обработано (только сцена квартиры и id `home_*`).
 */
export function tryHomeApartmentUse(
  obj: InteractiveObjectConfig,
  store: StoreSnapshot,
  toast: (text: string) => void,
  emitQuest: (e: QuestEvent) => void,
): boolean {
  if (!obj.id.startsWith('home_')) return false;

  switch (obj.id) {
    case 'home_door_volodka_room': {
      const sp = getSceneConfig('volodka_room').spawnPoint;
      store.travelToScene('volodka_room', { narrativeDriven: true });
      store.setPlayerPosition({ x: sp.x, y: sp.y, z: sp.z, rotation: sp.rotation ?? 0 });
      toast('Комната. Здесь пахнет кофе из кружки и чуть‑чуть heated plastic от техники.');
      break;
    }
    case 'home_radio': {
      eventBus.emit('sound:play', { type: 'radio_static', volume: 0.32 });
      toast(
        'Щёлкнул тумблером. Шипение заполняет углы — чужой эфир, твоя комната. Секунда тепла, пока голос не растворится в помехах.',
      );
      store.setFlag('home_radio_played');
      break;
    }
    case 'home_water_pitcher': {
      store.addStat('energy', 4);
      store.reduceStress(3);
      toast('Налил и выпил залпом. Холод проходит по груди — как сброс перегрева в железе, только внутри живого.');
      break;
    }
    case 'home_book_bedside': {
      const pid = obj.poemId ?? 'poem_1';
      if (store.collectedPoemIds.includes(pid)) {
        toast('Те же строки — другой рендер: память перечитывает тебя, а не наоборот.');
        break;
      }
      store.collectPoem(pid);
      const insight = poemMechanics.collectPoem(pid);
      const poem = POEMS.find((p) => p.id === pid);
      if (insight) {
        for (const [stat, value] of Object.entries(insight.statBonuses)) {
          if (value && ['mood', 'creativity', 'stability', 'energy', 'karma', 'selfEsteem'].includes(stat)) {
            store.addStat(stat as 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', value);
          }
        }
      }
      emitQuest({ type: 'poem_collected', data: { poemId: pid } });
      toast(
        poem
          ? `Читаешь «${poem.title}». Буквы тяжелеют на сетчатке — как старый свиток в RPG, только про твою жизнь.`
          : 'Несколько страниц — и в груди становится тише, будто кто-то приглушил шум за стеной.',
      );
      break;
    }
    case 'home_fridge': {
      store.reduceStress(5);
      store.addStat('mood', 3);
      toast(
        'Холодный свет, йогурт на грани срока. Не легендарный лут — зато тепло на языке и ощущение, что день ещё не кончился.',
      );
      break;
    }
    case 'home_window_corner': {
      store.addStat('creativity', 3);
      toast(
        'Смотришь вниз, пока снег не стирает контуры. Город как декорация без квестодателя — и от этого странно легче дышать.',
      );
      break;
    }
    case 'home_phone_coffee_table': {
      toast('Палец зависает над «позвонить». Не сегодня. Экран гаснет — и тишина становится чуть менее чужой.');
      store.addStat('stability', 2);
      break;
    }
    case 'home_potted_plant': {
      toast('Полил из кружки. Вода стекает на поддон — мелкая забота без дедлайна, без очереди в голове.');
      store.addStat('mood', 2);
      break;
    }
    case 'home_tea_mug': {
      store.addStat('energy', 2);
      store.addStat('mood', 2);
      toast('Разогрел в микроволновке. Пар бьёт в лицо — короткий бафф «ты здесь», не в отчёте.');
      break;
    }
    case 'home_chocolate_box': {
      store.addStat('mood', 4);
      store.reduceStress(4);
      toast('Один квадратик — сладость в крови быстрее любых объяснений. Маленький подкуп собственного тела.');
      break;
    }
    case 'home_notebook_desk': {
      store.addStat('creativity', 5);
      toast(
        'Листаешь блокнот: слева — сроки и «надо ответить», справа — рифмы, которые никому не слать. Два слоя одной машины.',
      );
      break;
    }
    default:
      toast('Руки тянутся, сценарий молчит — пока только смотреть. Или прийти сюда позже, с другим настроением.');
  }
  return true;
}
