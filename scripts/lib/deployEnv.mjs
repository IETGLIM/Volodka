/**
 * CI / Vercel deploy environment helpers.
 * Khronos reference GLBs are dev-only bootstrap sources — never ship to production.
 */

/** True on Vercel builds or generic CI runners (GitHub Actions, etc.). */
export function isDeployCi() {
  return process.env.VERCEL === '1' || process.env.CI === 'true';
}

/**
 * Skip downloading Khronos reference models and Khronos-based interim staging.
 * Set SKIP_KHRONOS_BOOTSTRAP=1 to force locally; auto-enabled on Vercel/CI.
 */
export function skipKhronosBootstrap() {
  return process.env.SKIP_KHRONOS_BOOTSTRAP === '1' || isDeployCi();
}

/** public/ relative paths stripped from dist after vite build. */
export const KHRONOS_STRIP_DIRS = ['models/khronos'];
