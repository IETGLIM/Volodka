/* ─── AAA Living World Activities — world feels alive, lots to do ───
 * Adds interactive props that are not quests but emergent:
 * - coffee machine (make coffee)
 * - radio (change station)
 * - guitar (play)
 * - bookshelf (read random poem line)
 * - window (look out)
 * Each emits inner voice and subtle rewards.
 */

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';

const ACTIVITY_LINES: Record<string, string> = {
  coffee_machine: 'Кофе шипит. Пар поднимается, как мысли — медленно, но верно.',
  radio: 'Шипение, обрывки голоса. Город говорит, даже когда молчит.',
  guitar: 'Струна дрожит под пальцами. Не идеально, но честно.',
  bookshelf: 'Пыль на корешках. Кто-то здесь искал ответы до тебя.',
  window: 'За окном — город. Дождь или нет, он всё равно ждёт.',
  bench: 'Скамейка помнит многих. Можно присесть, послушать тишину.',
  terminal: 'Терминал гудит. Код ждёт, когда его прочитают.',
};

export function AaaLivingWorldActivities() {
  useEffect(() => {
    const unsubs = [
      eventBus.on('interaction:start', ({ propId }: any) => {
        const id = (propId ?? '') as string;
        const lower = id.toLowerCase();
        let key: keyof typeof ACTIVITY_LINES | null = null;
        if (lower.includes('coffee')) key = 'coffee_machine';
        else if (lower.includes('radio')) key = 'radio';
        else if (lower.includes('guitar')) key = 'guitar';
        else if (lower.includes('bookshelf') || lower.includes('book')) key = 'bookshelf';
        else if (lower.includes('window')) key = 'window';
        else if (lower.includes('bench')) key = 'bench';
        else if (lower.includes('terminal')) key = 'terminal';

        if (key) {
          const line = ACTIVITY_LINES[key];
          if (line) {
            // Emit as inner monologue, not notification spam
            eventBus.emit('volodka:thought' as any, { text: line, source: key } as any);
            // Tiny energy restore for cozy activities
            if (key === 'coffee_machine' || key === 'bench') {
              try {
                const snap = getGameSnapshot();
                if (snap.playerState.energy < 85) {
                  // dispatch via existing action if available
                  eventBus.emit('player:rest' as any, { amount: 3 } as any);
                }
              } catch {}
            }
          }
        }
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  return null;
}
