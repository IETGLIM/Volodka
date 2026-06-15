# Ready Player Me NPC avatars — Volodka RPG

Twenty story NPCs ship as **Ready Player Me** GLB exports (Mixamo-rigged, CC0 Sketchfab fallback for extras). This pipeline **replaces Khronos/Quaternius CC0 placeholders** when `npc_*.glb` files are present under this folder.

## Workflow

1. **Create avatar** on [Ready Player Me](https://readyplayer.me/) (free tier — requires your account; CI never downloads avatars).
2. **Export GLB** (T-pose, no animations in RPM export).
3. **Optional Blender cleanup**
   - Scale to ~1.8 m height, apply transforms
   - Remove RPM branding mesh if present
   - Merge materials if needed for WebGL budget
4. **Drop file here** using the catalog name, e.g. `npc_albert.glb`.
5. **Import into the game**
   ```bash
   npm run assets:rpm-import -- --id npc_albert --file ./npc_albert.glb
   # or when all 20 files are present:
   npm run assets:rpm-import -- --apply-all
   npm run assets:validate
   ```

## Mixamo animation retargeting

RPM exports use the Mixamo skeleton. After Blender cleanup:

1. Upload the cleaned mesh to [Mixamo](https://www.mixamo.com/) (same Adobe account works).
2. Download **Idle**, **Walking**, **Talking** (or custom) as FBX *without skin*.
3. In Blender: import FBX, retarget to your RPM armature (Mixamo bone names match).
4. Export GLB with animation clips named `idle`, `walk`, `talk` to match `npcDefinitions` animation keys.

Until animations land, `GltfNPCModel` plays clip index 0 or falls back to procedural idle.

## Catalog — 20 NPCs

| Source file | Registry id | Public GLB | Visual brief |
|---|---|---|---|
| `npc_volodka.glb` | `player_volodka` | `characters/volodka/volodka_lod0.glb` | Hero — thin, glasses, tired poet |
| `npc_zarema.glb` | `zarema` | `npcs/zarema.glb` | 50+, headscarf, caring neighbor |
| `npc_alina.glb` | `solnysh` | `npcs/solnysh.glb` | Blonde, blue eyes — Solnysh/Alina |
| `npc_albert.glb` | `albert` | `npcs/albert.glb` | Beard, philosopher, café regular |
| `npc_barista.glb` | `cafe_barista` | `npcs/cafe_barista.glb` | Cyber prosthetic arm |
| `npc_alexander.glb` | `office_alexander` | `npcs/office_alexander.glb` | Suit, badge, tired IT lead |
| `npc_dmitry.glb` | `office_dmitry` | `npcs/office_dmitry.glb` | Thin, nervous senior dev |
| `npc_maria.glb` | `maria` | `npcs/maria.glb` | Victoria — dark hair, winter eyes |
| `npc_chk_ru.glb` | `chk_ru` | `npcs/chk_ru.glb` | CHK Tolpa — architect, hat |
| `npc_chk_based.glb` | `chk_based` | `npcs/chk_based.glb` | CHK — portwine sysadmin |
| `npc_chk_smert.glb` | `chk_smert` | `npcs/chk_smert.glb` | CHK — accountant philosopher |
| `npc_chk_stalker.glb` | `chk_stalker` | `npcs/chk_stalker.glb` | CHK — forest security scout |
| `npc_chk_elis.glb` | `chk_elis` | `npcs/chk_elis.glb` | CHK — QA bard, guitar |
| `npc_chk_ritka.glb` | `chk_ritka` | `npcs/chk_ritka.glb` | CHK — pier bard, junior tester |
| `npc_maxim.glb` | `maxim` | `npcs/maxim.glb` | Resistance leader, implants |
| `npc_anya.glb` | `anya` | `npcs/anya.glb` | Resistance hacker |
| `npc_zheka.glb` | `zeka` | `npcs/zeka.glb` | Old factory hacker |
| `npc_baba_zina.glb` | `baba_zina` | `npcs/baba_zina.glb` | 80-year-old solderer |
| `npc_trofim.glb` | `fisherman_trofim` | `npcs/trofim.glb` | Pier fisherman, ex-watchman |
| `npc_katya.glb` | `kate` | `npcs/kate.glb` | Librarian — glasses, quiet |

Code catalog: `src/config/rpmNpcCatalog.ts` · CLI: `npm run assets:rpm-import -- --list`

## Bootstrap priority

`npm run assets:bootstrap` copies CC0 Khronos placeholders **only when no RPM source** exists for that slot. If `assets-source/ai3dgen/npcs/npc_*.glb` is on disk, bootstrap stages the RPM file to `public/` instead.

## Licensing

- **Ready Player Me**: follow [RPM terms](https://readyplayer.me/terms) for commercial use.
- **Mixamo**: Adobe account, standard Mixamo license.
- **Interim CC0**: Khronos / three.js samples until RPM files land.

Attribution: `public/models/ATTRIBUTION.md`
