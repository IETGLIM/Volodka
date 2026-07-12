/* ─── Rapier world app-level cleanup (inside <Physics>) ─── */

import { useRapierWorldCleanup } from '@/hooks/useRapierWorldCleanup';

export function RapierWorldLifecycleBridge() {
  useRapierWorldCleanup();
  return null;
}
