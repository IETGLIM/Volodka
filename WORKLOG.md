# WORKLOG

## 2026-06-02

### Branch

- `Testolodkaok`

### Completed

- Fixed store key collisions between UI and narrative slices by namespacing narrative state/actions.
- Corrected combat turn ordering for `skip_turn` effects and poem power cooldown handling.
- Fixed combat flee return behavior to avoid stale narrative return state.
- Improved audio initialization path for spatial ambient creation.
- Removed unsafe geometry disposal in NPC clone cleanup path.
- Added timer cleanup in `GLBPlayerModel` stand-up flow.
- Reworked `useDebouncedSelector` and batch action hooks to avoid stale snapshots.
- Fixed skill-check banner auto-hide behavior in narrative UI.
- Removed unused lazy panel module.

### Docs

- Added `README.md` with setup, architecture, and script usage.
- Added this `WORKLOG.md` for branch-level delivery tracking.
