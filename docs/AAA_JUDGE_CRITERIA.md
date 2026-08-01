# Volodka — Independent AAA Judge Criteria (LOCKED)

> **DO NOT WEAKEN.** Agents may not edit this file to lower the bar.
> The independent visual/gameplay judge must evaluate against these pillars.
> Goal is unmet until the judge issues an explicit **PASS**.

## Hard bar

The shipped browser experience must feel like a cohesive AAA-studio narrative RPG
(Disco Elysium depth × cinematic 3D presence), not a typical web toy.

Target: **stable ~60 FPS** on a mid laptop at High quality, with no plastic/low-poly
“kit bash” read dominating hero moments.

Procedural / agent-authored assets are allowed and expected — judge quality of
integration, lighting, scale, and feel, not whether every mesh is photogrammetry.

## Scoring pillars (each must be ≥ 8/10 for PASS)

1. **Meshes & scale** — human metric coherence; no toy rooms / giant props; characters read as people
2. **Textures & materials** — worn cloth, damp asphalt, aged plaster; **not** shiny plastic / default PBR chrome
3. **Lighting & atmosphere** — motivated practicals, wet night IBL, fog/grade with mood; hero hubs feel authored
4. **Shaders / PostFX** — bloom/AO/DOF/LUT support cinema without mush or neon candy overload
5. **Animation & locomotion** — idle/walk/run blend without hitch; no 360° spin-strafe; cinematic poses hand off cleanly
6. **Cutscenes & transitions** — soft fades/holds; no hard cuts between explore ↔ dialogue ↔ scene load
7. **HUD / menus / UX** — filmic, readable, non-spammy; poems & menus preserved; show-don’t-tell guidance
8. **Gameplay & living world** — meaningful interactions, schedules/ambient life, quests that play as cases
9. **Story presence** — choices and thought-cabinet weight; world reacts; golden path is clear without popup walls
10. **Performance** — ~60 FPS explore on High mid-laptop; adaptive quality must not permanently gut the look

## Verdict format (judge must use)

```
VERDICT: PASS | FAIL
SCORES: meshes= /10 materials= /10 lighting= /10 postfx= /10 animation= /10
        transitions= /10 hud= /10 gameplay= /10 story= /10 performance= /10
BLOCKERS: (concrete, file-level if possible)
NEXT: (top 3 fixes only)
```

PASS requires every pillar ≥ 8 and no critical blocker (soft-lock, broken controls, unreadable hero scene).
