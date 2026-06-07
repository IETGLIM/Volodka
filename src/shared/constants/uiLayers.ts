/**
 * UI layer z-index constants — single source of truth.
 * Use `style={{ zIndex: UI_LAYERS.XXX }}` in JSX.
 * NEVER use Tailwind z-NN classes or inline numeric zIndex for game UI.
 */
export const UI_LAYERS = {
  /** 3D Canvas — always at the bottom of the DOM stack */
  CANVAS: 0,
  /** Scene visual overlays (NoirOverlay, MatrixRain) */
  NOIR_OVERLAY: 3,
  /** In-world 3D labels, exit markers */
  WORLD_LABELS: 5,
  /** Glitch/scan-line CSS overlay */
  GLITCH: 7,
  /** HUD elements (health, minimap, compass, stress) */
  HUD: 10,
  /** Touch D-pad / interact — below menus & panels */
  MOBILE_CONTROLS: 42,
  /** Scene name banner */
  SCENE_BANNER: 20,
  /** Dialogue / story overlay */
  DIALOGUE: 30,
  /** Loot / notification toasts */
  TOASTS: 35,
  /** Examine panel */
  EXAMINE: 38,
  /** Mini-games (codebreaker, terminal, bash) */
  MINIGAME: 40,
  /** Pause / settings menu */
  MENU: 45,
  /** Combat UI */
  COMBAT: 50,
  /** Full-screen damage/heal flash (above combat UI) */
  DAMAGE_FLASH: 51,
  /** Panels (inventory, quests, poetry, journal) */
  PANEL: 55,
  /** HUD tooltips — above panels, below poem overlay */
  TOOLTIP: 58,
  /** Cinematic transition (fade-to-black) */
  CINEMATIC_TRANSITION: 95,
  /** Loading screen — always on top */
  LOADING: 100,
  /** Developer debug panel (F3) — above everything */
  DEV_PANEL: 200,
  /** Cyberpunk poem cutscene stack */
  POEM_NOISE: 998,
  POEM_VIGNETTE: 999,
  POEM_CRT: 1000,
  POEM: 1001,
} as const;

export type UILayerKey = keyof typeof UI_LAYERS;
