import { useEffect, useState } from 'react';
import { getActiveGamepad } from '@/engine/input/gamepad';

/** True while a standard-mapped gamepad is connected (player slot 0 preferred). */
export function useGamepadConnected(): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const update = () => {
      setConnected(Boolean(getActiveGamepad()));
    };

    update();
    window.addEventListener('gamepadconnected', update);
    window.addEventListener('gamepaddisconnected', update);
    return () => {
      window.removeEventListener('gamepadconnected', update);
      window.removeEventListener('gamepaddisconnected', update);
    };
  }, []);

  return connected;
}
