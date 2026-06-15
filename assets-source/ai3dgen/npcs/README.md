# Quaternius animated NPC sources (CC0)

Pack: **Ultimate Modular Men Pack** (11) + **Ultimate Modular Women Pack** (9 used)  
License: [CC0](https://creativecommons.org/publicdomain/zero/1.0/) — [Quaternius](https://quaternius.com)

## Automated pipeline

```bash
npm run assets:quaternius-import -- --all
npm run assets:validate
```

Steps:

1. `--download` — fetches glTF from Quaternius Google Drive folders into `_quaternius_raw/`
2. `--extract` — converts to `male_01.glb` … `female_09.glb` under this folder
3. `--import` — copies mapped GLBs to `public/models/npcs/` and `public/models/characters/volodka/`

Status: `npm run assets:quaternius-import -- --status`

## Manual download (if Google Drive blocks automation)

1. Open [Ultimate Modular Men Pack](https://quaternius.com/packs/ultimatemodularcharacters.html) → **Download** (Google Drive).
2. Open [Ultimate Modular Women Pack](https://quaternius.com/packs/ultimatemodularwomen.html) → **Download**.
3. From each zip, extract **Individual Characters → glTF** (or FBX + convert in Blender).
4. Rename in pack order (see `scripts/quaternius-import.mjs` `MEN_GLTF` / `WOMEN_GLTF`) to:
   - `male_01.glb` … `male_11.glb`
   - `female_01.glb` … `female_09.glb`
5. Place files in this directory, then run:

```bash
npm run assets:quaternius-import -- --import
npm run assets:validate
```

## Mapping (source → game)

| Source | NPC / hero |
|--------|------------|
| male_01 | Володя (player_volodka) |
| male_02 | albert |
| male_03 | office_dmitry |
| male_04 | cafe_barista |
| male_05 | office_alexander |
| male_06 | chk_ru |
| male_07 | chk_based |
| male_08 | chk_stalker |
| male_09 | maxim |
| male_10 | zeka |
| male_11 | fisherman_trofim → `trofim.glb` |
| female_01 | zarema |
| female_02 | solnysh (Алина) |
| female_03 | maria |
| female_04 | chk_smert |
| female_05 | chk_elis |
| female_06 | chk_ritka |
| female_07 | anya |
| female_08 | baba_zina |
| female_09 | kate |

Credit: [Quaternius](https://quaternius.com) — CC0.
