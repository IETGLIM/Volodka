import { createSceneChunk } from '../lazySceneChunk';

export const HomeEveningProps = createSceneChunk<Record<string, never>>(
  'home-evening-props',
  'home_evening',
  () =>
    import('./HomeEveningPropsChunk').then((mod) => ({
      default: mod.HomeEveningPropsChunk,
    })),
);
