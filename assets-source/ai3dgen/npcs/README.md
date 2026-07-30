# Quaternius animated NPC sources (CC0)

Pack: **Ultimate Modular Men Pack** (11) + **Ultimate Modular Women Pack** (9 used)  
License: [CC0](https://creativecommons.org/publicdomain/zero/1.0/) — [Quaternius](https://quaternius.com)

## Visual identity (narrative policy)

Quaternius modular rigs share one body silhouette — not enough for a story RPG.

**In-game (default):** story NPCs render via **Npc Composer** — modular CC0 slots + palette from `NPCDefinition.appearance` (`src/config/npcComposer/recipes.ts`, `NpcComposerModel.tsx`).

**On disk:** Quaternius GLBs (`male_01.glb` … `female_09.glb`) are **animation rig references only** — Mixamo/UAL retarget, CI validation. They are **not** shown in-world unless a unique RPM/AI3DGen mesh is explicitly on disk.

Optional unique GLB override: manual drop or `npm run assets:rpm-import` (legacy; RPM unavailable in some regions).

## Ready Player Me (Stage 8 — skipped)

`RPM_NPC_GLB_URLS_ON_DISK` is empty — no RPM API keys or avatar exports on disk.

Hero NPCs (Albert, Zarema, barista, colleague) use **Quaternius CC0 GLBs** staged under `public/models/npcs/` via `assets:quaternius-import`. To wire RPM later:

1. Create avatars at [readyplayer.me](https://readyplayer.me/) (free tier).
2. Export GLBs to `assets-source/ai3dgen/npcs/npc_<id>.glb`.
3. Run `npm run assets:rpm-import -- --apply-all` — overrides CC0 when source files exist.

No paid AI3DGen API required for current ship path.

## NPC Composer pipeline

```bash
# Bake recipe → rigRef → source GLB manifest (animation tooling)
npm run assets:npc-composer

# Quaternius rig import (download / extract / process)
npm run assets:quaternius-import -- --all
npm run assets:validate
```

| Artifact | Purpose |
|----------|---------|
| `src/config/npcComposer/recipes.ts` | Per-NPC slot recipe (body, head, hair, top, …) + `rigRef` |
| `npc-composer-manifest.json` | Baked manifest: `npcId` → `rigRef` → `male_XX.glb` |
| `resolveNpcComposeRigRef(npcId)` | Runtime/tooling lookup for retarget source rig |

## Procedural animation layers

After Mixamo mixer (GLB) or limb animation (procedural), `npcProceduralLayers` adds:

- **Breathing** — chest/torso on idle/sit/listen
- **Blink** — `leftEye` / `rightEye` groups every 3–5 s
- **Subtle sway** — root micro-motion
- **Head + eye look-at** — layered on player proximity
- **Talk gesture** — right-arm waves during dialogue

Requires named groups: `head`, `torso`, `leftEye`, `rightEye`, `leftArm`, `rightArm`, `leftLeg`, `rightLeg`.  
Shared eyes: `ProceduralEyes.tsx`.

Frame order: `main → mixer → procedural → overlay → sprite` (`npcFrameBatch`).

## Automated Quaternius import

```bash
npm run assets:quaternius-import -- --all
```

Steps:

1. `--download` — fetches glTF from Quaternius Google Drive folders into `_quaternius_raw/`
2. `--extract` — converts to `male_01.glb` … `female_09.glb` under this folder
3. `--import` — runs `assets:process-catalog` (Draco/LOD)

Status: `npm run assets:quaternius-import -- --status`

## Manual download (if Google Drive blocks automation)

1. Open [Ultimate Modular Men Pack](https://quaternius.com/packs/ultimatemodularcharacters.html) → **Download**.
2. Open [Ultimate Modular Women Pack](https://quaternius.com/packs/ultimatemodularwomen.html) → **Download**.
3. From each zip, extract **Individual Characters → glTF**.
4. Rename in pack order (see `scripts/quaternius-import.mjs` `MEN_GLTF` / `WOMEN_GLTF`) to:
   - `male_01.glb` … `male_11.glb`
   - `female_01.glb` … `female_09.glb`
5. Place files in this directory, then run:

```bash
npm run assets:quaternius-import -- --import
npm run assets:validate
npm run assets:npc-composer
```

## Legacy mapping (1:1 Quaternius clone — superseded by Composer)

The table below was the old 1:1 rig→NPC map. Composer recipes now assign **unique slot combinations** per NPC; `rigRef` picks the retarget skeleton only.

| Source | Example NPC |
|--------|-------------|
| male_01 | player_volodka |
| male_02 | albert |
| female_01 | zarema |
| … | see `npc-composer-manifest.json` |

Credit: [Quaternius](https://quaternius.com) — CC0.
