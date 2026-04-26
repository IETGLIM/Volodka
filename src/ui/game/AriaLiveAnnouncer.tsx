'use client';

import { memo, useEffect, useState } from 'react';
import { eventBus } from '@/engine/EventBus';

export const AriaLiveAnnouncer = memo(function AriaLiveAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const unsubMessage = eventBus.on('ui:exploration_message', (payload) => {
      setAnnouncement(payload.text);
    });

    const unsubChoice = eventBus.on('choice:made', (payload) => {
      setAnnouncement(`Выбран вариант: ${payload.choiceText}`);
    });

    const unsubLoot = eventBus.on('loot:reward', (payload) => {
      setAnnouncement(`Получен предмет: ${payload.name}`);
    });

    const unsubLevel = eventBus.on('player:level_up', (payload) => {
      setAnnouncement(`Новый уровень: ${payload.newLevel}`);
    });

    return () => {
      unsubMessage();
      unsubChoice();
      unsubLoot();
      unsubLevel();
    };
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {announcement}
    </div>
  );
});
