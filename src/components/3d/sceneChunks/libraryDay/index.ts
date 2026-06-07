import { createSceneChunk } from '../lazySceneChunk';
import type { LibraryDayInteriorChunkProps } from './LibraryDayInteriorChunk';

export const LibraryDayInterior = createSceneChunk<LibraryDayInteriorChunkProps>(
  'library-day-interior',
  () =>
    import('./LibraryDayInteriorChunk').then((mod) => ({
      default: mod.LibraryDayInteriorChunk,
    })),
);
