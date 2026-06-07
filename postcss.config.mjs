/** Tailwind v4 is wired via @tailwindcss/vite in vite.config.ts.
 *  Empty local config prevents postcss-load-config from walking up
 *  to a parent postcss.config (e.g. on drive root) and breaking the build. */
export default {
  plugins: [],
};
