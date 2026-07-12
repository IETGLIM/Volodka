import { useEffect, useState } from 'react';
import { subscribeSavePresence } from '@/store/slices/saveStorage';
import { parseMenuSavePreview, type MenuSavePreview } from '@/engine/menu/menuPresentation';

/** Cached save metadata for the Continue menu item — avoids localStorage reads on every render. */
export function useMenuSavePreview(hasSave: boolean): MenuSavePreview | null {
  const [preview, setPreview] = useState<MenuSavePreview | null>(null);

  useEffect(() => {
    if (!hasSave) {
      setPreview(null);
      return;
    }

    setPreview(parseMenuSavePreview());
    return subscribeSavePresence(() => setPreview(parseMenuSavePreview()));
  }, [hasSave]);

  return preview;
}
