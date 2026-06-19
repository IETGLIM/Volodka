# External animation sources (Russia-accessible, no Adobe login)

Comparison of free Mixamo alternatives evaluated for Volodka RPG NPC schedule clips (idle/walk/talk/sit/sleep/work).

## Comparison table

| Source | License | Russia access | Skeleton | Sit | Sleep | Work | Quality vs modular interim | Format | Integration |
|--------|---------|---------------|----------|-----|-------|------|---------------------------|--------|-------------|
| **Quaternius UAL Standard** | CC0 | OpenGameArt direct zip ✓ | DEF-* → retarget to modular | `Sitting_Idle_Loop` ✓ | `Death01` prone only | `Fixing_Kneeling` ✓ | **Best applied** for sit/work | GLB | `npm run assets:ual-import` |
| Quaternius modular (embedded) | CC0 | Google Drive ✓ | Native modular | `Interact` ✗ | `Death` ✗ | `Interact` ✗ | Baseline interim | GLB | `assets:extract-animations` |
| KayKit Character Animations | CC0 | itch.io (manual) | KayKit rig — retarget | Simulation sit ✓ | Lying down ✓ | Interact ✓ | High (needs retarget) | FBX/GLTF | Manual + Blender |
| Kevin Iglesias Basic Motions FREE | Custom free | itch.io (manual) | Unity humanoid | Sitting variants ✓ | Sleep ✓ | — | High (needs retarget) | FBX | Manual + Blender |
| Humane Basics (oudarya) | CC0 | itch.io (manual) | Custom rig | ✓ | ✓ | ✓ | Medium (retarget) | FBX | Manual |
| Denys Almaral City People | CC-BY 4.0 | Ko-fi / Sketchfab | 3ds Biped / Unity humanoid | ✗ | ✗ | phone talk only | Low for sit/sleep | FBX | Retarget |
| abysmaljess sitting (Sketchfab) | CC-BY | Sketchfab | Unknown | ✓ | ✗ | ✗ | Medium | GLB | Retarget |
| RancidMilk CMU mocap pack | CC0-ish | itch.io 764 MB | Quaternius example rig | varies | varies | varies | High fidelity, heavy | FBX/GLTF | Retarget pipeline |
| Mixamo | Adobe ToS | **Blocked / unstable** | Mixamo native | ✓ | ✓ | ✓ | Gold standard | GLB | `assets:mixamo-import` |
| Mixamo mirror repos | **Illegal** | — | — | — | — | — | Do not use | — | — |
| Ready Player Me / ActorCore | ToS | Account + geo risk | RPM | Limited free | ✗ | ✗ | N/A for bulk clips | GLB | Existing RPM NPC path |
| Kenney.nl | CC0 | ✓ | Static props only | ✗ | ✗ | ✗ | N/A | — | — |
| OpenGameArt lowpoly dummy | CC0 | ✓ | Mixamo-compatible | ✗ | ✗ | sword only | Low | FBX | Compatible but no sit |

## Winners applied in this repo

| Activity | Clip | Source animation | Notes |
|----------|------|------------------|-------|
| **Sitting / rest / read** | `sitting.glb` | UAL `Sitting_Idle_Loop` | Real seated idle loop |
| **Working** | `working.glb` | UAL `Fixing_Kneeling` | Kneeling repair / desk-adjacent |
| **Sleeping** | `sleeping.glb` | UAL `Death01` | Still prone collapse — best in UAL Standard without Mixamo |
| idle / walk / talk | unchanged | Modular `Idle`, `Walk`, `Wave` | Already adequate |

## Pipeline

```bash
node scripts/extract-quaternius-animations.mjs   # idle, walk, talk from modular NPC GLB
npm run assets:ual-import                        # sit, sleep, work from UAL (auto-download)
npm run assets:optimize-animations
npm run assets:validate
```

Bone remapping: `scripts/lib/ualToQuaterniusBoneMap.mjs` (DEF-* → modular PascalCase).

## Remaining manual steps

1. **True sleep mocap** — download KayKit `Laying Down Idle` or Mixamo `Sleeping Idle` from itch.io/Mixamo when accessible; import via `assets:mixamo-import --clip sleeping --file …`.
2. **UAL v2.0 full library** — itch.io Standard has updated rig naming (matches modular natively); OpenGameArt zip uses DEF-* bones (retarget script handles this).
3. **Optional idle/walk upgrade** — UAL `Idle_Loop`, `Walk_Loop`, `Idle_Talking_Loop` after verifying v2.0 GLB on disk.

## Downloads cached locally

```
assets-source/animations/_downloads/ual-standard.zip   ← OpenGameArt (gitignored)
```

Attribution: `public/models/ATTRIBUTION.md`
