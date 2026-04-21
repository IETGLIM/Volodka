import { describe, expect, it } from 'vitest';
import { getCurrentScheduleEntry, isHourInRange, resolveScheduleNpcId } from '@/engine/ScheduleEngine';
import { getNPCsForScene } from '@/data/npcDefinitions';

describe('ScheduleEngine routines', () => {
  it('aliases home cards to canonical schedule id', () => {
    expect(resolveScheduleNpcId('zarema_home')).toBe('zarema');
    expect(resolveScheduleNpcId('albert_home')).toBe('albert');
    expect(resolveScheduleNpcId('zarema')).toBe('zarema');
  });

  it('isHourInRange handles overnight window', () => {
    expect(isHourInRange(23.5, 23, 7)).toBe(true);
    expect(isHourInRange(6, 23, 7)).toBe(true);
    expect(isHourInRange(7, 23, 7)).toBe(false);
    expect(isHourInRange(9, 7, 10)).toBe(true);
    expect(isHourInRange(10, 7, 10)).toBe(false);
  });

  it('Albert moves between home, office, library, park and bar by hour', () => {
    expect(getCurrentScheduleEntry('albert', 2)?.sceneId).toBe('zarema_albert_room');
    expect(getCurrentScheduleEntry('albert', 2)?.activity).toBe('sleep');
    expect(getCurrentScheduleEntry('albert', 8)?.activity).toBe('rest');
    expect(getCurrentScheduleEntry('albert', 10)?.sceneId).toBe('office_morning');
    expect(getCurrentScheduleEntry('albert', 12.5)?.sceneId).toBe('library');
    expect(getCurrentScheduleEntry('albert', 14)?.sceneId).toBe('library');
    expect(getCurrentScheduleEntry('albert', 17)?.sceneId).toBe('memorial_park');
    expect(getCurrentScheduleEntry('albert', 20)?.sceneId).toBe('zarema_albert_room');
  });

  it('at hour 20 Zarema and Albert are both in zarema_albert_room (home cards)', () => {
    const home = getNPCsForScene('zarema_albert_room', 20);
    expect(home.some((n) => n.id === 'zarema_home')).toBe(true);
    expect(home.some((n) => n.id === 'albert_home')).toBe(true);
  });

  it('getNPCsForScene with time includes NPCs visiting from schedule', () => {
    const cafeAfternoon = getNPCsForScene('cafe_evening', 16);
    expect(cafeAfternoon.some((n) => n.id === 'zarema')).toBe(true);
    expect(cafeAfternoon.some((n) => n.id === 'pit_timur')).toBe(true);

    const cafeEvening = getNPCsForScene('cafe_evening', 19);
    expect(cafeEvening.some((n) => n.id === 'albert')).toBe(true);

    const office = getNPCsForScene('office_morning', 10);
    expect(office.some((n) => n.id === 'albert')).toBe(true);
    expect(office.some((n) => n.id === 'office_colleague')).toBe(true);
  });
});
