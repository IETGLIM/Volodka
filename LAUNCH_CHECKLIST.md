# Volodka RPG — Launch Checklist

Use before tagging a production release. All items should be green.

## CI / quality gates

- [ ] `npm run check` passes (lint, typecheck, content validate, build, bundle budgets)
- [ ] `npm run test:unit` passes
- [ ] `npm run test:e2e` passes (golden path + smoke)
- [ ] `npm run assets:validate` passes (if processed models checked in)

## Cross-browser (WebGL2 + WASM Rapier)

Test **New Game → explore → save → combat → load save** on:

- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)
- [ ] Safari (macOS or iOS) — watch for WebGL context loss recovery
- [ ] Mobile Chrome or Safari — touch HUD, safe areas

## Performance

- [ ] First scene playable ≤ 3 s on target laptop ([DevPanel] load timeline / `firstScenePlayableMs`)
- [ ] Bundle budgets green (`npm run budgets`)
- [ ] No sustained FPS below budget on `volodka_room` and `street_night` (DevPanel)

## Content & progression

- [ ] Golden path Act 1 playable without soft-lock
- [ ] `npm run validate` — 0 content errors
- [ ] Quest `linkedStoryNodeId` spot-check on new content

## Assets & deploy

- [ ] Models CDN checklist in [DEPLOY.md](./DEPLOY.md) complete
- [ ] `VITE_MODELS_BASE` set correctly for production (if using CDN)
- [ ] `/basis/` and `/draco/` transcoder paths load (Network 200)
- [ ] Preview deployment smoke-tested before production promote

## Player safety

- [ ] Save slots: save, load, delete work
- [ ] Save export/import JSON works (Save Slot Manager footer)
- [ ] Auto-save slot indicator correct

## Accessibility & settings

- [ ] Dialogue/story choices have screen-reader labels
- [ ] Reduced motion toggle in Settings (or OS preference respected)
- [ ] Keyboard: Esc, panels, focus trap on modals

## Observability

- [ ] Client errors appear in console as `[Volodka:…]` structured logs
- [ ] Optional: `window.__volodkaLog` hooked in staging for error aggregation
- [ ] Boot failure shows Russian fallback UI (not blank screen)

## Documentation

- [ ] `readme.md` version matches `package.json`
- [ ] Changelog section updated for release

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| QA | | |
| Art (custom GLBs) | | |
