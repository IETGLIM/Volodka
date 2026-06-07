import { createSceneChunk } from '../lazySceneChunk';
import type { HomeEveningPropsChunkProps } from './HomeEveningPropsChunk';

export const HomeEveningProps = createSceneChunk<HomeEveningPropsChunkProps>(
  'home-evening-props',
  () =>
    import('./HomeEveningPropsChunk').then((mod) => ({
      default: mod.HomeEveningPropsChunk,
    })),
);
