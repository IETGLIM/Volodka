/** Tailwind v4 is wired via @tailwindcss/vite (enforce:'pre') in vite.config.ts.
 *  Local PostCSS therefore runs AFTER Tailwind expansion — the uiTextScale
 *  plugin rewrites px font-size literals (incl. generated text-[9px] utilities)
 *  into calc(Npx * var(--volodka-ui-text-scale)) so the «Масштаб интерфейса»
 *  slider scales the whole HUD (audit stage 79).
 *  Local config also prevents postcss-load-config from walking up to a parent
 *  postcss.config (e.g. on drive root) and breaking the build. */
import { volodkaUiTextScale } from './vite/uiTextScalePostcss.mjs';

export default {
  plugins: [volodkaUiTextScale()],
};
