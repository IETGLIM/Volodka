'use client';

/* ─── Volodka RPG – Re-exports from unified mobile hooks ─── */
/* Backward-compatibility shim. All mobile detection logic has been
 * consolidated into use-mobile.ts to prevent bugs from divergent
 * implementations. New code should import from '@/hooks/use-mobile'. */

export { useIsMobile as useIsMobile, useMobileVisualPerf } from './use-mobile';
export type { MobileVisualPerf } from './use-mobile';
