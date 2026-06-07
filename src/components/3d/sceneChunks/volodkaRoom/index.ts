import { createSceneChunk } from '../lazySceneChunk';
import type { VolodkaRoomClutterChunkProps } from './VolodkaRoomClutterChunk';

export const VolodkaRoomClutter = createSceneChunk<VolodkaRoomClutterChunkProps>(
  'volodka-room-clutter',
  () =>
    import('./VolodkaRoomClutterChunk').then((mod) => ({
      default: mod.VolodkaRoomClutterChunk,
    })),
);
