# Volodka — AA Quality Roadmap (Free Stack Only)



> Honest plan to push this browser RPG toward **AA-studio visual + systems density** with **$0 spend**.

> Companion to `ARCHITECTURE.md` / `AI_SESSION_CONTEXT.md` / `readme.md`. Last updated: 2026-07-31 (Tick 51 architecture uniformity Wave 1).



---



## North-star AA definition (THIS stack)



AA for Volodka does **not** mean Unreal Nanite / console exclusives. It means:



| Pillar | Pass bar |

|--------|----------|

| **Look** | Coherent human metric scale, wet PBR streets, hero IBL, soft local shadows, per-scene grade/LUT, cinematic dialogue DOF — readable on mid laptop @ 45–60 FPS |

| **Feel** | Living schedules, stealth pressure, turn combat with identity (poems), skill checks that matter |

| **Depth** | Disco Elysium–class *choice density* on the golden path; side content that is authored cases, not stub objectives |

| **Ship** | Vite → Vercel SPA; gzip budgets; adaptive quality; no paid CDN / SaaS required |



**Blunt truth:** the engine scaffolding is already AA-*aspirational*. Content flesh and audio are indie. Claiming “120 hours AA” without a content factory is marketing, not engineering.



---



## Current quality verdict (audit snapshot)



| Area | Score vs AA | Notes |

|------|-------------|--------|

| Rendering pipeline | **B+** | PostFX, N8AO, ACES, Poly Haven PBR, quality tiers — strong for web |

| Scene parity | **B** | `street_night` / `city_square` / café / pier / rooftop selective wet lead |

| Characters | **C+** | Quaternius/CC0 + Mixamo; readable, not AA hero meshes |

| Audio | **C** | Clever procedural Web Audio; no authored score / VO |

| Narrative volume | **B** | ~516 story nodes, ~101 quests, 7 acts — Act 1–3 stubs thickening |

| Honest playtime | **~10–40 h** | Not 120 h |

| Save / a11y / budgets | **B** | Zod saves, reduced motion, bundle gates — web-AA appropriate |



---



## Free tech inventory



### Already in stack ($0)



- React 19, Vite 6, TypeScript, Zustand, Zod

- Three.js 0.172 + R3F 9 + Drei + `@react-three/postprocessing` + `postprocessing`

- Rapier (Wasm) + `@react-three/rapier`

- Poly Haven HDRI / textures / models (CC0 pipeline scripts)

- Kenney / Quaternius / Mixamo import scripts

- Procedural audio (`AudioEngine`, `MusicEngine`)

- Adaptive quality + scene GPU lifecycle + LOD

- Content validators, golden path, narrative pack lazy-load



### Add / lean harder on (still $0)



| Need | Free option |

|------|-------------|

| More props / facades | Poly Haven, Kenney, Quaternius, Poly Pizza CC0 |

| Animations | Mixamo (personal/non-commercial check), Universal Animation Library extracts already scripted |

| Music beds | Free CC0 loops (e.g. OpenGameArt) **or** deepen procedural act themes |

| VO | Browser TTS / optional local Whisper-free TTS later — never paid cloud API as requirement |

| GI-ish look | Better IBL + N8AO + contact blobs; skip paid SSR plugins |

| Content scale | Structure/text split + hub quest templates + authored expansion packs |



### Explicit “do not pay for”



- Unity/Unreal licenses as runtime host

- Paid asset stores as blockers

- Paid CDN / analytics / AI narrative APIs as gameplay requirements

- Photogrammetry / custom AAA character commissions (unless donated)

- Commercial middleware (FMOD Studio commercial, etc.) unless free tier is enough and optional



---



## Top 10 levers to AA on free stack



1. **Scene visual parity** — every hub gets hero fog/accents/postFX profile (Wave 1: `city_square`; tick 1: pier; tick 2: factory_roof / abandoned_factory)

2. **Metric coherence** — keep `metricScaleCoherence` as single source; no giant props

3. **Shadow grounding** — local point shadows + soft-falloff contact blobs on hero practicals

4. **Street/plaza GPU lifecycle** — schedule Poly Haven dressing preloads with scene transitions

5. **Material ceiling** — selective `MeshPhysical` (wet glass/asphalt/pier water), not blanket Physical

6. **NPC presentation** — Mixamo clip coverage + de-plasticize; defer mass GLB re-export

7. **Cinematic DOF / timelines** — autofocus on dialogue NPC (world-space); finish wake/plaza arrivals

8. **Content factory** — thicken quests to 6–12 beat cases; expand dialogue packs per act

9. **Act-themed audio** — procedural mood tables per act first; optional CC0 stems later

10. **Performance budget discipline** — never ship Ultra film stack that breaks Vercel first-playable



---



## Content strategy for ~120 h (systems, not promises)



120 h is a **systems + authoring pipeline** problem:



| Layer | Mechanism | Est. hours if executed |

|-------|-----------|------------------------|

| Golden path | Keep ~130 spine nodes; thicken each beat with 2–3 branches | 15–25 h |

| Hub exploration | 37 hubs × repeatable cases (rumors, poems, stealth jobs) | 25–40 h |

| Quest flesh | Convert stub 2-obj quests → DE-style investigations | 20–35 h |

| CHK · ТОЛПА + sides | Rotating dailies + reputation arcs | 15–25 h |

| Combat / stealth encounters | Authored encounters on existing enemy set | 8–15 h |

| Thought Cabinet / poems | New thoughts + poem world effects (poems stay Lebedev-owned) | 5–10 h |



**Factory rules**



1. Author **structure** in `*.structure.ts`, prose in `texts/*.json` (already split).

2. Ship content as **lazy narrative packs** (`narrativePackRegistry`) so boot stays within budgets.

3. Prefer **reuse** of scenes/props/NPCs with new dialogue over new GLBs.

4. Measure with `scripts/validate-content.ts` + narrative audit — count *words/choices*, not quest IDs.

5. Accept phased honesty: **40 h dense AA** first; 120 h only after factory is staffed (human or multi-session AI with strict validation).



---



## Performance budget (browser / Vercel)



From `config/performanceBudgets.json` + build gate:



| Metric | Target | Hard max |

|--------|--------|----------|

| Boot JS gzip | 450 KB | 650 KB |

| Game-start JS gzip | 1.2 MB | 1.8 MB |

| First playable | 3 s | 5 s |

| Draw calls | per-scene caps (e.g. street ~340) | enforced in runtime monitors |



**Rules of thumb**



- Hero PostFX only where `sceneVisualProfiles` says so

- Street dressing via `sceneGpuLifecycle` eviction + scheduled preload

- No SSR/SSGI until soft-work budget proves headroom

- Ultra = FPS first; film grain/chromatic stay high-only



---



## 30 / 60 / 90 day waves



### Days 0–30 — Visual coherence + presentation (Wave 1+)



- [x] Promote `city_square` to hero tier

- [x] Plaza accent lights + FogExp2 + fog/bg tables

- [x] Street dressing URLs in `preloadSceneGpuAssets`

- [x] Dialogue DOF world-space autofocus

- [x] Selective MeshPhysical wet glass / puddles on plaza + cafe (quality-gated)

- [x] Act 1–2 quest flesh: café whisper, radio, backroom, Albert alliance, Archive-7, hub relays (multi-beat)

- [x] Pier hub coherence: accent inheritance, night ambient, FogExp2 anim, light rain, wet water/puddles

- [x] Expand FogExp2 / accents to remaining thin hubs (factory_roof, abandoned_factory bunker exterior)

- [x] Contact-shadow blob soft falloff pass

- [x] Act 1–2: alberts_lesson / corridor_letter / pier_midnight_fishing → multi-beat cases

- [x] Remaining thin Act 1–2 stubs (`morning_ritual`, `pier_ritka_strings`) → multi-beat

- [x] Thin sides `library_lost_archive` + `chk_portwine_delivery` → multi-beat (Tick 4)

- [x] Thin sides `library_katya_research` + `chk_guitar_strings` → multi-beat (Tick 5)

- [x] Soft-lock: `chk_neon_archive_done` never set → hack beat + Based wire (Tick 5)

- [x] Thin sides `factory_zarya_memory` + `factory_baba_zina_tea` → multi-beat (Tick 6)

- [x] Soft-lock: Phase-5 bloom/samizdat/zarya/rooftop/evidence `_done` + `triggerQuest` on starts (Tick 6)

- [x] Soft-lock: Phase-5 bunker/defector/monument completion flags + multi-beat story (Tick 7)

- [x] Thin Act 6 sides `resistance_safehouse` + `resistance_defector_rescue` → multi-beat (Tick 7)



### Days 31–60 — Character + audio identity



- [x] Mixamo clip coverage audit; idle/talk/walk parity for schedule NPCs
  (Tick 3: Quaternius talk prefers Interact; strip Mixamo root translation; remaining retarget debt documented)

- [ ] Procedural **act mood tables** (Phase 12 without paid stems)

- [ ] Optional CC0 music stems behind feature flag (not required)

- [ ] NPC LOD impostor upgrade (billboard bake) if FPS allows

- [ ] Content: Acts 3–4 dialogue density + Thought Cabinet arcs



### Days 61–90 — Content factory + polish



- [ ] Hub case template generator (author-filled, validated)

- [ ] Balance / economy pass (Phase 14)

- [ ] Accessibility pass (contrast, subtitle timing, reduced motion on new FX)

- [ ] Visual judge (`.cursor/agents/aaa-visual-judge.md`) on all hero scenes

- [ ] Honest playtime re-estimate; publish “dense hours” not vanity quest count



---



## Wave 1 implemented



| Change | Why |

|--------|-----|

| `city_square` → hero in `sceneVisualProfiles` | IBL warmup, shadow scale, AO parity with `street_night` |

| Plaza accents + night/street lighting flags | Neon presence + local shadows |

| Cafe neon `shadowCaster` | Grounding under practicals |

| FogExp2 + fog/bg for plaza / pier / campfire | Atmospheric depth |

| Street dressing preload in `sceneGpuLifecycle` | Fewer first-frame stalls on street/plaza |

| DOF `target` from `dialogueFocusTarget` | Cinematic dialogue focus lock |



---



## Wave 2 implemented (verified this tick)



| Change | Why |

|--------|-----|

| Selective MeshPhysical wet glass / puddles (`city_square`, `cafe_evening`) | Material ceiling without blanket Physical |

| `meshPhysicalWet` quality gate + coarse-pointer disable | Keep mid/low + mobile safe |

| Act 1 café whisper / radio / backroom multi-beats + flag wiring | Quest density via existing schemas |

| Expansion stubs: Albert alliance, Archive-7 multi-node chains | Side cases, not stub objectives |

| Hub relays (café→office, samizdat, pier frequency) thickened | Act 2 exploration coupling |



---



## Tick 1 (pier / accent inheritance)



| Change | Why |

|--------|-----|

| `SceneAccentLights` falls back to `resolveDerivedSceneId` | **Bugfix:** `pier_evening` / `factory_roof` / `zarema_room` had no accents |

| Pier night ambient + richer `river_pier` accents (fire shadowCaster) | Warm fire vs cold water readable |

| Pier FogExp2 anim + IBL intensity | Match street/plaza atmospheric language |

| Pier `shadowMapScale` / NPC LOD / ambient boost in profiles | Shadow grounding + schedule density |

| Light rain weather on pier + MeshPhysical water/puddles | WetStreetGround apron actually reads wet |

| `city_square` neon rain reflection pools | Plaza/street wet neon coherence |



---



## Tick 2 (this session)



| Change | Why |

|--------|-----|

| Contact-shadow soft falloff (more stops, long penumbra) | Soft grounding without hard rim blobs |

| `factory_roof` FogExp2 density/colors/anim + own accents + AO/shadow profile | Thin hub parity beyond parent `rooftop_edge` |

| `abandoned_factory` FogExp2 + shadowCaster yard lamp + shadowMapScale | Bunker-approach exterior cues |

| Scene fog tables prefer raw `sceneId` over derived parent | Variants can densify without fighting inheritance |

| `alberts_lesson` / `corridor_letter` / `pier_midnight_fishing` → 6–7 beats + story nodes | Stub → investigation density |

| Pier third-pile examine interactable | Exploration payoff after fishing |

| Dialogue DOF uses `getWorldPosition` | **Bug fix:** local NPC pos broke focus under scene parents |



---



## Tick 3 (this session)



| Change | Why |

|--------|-----|

| `morning_ritual` → 6 beats (bookshelf / tea / window) + flag wiring | Stub → case density on Act 1 prologue |

| `pier_ritka_strings` → 6 beats (Elis → office → pack → song) | Stub → investigation; **bug fix:** `pier_ritka_get_strings_done` was never set |

| Elis / Ritka dialogue routes into multi-beat nodes | Exploration/NPC interaction parity |

| `CinematicTimelineRunner.cleanupRunnerState` resets `sequenceStartedRef` | **Bug fix:** skipped non-intro timelines blocked next start |

| Quaternius talk: Interact before Wave; Mixamo strip root translation | Cheap foot-slide / talk flail mitigation |

| `factory_roof` in dense-industrial AO drop + NPC LOD scale | Soft-work perf hygiene without playtest |

| Interactable near-tie prefers NPC over zone | Dialogue focus when scores collide |



### Mixamo / retarget debt (not fixed this tick)



- Full Quaternius↔Mixamo bone remap still incomplete for hand slots / Rig_Medium leftovers (filter drops orphans; hip sway OK).

- Dedicated gesture clip still aliases to `talking`.

- Capsule↔clip stride matching for long patrols remains feel debt — needs authored in-place clips or stride sync, not more lights.



---



## Tick 4 (this session)



| Change | Why |

|--------|-----|

| `library_lost_archive` → 6 beats (Фонд → key → basement → gate → recover → digitize) | Stub → investigation case |

| `chk_portwine_delivery` → 6 beats (Based → Albert → crate → street seal → deliver → toast) | Stub → delivery case; Based greeting/return wired |

| `morning_ritual_intercom` on ignore + drop coding:3 gate on corridor intercom | **Bug fix:** unwinnable ritual objective |

| `CinematicTimelineRunner` one-shot camera-acquire retry (120ms) | **Bug fix:** timelines after cutscene priority fail-silent |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 5 (this session)



| Change | Why |

|--------|-----|

| `library_katya_research` → 6 beats (schema → firmware cross → night → Marat node → printout) | Stub → Act 4 investigation; Kate greeting resume wired |

| `chk_guitar_strings` → 6 beats (brief → office → return → blind song → close) | Stub → delivery case; Elis + office colleague wired |

| Guitar path no longer auto-sets `pier_ritka_elis_pack_ready` / skips to Ritka deliver | **Bug fix:** flag contamination / pack skip |

| `quest_act2_chk_neon_archive` hack beat sets `chk_neon_archive_done` | **Bug fix:** never-set objective soft-lock |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 6 (prior)



| Change | Why |

|--------|-----|

| `factory_zarya_memory` → 5 beats (snow → storm → photo → restore) | Stub → Act 5 investigation; Baba Zina greeting/return resume |

| `factory_baba_zina_tea` → 6 beats (kettle → mint → hum → 1987 history → done) | Stub → character case density |

| Phase-5 bloom α/β/γ + samizdat pier/CHK/library + zarya fragments 1–3 | **Bug fix:** never-set `park_cyber_bloom_*` / `samizdat_*` / `zarya_memory_fragment_*` soft-locks |

| Phase-5 rooftop repair + Zarema secure beats | **Bug fix:** never-set `quest_act4_rooftop_broadcast_setup_done` / `quest_act3_zarema_evidence_run_done` |

| Phase-5 starts now `triggerQuest` (not only `_active` flags) | **Bug fix:** quests never activated from start nodes |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 7 (prior)



| Change | Why |

|--------|-----|

| `quest_act5_bunker_code_poem_break` → key → break beats | **Bug fix:** never-set `bunker_poem_key_found` / `quest_act5_bunker_code_poem_break_done` |

| `quest_act6_defector_rescue_expanded` → infiltrate → free → escape | **Bug fix:** never-set `defector_freed_from_cell` / `_done`; infiltrate now `flag_set` |

| `quest_act7_poets_monument_inscription` → approach → inscribe | **Bug fix:** never-set `quest_act7_poets_monument_inscription_done` |

| `resistance_safehouse` → 6 beats (list → filters → 433 → poem mesh → beds → done) | Stub → Act 6 multi-beat case |

| `resistance_defector_rescue` → 5 beats (brief → tunnel → poem stun → extract → Oleg) | Stub → Act 6 multi-beat rescue |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 8 (prior)



| Change | Why |

|--------|-----|

| Maxim/Anya greeting + return → resistance safehouse / defector mid-beat resume | **Bug fix:** multi-beats unreachable after leaving dialogue mid-quest |

| Maxim also resumes `quest_act6_defector_rescue_expanded` infiltrate/free | Phase-5 parallel raid re-entry |

| `resistance_bunker_hub` gated starts + mid-resume choices | **Bug fix:** re-offer / soft-lock on hub re-entry |

| `quest_act7_poets_monument_inscription` → 5 beats (plate → recall → carve → inscribe) | Stub → Act 7 case density; flags wired |

| Street poet greeting/return → monument start + mid-resume | Exploration entry for Act 7 side |

| Phase-5 monument journal hints match new objectives | Guidance parity |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 9 (this session)



| Change | Why |

|--------|-----|

| `act6_secret_archive` → 5 beats (hatch → door → decode → extract → seal) | **Bug fix:** never-set `act6_secret_archive_decoded` / `_saved` soft-lock; was wrongly linked to main factory investigation |

| Factory hatch interactable + approach hub mid-resume | Full 3D RPG entry / re-entry for archive side |

| `park_explore_mode` gated monument + epilogue choices | Hub entry beyond street-poet-only |

| Park obelisk interactables (start + mid plate/carve + epilogue) | Physical park discovery / resume |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 10 (prior)



| Change | Why |

|--------|-----|

| Soft-lock scan: **24 → 5** never-set `flag_set` leftovers | Wired highest-leverage startable Act 2/4 side chains |

| `bank_transfer` → approach → trace → culprit → moral | **Bug fix:** never-set `traced_bank_transfer` / `identified_bank_culprit` / `bank_moral_choice_made` |

| `digital_ghost` → approach → traces → firewall → recover | **Bug fix:** never-set `detected_ai_traces` / `firewall_bypassed` / `ai_fragment_recovered` |

| `banking_crash_verify` after bash solve | **Bug fix:** never-set `banking_system_recovered` |

| `voice_of_the_past` listen 1→2→final + factory hub/module | **Bug fix:** never-set `listened_recording_*` |

| `night_watch` child/friend + `poem_undercover` infiltrate→extract | **Bug fix:** never-set mid-chain flags |

| `voices_of_factory` poem→protect; `old_code` living/decode flags | **Bug fix:** never-set `read_factory_poem` / `dmitry_factory_protect` / `found_living_code` / `decoded_poetic_code` |

| Interactables + Zarema/Lena/hub mid-resume | Full 3D RPG re-entry for bank/AI/crash/undercover |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 11 (prior)



| Change | Why |

|--------|-----|

| Soft-lock leftovers: Act 4 **5 → 0** targeted never-set flags | Closed Alexander rooftop / last-poem / mole / library archive |

| `roof_of_the_world` → approach → ending (word/force/poem) | **Bug fix:** never-set `roof_ending_chosen` |

| `last_poem` → approach → compose → recite | **Bug fix:** never-set `poem_composed` / `final_poem_recited` |

| `blind_spot` → Sergey logs → identify → Oleg confront | **Bug fix:** never-set `mole_identified` |

| `archive_of_forgotten` → meet → vault codebreaker → save | **Bug fix:** never-set `archive_poems_saved` |

| Rooftop/cafe/library hubs + interactables + dialogue resume | Full 3D RPG re-entry for Act 4 finales |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 12 (prior)



| Change | Why |

|--------|-----|

| Soft-lock scan: **0** never-set `flag_set` outside minigame runtime | Act 5+/epilogue/sides already set via story + engine `setFlag` |

| `machine_confession` → `linkedStoryNodeId: machine_confession_scene` | **Bug fix:** journal continued into `factory_basement` without confession gate |

| Basement Zarya zone gated + `triggerQuest` on listen | Resume / startable when `found_quantum_computer`; hide after fate |

| Albert greeting/return + backroom hubs/zones for `chk_portwine` | **Bug fix:** mid-chain soft-lock — no Albert dialogue resume for «777» |

| CHK / night-campfire / office hubs for portwine + guitar | Full 3D RPG re-entry for CHK side chains |

| `room_epilogue_letters` interactable (Act 7) | Letters reachable in room after legacy — matched park monument pattern |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 13 (prior)



| Change | Why |

|--------|-----|

| Act 6 closed-overlay mid-resume: factory / street / office / cafe / bunker hubs | **Bug fix:** traitor → resistance → heist unreachable after leaving story overlay |

| Maxim / Anya / Zeka / Dmitry greeting+return → spine mid-beats | Full 3D RPG dialogue re-entry for Act 6 main chain |

| Gated Act 6 interactables (logs, confrontation, cafe plan, office terminal, Nadzor) | Physical anchors with `requiredFlag` / `hiddenWhenFlag` |

| `act6_resistance_briefing` sets `three_defectors_recruited` + `resistance_network_established` | **Bug fix:** underground_resistance mid-objectives only completed after heist planning |

| Main Act 6 quests get `linkedStoryNodeIds` multi-beat lists | Journal / continue can target mid-chain nodes |

| `factory_explore_mode` choice texts resynced in act5.json | **Bug fix:** voice/archive labels were shifted by stale JSON blob |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 14 (prior)



| Change | Why |

|--------|-----|

| `system_infiltration` mid-resume: factory hub + core_choice after guardian; split interactables | **Bug fix:** leave at core after victory → no re-entry (zones hid on `nadzor_guardian_defeated`) |

| `rooftop_confrontation` mid-resume: factory_roof hub + showdown/final zones + linked nodes | **Bug fix:** roof interactable required `act6_infiltration_ready` before showdown enter; final beat unreachable |

| Maxim / Zeka / Anya greeting+return → core / rooftop / Act 7 guild+shutdown | Full 3D RPG dialogue re-entry for late Act 6 → 7 |

| Act 7 hub mid-resume: cafe / library / factory / park / rooftop / room + interactables | Beyond monument/letters — rebuild → archive → takedown → poem → legacy |

| Act 7 main quests `linkedStoryNodeIds` multi-beat lists | Journal / continue targets mid-chain nodes |

| `rooftop_edge` wet-street planar + rain puddles (MeshPhysical gated) | Free-stack visual parity for Act 6/7 roof hub |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 15 (prior)



| Change | Why |

|--------|-----|

| `chk_forest_zorge` → industrial damp sheen + dew discs + ground/path polish | Wet/frost parity for thin outdoor CHK hub (snow weather — no planar reflector) |

| Campfire ash ring damp on forest + night campfire | Visual hygiene; was night-only |

| Pier evening / library / CHK / office hubs mid-resume fishing+strings+archive+Katya | **Bug fix:** Act 2–5 side chains dead after closing overlay |

| Pier/library gated interactables (bass, Ritka deliver, archive gate/digitize, Katya desk) | Full 3D RPG physical re-entry |

| Mixamo foot-slide | **Skipped** — no small safe fix beyond Tick 3 root-translation strip; needs clip re-export / stride sync |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.
- Tick 15 confirmed: no additional cheap foot-slide fix without retarget pipeline work.



---



## Tick 16 (this session)



| Change | Why |

|--------|-----|

| `park_day` → industrial damp sheen + dew discs + path/pond polish | Outdoor dew parity with forest pattern (mist hub — no planar reflector) |

| `park_explore_mode` gates Act 3 warning continue on `zarema_arrested` | **Bug fix:** inscription/continue stayed after arrest |

| Park hub + zones: cyber bloom α→β→γ mid-resume | **Bug fix:** leave mid-bloom → no 3D re-entry |

| Office hub + zones: detention breach → Zarema cell mid-resume | **Bug fix:** Act 3 rescue spine dead after closing overlay |

| `zarema_rescue` `linkedStoryNodeIds` multi-beat list | Journal / continue targets mid-chain nodes |

| `park_inscription_stone` `hiddenWhenFlag: zarema_arrested` | Physical anchor hides after spine leaves park |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 17 (this session)



| Change | Why |

|--------|-----|

| `street_winter` sidewalk / snow overlay / ice puddles via `getWinterIceSheenSettings` | Sidewalk was hardcoded; ground already on WetStreetGround |

| `WetStreetGround` applies `sheenBoost` on winter PBR + procedural fallback | Knobs were defined but unused |

| `factory_explore_mode` + zones: vault siege → hide network mid-resume | **Bug fix:** leave mid-`vault_defense` → no 3D re-entry |

| `vault_defense` `linkedStoryNodeIds` multi-beat list | Journal / continue targets siege + hide |

| act5 structure/text choice sync for vault mid-resume lines | Hub choice/text parity |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 18



| Change | Why |

|--------|-----|

| `maria_truth` mid-resume: cafe / factory / room hubs + 3D zones | **Bug fix:** leave mid-mystery/revelation → no 3D re-entry |

| `maria_truth` `linkedStoryNodeIds` + `maria_truth_started` on mystery enter | Journal / continue + hub gating |

| Barista dialogue: Act 3 ask about Victoria → `barista_maria` | Wire ask-barista beat after records |

| `street_night` sidewalk + puddles via `getRainWetSidewalkSettings` / wet puddle knobs | Outdoor wet hygiene (raised sidewalk was dry) |

| Pier plank deck via `getRainWetPlankSettings` + shared puddle params | Plank wet parity with apron reflector |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 19 (this session)



| Change | Why |

|--------|-----|

| `bank_transfer` office culprit + home moral hubs/zones; moral exit → `home_evening_explore_mode` | **Bug fix:** culprit/moral beats on wrong scene hubs after overlay close |

| `digital_ghost` office hub: traces → firewall → recover mid-beats | Leave mid-AI dig → hub re-entry skips coarse approach |

| `roof_of_the_world` / `last_poem` rooftop hub + zones split by confronted/composed | **Bug fix:** leave mid-finale → ending/recite unreachable vs coarse approach |

| Alexander dialogue roof mid-resume split | Talk path parity with hub |

| `cafe_poetry_reading` / `factory_recordings` `hiddenWhenFlag` | Soft-lock hygiene after extract / final listen |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 20 (this session)



| Change | Why |

|--------|-----|

| `voices_of_factory` poem→protect hub/zone split; poem node mid-router | **Bug fix:** leave after read → re-entry replayed poem; JSON choice text stole “free explore” label |

| `basement_explore_mode` act5.json choice texts realigned (8 slots) | **Regression:** voices choice labeled “Свободно исследовать подвал” |

| `blind_spot_confront` + office hub/zone; confront obj → `flag_set mole_confronted` | **Bug fix:** leave after identify → no 3D/office re-entry to finish quest |

| Oleg greet/return `missingFlag: mole_confronted` | Soft-lock hygiene — confront choice no longer sticky |

| Cafe approach router + basement registry entry nodes | Closed-overlay mid-resume parity with bank_transfer |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 21



| Change | Why |

|--------|-----|

| `voice_of_the_past` factory hub listen_1/2/final split; zone trio; listen mid-routers + leave | **Bug fix:** coarse hub/zone always → approach until final; leave mid-listen → no 3D beat resume |

| Factory registry entry nodes for voice listen chain | Closed-overlay mid-resume parity |

| `poem_undercover` cafe hub infiltrate→identify→extract + zone trio; node mid-routers | **Bug fix:** same coarse approach until extract; leave mid-reading stuck |

| Cafe registry entry nodes for undercover chain | Closed-overlay mid-resume parity |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 22



| Change | Why |

|--------|-----|

| `archive_of_forgotten` meet→vault→save hub/zone split; approach mid-router; mid-resume zone | **Bug fix:** after meet, hub had no mid-beat until vault; leave mid-quest stuck |

| Vault `archive_vault_accessed` only on codebreaker success (QuestTracker); no zone-interact setFlag | **Bug fix:** abort minigame → save open → poems saved → unlock forever stuck |

| Solnysh zone → meet only; vault hides on `archive_vault_accessed`; save entry node | Soft-lock hygiene + closed-overlay parity |

| `banking_crash` bash laptop/office hide after solve (verify stays) | Soft-lock hygiene — overlapping hack after bash done |

| `street_winter` registry entry nodes for night_watch child/friend | Closed-overlay mid-resume |

| Library window cool fill + bloom/AO; denser winter FogExp2 + fog anim | Uneven hub lighting/fog coherence |

| `street_night` selective MeshPhysical shop glass + neon fascia (`streetShopWindow`) | Wet parity free-stack vs plaza/café |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 23 (this session)



| Change | Why |

|--------|-----|

| `secrets_of_old_code` cafe find→decode hub/zone + registry entry nodes | **Bug fix:** living-code path only via Act 5 peaceful; leave mid-cafe soft-locked |

| `old_code` / `old_code_read` return to `cafe_explore_mode`; copy-later sets find + triggers quest; mid-router | Soft-lock hygiene — study-later / leave mid-decode recoverable |

| `office_openstack_terminal` hides after `openstack_terminal_solved` | Soft-lock hygiene — sticky OpenStack after solve |

| Pier selective MeshPhysical lantern/bottle glass (`pierLanternGlass`); `river_pier`/`pier_evening` in selective wet list | Wet parity free-stack vs plaza/café/street |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Tick 23 (this session)



| Change | Why |

|--------|-----|

| `echo_of_vladimir` library hub kate→room→unlock→read mid-resume; zone quintet; poetry unlock flag; approach router | **Bug fix:** closed-overlay library had no 3D re-entry after `vladimir_echo_started`; leave mid-read stuck |

| Kate greeting + registry entry nodes for echo chain | Closed-overlay / dialogue mid-resume parity |

| `traitor_in_the_guild` leave choices on investigation/discovery/revealed; `act6_traitor_approach` mid-router; factory hub + mid-resume zone | Soft-lock hygiene — leave mid-logs stuck / forced office jump |

| CHK forest / campfire selective MeshPhysical `campfireBottleGlass` on portwine bottles | Outdoor wet hygiene free-stack vs pier/rooftop |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.



---



## Next 3 actions

1. MeshPhysical thin hub gap: `home_evening` window/glass accents (still off selective wet list; kitchen hub for banking leave).

2. Mixamo ↔ Quaternius full bone remap (hip filter + talk fallback still interim).

3. expansionQuestStory / act6–7 expanded next-only chains (leave-scan); quiet-hour hub↔vignette loops are intentional — do not “fix” into explore hubs.

---



## Blockers / risks



- **120 h** requires sustained authoring; code alone cannot invent AA prose volume.

- **GLB mass re-export** marked debt in `metricScaleCoherence` — do not block shipping on it. (Working tree has smaller GLBs; treat as asset pipeline, not this tick’s code.)

- Module-level `useGLTF.preload` in street/plaza visuals still exists (belt-and-suspenders with lifecycle); removing needs a transition smoke test.

- Procedural audio will never equal a composed score without free stems + mixing time.

- Forest still places a nearby Kenney guitar beside the procedural lean spot — intentional density, not coplanar z-fight.

- Parallel agent may be touching Vite preload / Vercel cache — do not edit `vercel.json` / `vite.config.*` / SW from AA leave ticks.



---



## Tick 51 (this session)

| Change | Why |
|--------|-----|
| Target Uniform Architecture section + migration table in `ARCHITECTURE.md` | Whole-codebase uniformity north star (not poem-only) |
| `docs/ARCHITECTURE_UNIFICATION.md` Wave 1 done + ordered backlog | Sequential remaining waves |
| Interstitial: drop parallel discovery busy flag; `getActiveExclusiveInterstitialKinds` | One exclusive-UI gate (poem reveal reference) |
| Remove dead `QualityPreset` knobs (instancing/impostors/bakedLighting) | Quality gates = live fields + `qualityFeatureGates` only |
| Poem discovery language: suppress toast/float mirrors; registry + shared message helper | One discovery UX (`PoemRevealHost`) |
| Document locomotion input write path on `VirtualControlsState` | One virtual-axis writer |

---



## Tick 50 (this session)

| Change | Why |
|--------|-----|
| Unified `poemRevealOrchestrator` + `PoemRevealHost`/`PoemRevealShell` (modes: discovery / power_ritual / explicit_read, FIFO) | One sequential poem UI — kill parallel discovery/cutscene mounts |
| Legacy `PoemDiscoveryReveal` / `PoemReadingCutscene` → re-export host | Consolidate, don't add a 6th path |
| `getPoemCombatExcerptLines` on combat ability cards/tooltips | Same excerpt SoT; keep combat pace |
| `terminal_boot_poem` frame from `formatTerminalPoemFrame` | No hardcoded 4-line verse copy |
| FirstReadingCelebration stays quest overlay; waits `isPoemRevealBusy`, uses `getPoemExcerpt` | Shared data + sequential gate without inventing 2nd typography |
| ARCHITECTURE.md poem reveal section | Docs match pipeline |

---



## Tick 49 (this session)

| Change | Why |
|--------|-----|
| Shared `getPoemExcerpt` / `formatPoemExcerptText` (4 non-empty lines + fragment flag) | Single source for discovery + first-reading |
| `PoemDiscoveryReveal` + orchestrator on `poem:collected` (session gate, CinematicShell typewriter) | Discovery was toast-only — no verse |
| FirstReadingCelebration typewrites 4 poem lines; matrix quote = kicker; fragment + combat cue | Was quote-only typewriter + 3 static lines |
| Celebration waits for discovery end; skips re-typewriter if reveal already seen | Avoid stacked fragment beats on poem_2 |
| Bookshelf / any `collectPoem` path shares the same reveal | Unify fragment beat |

---



## Tick 48 (this session)

| Change | Why |
|--------|-----|
| Leave-scan: Act 4 quiet-hour vignettes = intentional `→ act4_quiet_hour` hub loops — **not** soft-locks | Avoid hub↔vignette / explore-mode thrash |
| `banking_crash_verify` leave → `home_evening_explore_mode` (`!banking_system_recovered`) | **Bug fix:** next-only forced confirm → kitchen |
| `last_poem_compose` leave → `rooftop_explore_mode` (`!poem_composed`) | **Bug fix:** next-only forced recite mid-compose |
| Rooftop registry `entryNodeIds` + `last_poem_compose` | Closed-overlay mid-resume after leave |
| Hub/zone mid-resume already present (home verify + roof approach/ledge) | Re-entry after leave |
| Test: banking verify / last poem compose leave + hub mid-resume | Regression guard |
| `act4SideQuestStory` leave-scan = **0** next-only | Tick target clean |

---



## Tick 47 (this session)

| Change | Why |
|--------|-----|
| `pier_ritka_office_string` leave → office hub; `pier_ritka_elis_pack` leave → campfire hub | **Bug fix:** office/pack forced overlay — leave stuck |
| Zones `office_ritka_string` + `chk_campfire_ritka_pack`; registry entry nodes | Full 3D RPG / closed-overlay mid-resume |
| Office colleague greeting/return → `pier_ritka_office_string` | Dialogue mid-resume parity with guitar path |
| Act 4 `bank_transfer` trace/culprit + `digital_ghost` traces/firewall + `night_watch_child` leave → hubs | Soft-lock hygiene — leave-scan leftovers; hub mid-resume already existed |
| Test: ritka leave/hub/zone/dialogue + Act 4 leave/hub mid-resume | Regression guard |

---



## Tick 46 (this session)

| Change | Why |
|--------|-----|
| Brace-aware leave-scan: phase5 / resistance / factory / epilogue / act6 core = **0** next-only | Confirmed Tick 45 targets clean — no redo |
| `library_lost_archive` leave on descent/gate/found → basement hub; library hub descent mid = `!basement_entered` | **Bug fix:** mid-archive forced overlay — leave stuck |
| `library_katya_research` leave on schema/crossref/night/marat → library hub; hub + Kate dialogue mid-split; zones | Soft-lock hygiene — leave mid-schema/night stuck |
| `pier_midnight_fishing` leave on start/sit/bass/key → pier hub; sit→bass→key mid-resume + zones | **Bug fix:** mid-fishing forced overlay only |
| Registry entry nodes for library / basement / pier fishing beats | Full 3D RPG re-entry |
| Test: archive / Katya / fishing leave + mid-resume | Regression guard |

---

## Tick 45 (this session)

| Change | Why |
|--------|-----|
| Verified `act6_secret_archive` / `machine_confession` / `echo_of_vladimir` leave + hub/zone mid-resume already shipped | Prompt targets 1–2 done — no redo |
| `resistance_defector_rescue` leave on start/tunnel/poem_stun/extract → bunker / street hubs | **Bug fix:** mid-raid forced overlay only — leave stuck |
| Bunker hub + `bunker_explore_mode` mid-split poem_stun vs extract (was coarse until done) | Soft-lock hygiene — leave mid-extract replayed poem |
| `street_bench_view` mid-resume tunnel→stun→extract; Anya return extract split | Closed-overlay / dialogue mid-resume parity |
| Zones: bunker start + street stun/extract; registry entry nodes | Full 3D RPG re-entry |
| Test: defector leave + hub/zone/dialogue extract mid-resume | Regression guard |

---

## Tick 44 (this session)

| Change | Why |
|--------|-----|
| Act 3 park cyber bloom α/β leave → `park_explore_mode` (hub/zone mid-resume already existed) | **Bug fix:** mid-bloom forced overlay — leave stuck without 3D re-entry |
| Act 3 `quest_act3_zarema_evidence_secure` leave → basement hub; library + basement hub mid-resume; day/basement zones | **Bug fix:** secure beat forced complete; no basement 3D re-entry |
| Registry: park bloom α–γ + library evidence start/secure entry nodes | Closed-overlay mid-resume parity |
| Test: bloom α/β leave + evidence secure leave/hub/zone | Regression guard |

---

## Tick 43 (this session)

| Change | Why |
|--------|-----|
| Act 2 `quest_act2_server_poem_hunt` office→pier→CHK scan beats + leave + hub/zone mid-resume; objectives `flag_set` | **Bug fix:** start-only stub / location_visited soft-complete; leave mid-hunt stuck |
| Act 2 `quest_act2_chk_neon_archive` leave on hack + cafe/CHK hub mid-resume + cafe zone | **Bug fix:** forced-overlay hack until archive taken |
| Registry entry: office/pier/CHK/cafe for poem hunt + neon hack | Closed-overlay mid-resume parity |
| `cafe_evening` espresso body/dome/portafilter/tray/cup MeshPhysical (high/ultra) | Counter machine AA sheen — cups alone left body Standard |
| Test: Act 2 poem hunt + neon leave/mid-resume | Regression guard |

---

## Tick 42 (this session)

| Change | Why |
|--------|-----|
| `factory_basement` selective MeshPhysical CRT (`crtTerminalGlass`) on Заря-М seam + desk terminal | Industrial CRT/glass parity vs albert/library/guild/bunker |
| Act 6 `act6_bridge` / `act6_maria_warning` leave → room/street hubs + open/resolved flags + hub mid-resume | **Bug fix:** Act 6 open forced overlay only — no explore exit |
| Act 7 ending + legacy mirrors leave → cafe/library/winter hubs; registry entry nodes; hub mid-resume | **Bug fix:** ending/mirror forced overlay until true_end |
| Registry: room/street/cafe/library/winter entry nodes for bridge/maria/endings | Closed-overlay mid-resume parity |
| Act 7 `act7_bridge` leave → `rooftop_explore_mode`; open/resolved flags; hub + zone mid-resume | **Bug fix:** Act 7 open forced overlay only — no explore exit (zone already expected flags) |
| Act 6 `act6_battle_victory` leave → factory hub; open/resolved; hub/zone mid-split vs prep | **Bug fix:** leave mid-core-choice forced overlay; prep zone competed after victory open |
| `factory_basement` selective MeshPhysical oil spill + puddle discs (`getWetPuddlePhysicalParams`) | Industrial wet parity free-stack vs CRT-only |
| Act 6 `act6_nadzor_battle` leave → factory hub; open/resolved; hub/zone mid-resume; prep hides on battle open | **Bug fix:** last Act 6 single-choice combat forced overlay — retreat then re-enter |
| **Live** factory hub (act5 pack): battle mid-choice + prep `missingFlag: act6_nadzor_battle_open`; removed dead auto-hub factory block | **Bug fix:** ACT_PACK_DEFINED meant sceneExploreHubs factory mid-resume never mounted |
| `library_basement` selective MeshPhysical rain-spill oil disc | Archive wet parity free-stack vs CRT-only + factory oil |
| `cafe_evening` table cup clearcoat MeshPhysical (high/ultra) | Clutter AA read free-stack |
| Tests: act6 nadzor leave + act7 bridge leave + factory hub/zone wiring | Regression guard for overlay soft-locks |
| Act 6 JSON leave labels for investigation / discovery / revealed | **Bug fix:** choice-count drift hid leave behind structure-only fallback |
| `abandoned_factory` machine CRT glass + MeshPhysical oil puddles | Act 6 hero hub glass/oil parity vs basement |
| `zarema_albert_room` selective MeshPhysical laptop CRT + warm window | Home hub glass accents free-stack |
| `factory_zarya` snow/storm/photo leave + roof/basement hub mid-resume + registry entry | **Bug fix:** mid-image forced overlay; leave stuck without 3D re-entry |
| `chk_act7_farewell` → `chk_explore_mode` (+ leave + hub mid-resume) | **Bug fix:** farewell dumped to room `explore_mode` (scene soft-teleport) |
| Basement oil puddles: damp+rain intensity knobs (not hardcoded wet) | Coherent industrial sheen vs static 0.72 |
| Act 4 `quest_act4_street_samizdat` leave on pier/CHK/library + hub mid-resume; registry entry nodes | **Bug fix:** mid-drop forced overlay — leave mid-route stuck |
| Act 4 `quest_act4_rooftop_broadcast_repair` leave + rooftop hub mid-resume; registry entry | Soft-lock hygiene — leave mid-solder stuck |
| `albert_backroom` / `guild_mainframe` selective MeshPhysical oil discs | Free-stack industrial sheen parity with basement/factory yard |
| Test: Act 4 samizdat + rooftop antenna leave/mid-resume | Regression guard |

---

## Tick 41 (this session)

| Change | Why |
|--------|-----|
| `albert_backroom` / `library_basement` selective MeshPhysical CRT faces (`crtTerminalGlass`) | Industrial CRT/glass accents free-stack vs guild/bunker |
| Act 6 office traitor chain leave on confrontation/confession/alliance/exile → office hub | **Bug fix:** mid-Dmitry forced overlay only — no explore exit |
| `act6_dmitry_judgment_pending` + hub/zone/dialogue mid-split for alliance/exile | Soft-lock hygiene — leave after judgment choice resumes correct beat |
| Act 6 Жека mid-beats leave → factory hub; registry entry nodes | Soft-lock hygiene — leave mid-zeka stuck |
| Verified Tick 36–40 clutter (Kenney café/library/office shells still blocked → procedural crates/shelves/desks live) | Still closed |

---

## Tick 40 (this session)

| Change | Why |
|--------|-----|
| `act6_final_confrontation` leave → `factory_roof_explore_mode` (+ text) | **Bug fix:** mid-close forced overlay only — no explore exit (hub/zone already resume) |
| `volodka_room` selective MeshPhysical night window panes (`roomNightWindow`) | Atmosphere parity — panes were Standard-only |
| `guild_mainframe` / `underground_bunker` selective MeshPhysical CRT faces (`crtTerminalGlass`) | Console/terminal glass accents free-stack vs library/office |
| Verified Tick 36–39 clutter (café espresso, pier/forest, room openings, plaza, neon, factory yard, office desks); ThinMonitors remain live desk path | Still closed — AuthoredVolodkaWorkstation stays dormant while shell blocked |

---

## Tick 39 (this session)

| Change | Why |
|--------|-----|
| Act 6 `system_infiltration` leave on nadzor/prep/core; rooftop showdown → roof hub; resistance formed/briefing → street | **Bug fix:** mid-infiltration / mid-showdown forced overlay only — no explore exit |
| Factory registry: `act6_nadzor_revealed` / `infiltration_prep` / `core_choice`; street: resistance formed/briefing | Closed-overlay mid-resume parity |
| `abandoned_factory` selective MeshPhysical broken panes + shards (`factoryBrokenGlass`) | Atmosphere parity on Act 6 hero hub free-stack |
| `factory_explore_mode` text/structure: insert missing «Тишина после Надзора» so Zarya/tea labels align | **Bug fix:** hub choice texts shifted — «Память» labeled nadzor_dies; tea/Zarya mislabeled |
| `factory_baba_zina_tea` leave on kettle/mint/hum/history; hub + Baba Zina dialogue mid-split; registry entry | **Bug fix:** leave mid-tea stuck / dialogue skipped mint→hum |
| `office_day` prop dressing: drop table+terminal near desk grid; chair → meeting sofa | **Bug fix:** High doubled procedural desks with GLB table/terminal |
| `street_night`: always mount drip pipe + broken window (not `!useAuthoredDressing`) | **Bug fix:** same empty-facade gap as Tick 37 NeonSigns |
| Drop dead poetic_compiler/neural_filter preloads from VolodkaRoomVisual | Desk gadgets owned by ScenePropDressing off-desk |
| Verified Tick 36–38 clutter (café espresso, pier/forest seats, room openings, plaza benches, street neon, ThinMonitors desk path) | Still closed — no reopen |

---

## Tick 38 (this session)

| Change | Why |
|--------|-----|
| `volodka_room` prop dressing: move ai3dgen compiler/filter off ThinMonitor desk → side table / shelf | **Bug fix:** bedroom shell blocked → workstation never mounts; deferred gadgets z-fought emissive monitors |
| Strip AuthoredVolodkaWorkstation desk gadgets (cassette/compiler/filter) — RoomDressing + off-desk props own them | Prevent future doubles if walkable shell returns |
| Comment: ThinMonitors are live desk path while shell is exterior_building | Lock intent from Tick 37 next-action #3 |
| Act 6 `data_heist`: leave on plan/execution/success/escape; office zone split hack→run; basement hide on hacked; street chip zone; corridor/street hub mid | **Bug fix:** leave mid-heist forced overlay; terminal zone re-fought after `mainframe_hacked` |
| `resistance_safehouse` leave on filters/radio/poem/beds | Soft-lock hygiene — mid-outfit forced hub |
| `final_poem` `compose_masterpiece` → `final_poem_written` (was duplicate `journey_reflected`) | **Bug fix:** compose auto-completed with reflect; journal skipped write beat |
| `library_day` selective MeshPhysical stained-glass panes (both walls) | Atmosphere parity on Act 7 hub free-stack |
| `office_day` selective MeshPhysical meeting-room partitions (`officeCubicleGlass`) | Sterile glass ceiling free-stack vs cafe/library |
| Registry entry: `act6_heist_success` / `act6_escape_success` | Closed-overlay mid-resume parity |

---

## Tick 37 (this session)

| Change | Why |
|--------|-----|
| `volodka_room`: always keep procedural door + city-glow windows; wardrobe still yields to Authored cabinet on High | **Bug fix:** `!useGltfFurniture` hid openings while AuthoredVolodkaRoomDressing had no door/windows; deferred kenney openings left blank doorway/walls |
| Removed volodka_room `kenney_door` / `kenney_window` from ScenePropDressing | Avoid z-fight with always-on procedural openings |
| `city_square`: AuthoredPlazaDressing benches 5→7 (±9 side seats) | **Bug fix:** High hid full 7-bench procedural ring but authored only covered 5 |
| `street_night`: always mount NeonSigns on High/Ultra | **Bug fix:** High hid café/КАФЕ/bar neon; authored facades have no tube replace |
| `river_pier` / `chk_forest_zorge`: prune prop barrel/crate/table at exact procedural fire/wine/guitar anchors | Clear coplanar doubles from Tick 36 keep-procedural fix |
| Regression tests: no kenney openings in room dressing; pier/forest no anchor stacks | Lock empty-opening / z-fight regressions |

---

## Tick 36 (this session)

| Change | Why |
|--------|-----|
| `cafe_evening`: counter espresso gated on `hideProceduralFurniture` (shell+gltf), not bare `useGltfDressing` | **Bug fix:** Kenney shell blocked but High still hid bar espresso; steam rose from empty counter (prop coffee_machine is floor kitbash at [2.5,0,-1.2]) |
| `river_pier`: always keep barrel+glow holes, crate seats, wine table, guitar | **Bug fix:** sparse prop dressing (1 bench) emptied fire ring / floated flame without barrel on High/Ultra |
| `chk_forest_zorge`: always keep 5 log seats, wine crate, guitar | **Bug fix:** 5 seats → 1 bench sparsified the campfire ring on High/Ultra |
| Regression: cafe shell blocked; prop coffee ≠ counter; pier/forest bench count sparse | Lock so empty-counter / sparse-seat regressions fail in unit tests |

---

## Tick 35 (this session)

| Change | Why |
|--------|-----|
| `river_pier`: always keep railing/pilings/boat/rod/reeds (backdrop ≠ dock owner) | **Bug fix:** `hideDockClutter = useGltfDressing` emptied the walkable pier on High/Ultra — same pattern as factory |
| `chk_forest_zorge`: always full hero trees + full instanced belt when backdrop mounts | **Bug fix:** backdrop sparsified to 4 trees + 24-tree ring; clearing read empty vs Lite |
| Regression: pier/forest backdrop stay far-Z `backdrop_dressing` | Lock mount policy so empty-dock / sparse-belt regressions fail in unit tests |
| Office monitor polish skipped | Kenney shell blocked → full procedural desks already have emissive monitors |

---

## Tick 34 (this session)

| Change | Why |
|--------|-----|
| `abandoned_factory`: never hide conveyors/vats/catwalk/graffiti/debris for GLB dressing | **Bug fix:** factory GLB is far-yard `backdrop_dressing` + sparse props — High/Ultra emptied the walkable yard (same pattern as basement) |
| `office_day`: full 12-desk procedural grid whenever Kenney shell is blocked; AuthoredOfficeDesk only if walkable shell mounts | **Bug fix:** High/Ultra sparsified to 6 table+terminal desks with no emissive monitors; cubicle dividers vanished |
| Regression: factory backdrop stays far-Z; office remains `exterior_building` | Lock mount policy so empty-yard / sparse-desk regressions fail in unit tests |

---

## Tick 33 (this session)

| Change | Why |
|--------|-----|
| `factory_basement` / `underground_bunker`: basement GLB → `SceneBackdropShell` only; always procedural walls + racks/sandbags | **Bug fix:** backdrop_dressing was mounted as walkable envelope and hid rack/sandbag density |
| Albert / guild / library_basement / library_day / cafe: hide procedural clutter only when shell actually mounts | **Bug fix:** Kenney exteriors blocked but High/Ultra still emptied rooms for sparse prop dressing |
| `albert_backroom` / `guild_mainframe` / `library_basement` ownership → procedural envelopes | Align ownership with exterior-shell block; Kenney facades stay prune-listed only |
| Cafe coffee cups gated with tables | **Bug fix:** cups floated when tables were hidden |
| Story `next: null` scan: **0** in `src/data/story` | Confirmed clean — no forced-overlay dump fix needed this tick |

---

## Tick 32 (this session)

| Change | Why |
|--------|-----|
| `act7_exp_epilogue_vision`: `next: null` → `city_square_explore_mode` / `explore_mode` / `epilogue_hub` | **Bug fix:** expanded finale closed overlay with no explore exit |
| Register `act3–7Expanded` satellites + full static↔runtime parity (drop `_exp_` skip) | **Bug fix:** expanded act packs existed in `buildStoryNodes` but never loaded at runtime |
| `city_square_explore_mode` entry includes `act7_exp_epilogue_vision` | Closed-overlay free roam after expanded vision |
| `factory` / `pier` / `forestClearing` / `basement` mount kind `backdrop_dressing`; AuthoredInteriorShell blocks only `exterior_building` | Safe guard — outdoor shells stay backdrop; Kenney facades stay blocked from hero interiors |
| Soft-lock scan: **0** never-set `flag_set` on startable quests | Confirmed clean |

---

## Tick 31 (this session)

| Change | Why |
|--------|-----|
| `act7_true_end`: `next: null` → roam (`explore_mode`) / `epilogue_hub` / real `start` new game | **Bug fix:** choice promised new game but only closed overlay; no post-end free roam / epilogue path |
| `act7_true_end` + `sync_end` as room hub entry nodes | Soft-lock hygiene — closed-overlay free roam after finale / morning sync |
| Act 5 path endings `next: null` → scene explore hubs; `sync_end` → `explore_mode` | **Bug fix:** forced-overlay “Конец” left player with no hub exit |

---

## Tick 30 (this session)

| Change | Why |
|--------|-----|
| `epilogue_letters` / `epilogue_monument` mid-resume: leave on start/done; mid flags; room/park hubs + zone splits; street_poet dialogue; no forced `epilogue_hub` after complete | **Bug fix:** leave mid-epilogue → forced overlay / no hub re-entry; finish dumped to VN hub |
| `epilogue_hub` gates start vs mid vs done choices | Soft-lock hygiene — hub no longer re-offers completed beats |
| Quest `linkedStoryNodeIds` + live mid hints for letters/monument | Journal / continue + 3D cue parity |

---

## Tick 29 (this session)


| Change | Why |
|--------|-----|
| `rebuild_the_guild` mid-resume: leave on rebuild/charter/community/archive; path flags; cafe/library hubs + zone quartet; Anya/Sergey/Kate dialogue | **Bug fix:** leave mid-charter → hub re-offered only start; no 3D archive zone |
| `system_takedown` mid-resume: leave on assemble/shutdown/core/dies; factory hub + zone triad; Maxim/Zheka dialogue | **Bug fix:** leave mid-core → zone re-fought shutdown combat |
| `final_poem` mid-resume: leave on create/write/recital/publish; park/rooftop hub+zone splits | **Bug fix:** park zone collapsed create→write; no leave on spine |
| Library hub golden continue gated on `new_council_elected` | Soft-lock hygiene — early-act library no longer forces Act 7 archive |
| `system_takedown` / `final_poem` objectives: orphan bash/poetry → story `flag_set` | **Bug fix:** quests never completed after spine |

---

## Tick 28 (this session)



| Change | Why |

|--------|-----|

| `volodka_legacy` mid-resume: leave on walk/goodbye/final_walk/maria_future; mid flags; room/kitchen/street hubs + zone quartet; Zarema/Maria dialogue; registry entry | **Bug fix:** leave mid-legacy → hub only re-offered `act7_legacy_walk` |

| `quest_act7_poets_monument_inscription` dialogue/hub/zone split recall→carve→inscribe; leave on plate/recall/carve/inscribe | **Bug fix:** post-plate collapsed into recall until done |



---



## Tick 27 (this session)



| Change | Why |

|--------|-----|

| `quest_act6_defector_rescue_expanded` mid-resume: leave on infiltrate/cell/sewers; bunker + resistance hub splits; zone quartet; Maxim/Anya dialogue start+split; registry + STORY_NODE_TO_NPC | **Bug fix:** leave mid-raid → no 3D re-entry; dialogue collapsed cell+sewers; no hub start after thin rescue |



---



## Tick 26 (this session)



| Change | Why |

|--------|-----|

| `quest_act5_factory_zarya_memory_restore` mid-resume: leave on fragments; factory/basement hub splits; zone quartet; Baba Zina dialogue; registry entry | **Bug fix:** leave mid-fragment → no 3D re-entry |

| `quest_act5_bunker_code_poem_break` mid-resume: leave on key/break; bunker/resistance/basement hubs; zone triad; Maxim dialogue; registry entry | **Bug fix:** leave mid-cipher → stuck |

| `act5_dawn` no longer sets `night_before_dawn_started` / triggers ally quest; dawn+roof gate ally circuit on `final_code_completed` | **Bug fix:** both Act 5 mains started at dawn → hub/zone conflict |



---



## Tick 25 (this session)



| Change | Why |

|--------|-----|

| `final_code` mid-resume: approach + rally→virus→core→deploy nodes; flag_set rally/core; `freedom_virus_written` via QuestTracker | **Bug fix:** quest linked to Act 4 `act4_core_server` with no 3D circuit; leave mid-operation stuck |

| act5_dawn → `final_code_approach` first; rooftop/cafe/albert/office hubs + zone sextet; registry entry nodes | Closed-overlay / Full 3D RPG mid-resume parity |

| Cafe OpenStack virus zone gated on rally / hides on `freedom_virus_written` | Soft-lock hygiene — abort minigame must not soft-lock core |



---



## Tick 24 (prior session)



| Change | Why |

|--------|-----|

| `act6_secret_archive` factory hub hatch→door→decode→extract→seal mid-resume; zone quintet; door/decode/extract leave + mid-routers | **Bug fix:** coarse hub/zone always → approach until sealed; leave mid-decode stuck |

| Factory registry entry nodes for secret archive chain | Closed-overlay mid-resume parity |

| `machine_confession` leave without fate; hub/basement gates `missingFlag: machine_fate_decided`; explore decide mid-choice | Soft-lock hygiene — hear then leave → sticky confess / no decide resume |

| `machine_confession_approach` thread/familiar/base mid-router; explore zone → approach; registry entry | **Bug fix:** 3D re-entry always base scene; variants unreachable after leave |

| Basement registry entry nodes for confession variants | Closed-overlay mid-resume |

| `rooftop_edge` selective MeshPhysical wet list + `rooftopSkylightGlass` (door pane / HVAC gauge) | Wet parity free-stack vs plaza/café/pier |

| `park_day` denser FogExp2 + canopy cool fill + N8AO; `factory_basement` Zarya practical + floor bounce | Uneven hub lighting/fog coherence |



---



## Tick 24 (this session)



| Change | Why |

|--------|-----|

| `night_before_dawn` ally mid-resume: approach + Albert/Zarema/Maria/Dmitry nodes; flag_set objectives; act5_dawn leave→approach | **Bug fix:** quest triggered at dawn with no 3D ally circuit; leave/close stuck |

| Rooftop/cafe/albert/zarema/office hubs + zone sextet; registry entry nodes; STORY_NODE_TO_NPC_ID | Closed-overlay / Full 3D RPG mid-resume parity |

| `park_day` + `street_winter` selective MeshPhysical list; park dew puddles; `winterShopWindow` frost pane + ice puddle | Selective damp accents free-stack vs pier/rooftop/CHK |



### Mixamo / retarget debt (unchanged)



- Full Quaternius↔Mixamo bone remap still incomplete; hip filter + talk fallback from Tick 3 remain.

