import { createSceneChunk } from '../lazySceneChunk';

export const VolodkaRoomClutter = createSceneChunk<Record<string, never>>(
  'volodka-room-clutter',
  'volodka_room',
  () =>
    import('./VolodkaRoomClutterChunk').then((mod) => ({
      default: mod.VolodkaRoomClutterChunk,
    })),
);
