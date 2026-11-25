# Volodka — Narrative Master Audit
## Code-first story, character and quest review

**Baseline:** main commit 8edcd285a6fa3b4b995e57074980740e77b3f89c  
**Status:** structural/editorial audit; no story text or authored poem has been modified  
**Scope:** Acts I–VII, golden path, story registry, story/dialogue renderers, quest and choice data, narrative presentation

---

## 1. Executive assessment

Volodka has a large narrative foundation: a seven-act main arc, a long golden-path spine, side-story packs, NPC dialogue, scene hubs, quest chains, lore and authored poetry. The underlying implementation already contains useful safeguards for node connectivity, deterministic registry assembly, deliberate overrides, protected text and quest/flag contracts.

The central risk is that **content volume and graph validity can conceal a weak player-facing dramatic experience**. A graph can be connected while the player does not understand why an event matters. A choice can point to a valid node while having no memorable consequence. A character can have a registered ID while the narrative uses another name, role or emotional history. A scene can contain evocative prose while the player has no meaningful action inside it.

**Working diagnosis:** do not add more story branches yet. First establish a canon bible, resolve the first-act continuity questions, then rewrite and playtest the opening slice as a complete dramatic experience. Use that validated pattern for the other six acts.

This document is based on source files and current tests. It does not claim that every narrative beat has been playtested in the live browser.

## 2. What is already strong in the codebase

### 2.1 Story content is separated from some of its structure

Act I is assembled through applyStoryTexts using ACT1_STRUCTURE and the separate texts/act1.json file. This is a useful separation between graph/effects and authored prose. The structure defines scene IDs, speakers, flags, effects, quest triggers and golden-path choices; the text file carries the player-facing wording.

Keep this separation, but strengthen its contracts. Content authors need to be able to revise prose without accidentally changing quest logic, and engineers need to change graph logic without silently altering protected poem text.

### 2.2 The registry has deliberate conflict handling

src/data/story/buildStoryNodes.ts builds STORY_NODES from named story packs. It documents intentional node overrides and reports undeclared duplicate IDs rather than relying on accidental import order.

This is an important foundation. The narrative redesign should not replace it with a single unstructured file. Instead, make the source ownership and canonical override decisions visible to editors.

### 2.3 The golden path already exists as an authored progression contract

src/data/goldenPath.ts defines the seven-act story spine and maps story beats to NPCs and scene labels. This gives the team a concrete route against which to test pacing and continuity.

However, the spine is a route contract, not a substitute for a dramatic outline. For every spine beat, the team still needs to know what the player wants, what prevents it, what is revealed, what can be chosen, and what changes afterward.

### 2.4 Structural tests provide a useful baseline

src/data/story/storyConnectivity.test.ts checks, among other things:
- golden-path nodes exist in the story registry;
- the derived spine matches the frozen reference;
- Act V→VI and VI→VII bridges are wired;
- golden-path quest IDs exist;
- flag-to-node mappings resolve;
- selected Act VII mirror flags are set in the data pipeline;
- contextNote exists for main nodes in Acts IV–VII;
- selected critical Act VI/VII choices autosave.

These are valuable tests. They do not assess prose quality, character voice, emotional escalation, choice significance, contradiction between scene texts, or whether a player can understand a branch without reading internal quest flags.

## 3. Architectural risks

### 3.1 A large number of story packs increases editorial coordination cost

STORY_NODE_SOURCES combines core acts, expanded acts, office aftermath, side stories, scene exploration hubs, faction contracts, the pier, library, factory, epilogue, dream world, street legends and other packs.

The registry has safeguards against accidental duplicate IDs, but that does not prevent:
- a character being named differently in separate packs;
- a timeline changing between base and expansion stories;
- a quest referring to an outdated event;
- a choice consequence being forgotten in a later scene;
- a side story contradicting the main arc;
- an NPC relationship appearing to reset after a scene transition.

**Required control:** a narrative canon/continuity registry above the graph registry. Graph uniqueness and story canon consistency are separate validations.

### 3.2 Story and dialogue presentation have separate renderers

StoryRenderer.tsx and DialogueRenderer.tsx are separate components. Both use shared cinematic narrative presentation components, but each has its own resolution, loading, choice/effect and presentation logic.

There are comments in DialogueRenderer about a cross-registry recovery path where a story choice can lead to a dialogue node. That is a sign that the boundary between story nodes and dialogue nodes is operationally complex.

Do not blindly merge the two domain models. First define a shared NarrativePresentationContract:
- speaker identity and canonical character ID;
- line text and optional stage direction;
- scene and camera intent;
- emotional intent;
- choices and conditions;
- consequence preview policy;
- voice/subtitle metadata;
- progression/effect transaction;
- save/autosave boundary;
- exit/return target.

Story and dialogue may keep different authored node types, but the player-facing cinematic experience should follow one predictable contract.

### 3.3 Existing tests protect the graph better than the drama

Current tests are strongest around IDs, links, flags, bridges and selected metadata. The next testing layer must validate continuity, player comprehension and consequences.

Add tests for:
- speaker ID ↔ canonical character mapping;
- all named aliases and intentional pseudonyms;
- character age and biography assertions;
- scene time/location continuity;
- required emotional/context metadata;
- choice branches with a visible or systemic consequence;
- orphaned flags and flags that are set but never read;
- repeated text and contradictory claims;
- missing re-entry text for revisited scene hubs;
- quest steps that do not have a diegetic action or clear next step.

## 4. Concrete Act I continuity findings

These are source-level findings. Some may be intentional story choices; where intent is possible, the decision is explicitly marked rather than silently "corrected".

### NAR-01 — Protagonist age needs one canon value

Source: src/data/story/texts/act1.json, node start.

The current start text says the protagonist is 33 years old. The established character brief describes Volodka as a 34-year-old IT engineer.

**Decision:** confirm one canonical age and propagate it to the opening, character profile, codex, NPC dialogue, save summaries and promotional copy. Do not leave different ages in separate acts.

**Priority:** P0 canon fix.

### NAR-02 — Maria / Victoria identity must be unambiguous

Sources:
- src/data/story/texts/act1.json, nodes maria_curious and maria_introduction;
- src/data/goldenPath.ts, STORY_NODE_TO_NPC_ID;
- src/data/allNpcDefinitions.ts and canonical NPC alias mapping.

The opening node is named maria_curious and is mapped to the NPC ID maria. Later, maria_introduction contains the line “Меня зовут Виктория”. The story guidance also identifies the stranger as Victoria.

This may be an intentional false identity, cover name or identity reveal. The current source alone does not make the dramatic intent explicit.

**Decision:** document whether Maria and Victoria are the same person, aliases, separate people or a deliberate reveal. If it is a reveal, stage the clue, the lie, the reason and the moment the player learns the truth. Keep one canonical internal ID and explicit display-name/alias metadata.

**Priority:** P0 continuity decision.

### NAR-03 — Zarema's exclusivity claim conflicts with the early Alina/Solnysh relationship

Source: src/data/story/texts/act1.json, nodes kitchen_table and corridor_door / solnysh_corridor_talk.

The kitchen text says Zarema is the only person in the city who truly cares about Volodka. Earlier in the same opening, Alina/Solnysh is introduced as a childhood friend; she worries about Volodka, says they have been close since childhood and expresses care.

This may be an emotional point-of-view exaggeration, but the current wording is absolute and appears to invalidate an already established bond.

**Decision:** either make the statement subjective (“сейчас тебе кажется, что только Зарема…”) or define clearly what kind of care each relationship provides. Zarema may represent home and daily protection; Solnysh may represent shared history, loyalty or a different emotional bond.

**Priority:** P0 character relationship continuity.

### NAR-04 — Umka and Shiz need distinct canon ownership

Sources: src/data/story/texts/act1.json and src/data/story/structures/act1.structure.ts, corridor_explore_mode, umka_corridor_pet and related corridor nodes; canonical NPC definitions and companion data.

Act I refers to Umka as a dog near Alina/Solnysh. The Volodka canon also includes Shiz, the Samoyed companion. These can coexist if Umka is another character's pet, but the player must never confuse the two animals or lose the intended companion identity.

**Decision:** establish an animal/companion entry in the canon bible: owner, breed, personality, first appearance, relationship to Volodka, gameplay role and whether the animal follows the player. Preserve Shiz as Volodka's canonical Samoyed companion. If Umka is Alina's pet, make that ownership explicit in prose and staging.

**Priority:** P0 canon and staging decision.

### NAR-05 — One corridor choice contains a visible typo

Source: src/data/story/texts/act1.json, node corridor_explore_mode.

The option “Погласить Умку” appears to be a typo for “Погладить Умку”.

**Decision:** correct the typo in the text source and add a simple editorial text lint for common accidental malformed verbs in authored choice labels.

**Priority:** P1 copy edit.

### NAR-06 — The “432 Hz lamp” line needs an explicit stylistic decision

Source: src/data/story/texts/act1.json, node corridor_explore_mode.

The corridor hub text says the ceiling bulb flickers at 432 Hz. This is a striking surreal/technical image, but “Hz” describes cycles per second and may read like an accidental technical claim rather than an observable flicker.

**Decision:** keep it only if it is deliberately part of the world's signal/poetry language. Otherwise write the visible behaviour or use a clearly diegetic measurement. Do not flatten intentional surrealism into bland realism, but distinguish metaphor from technical narration.

**Priority:** P2 editorial choice.

### NAR-07 — Time-of-day and scene identity need a continuity pass

Sources: src/data/story/structures/act1.structure.ts and src/data/story/texts/act1.json.

The opening describes waking up and receiving a new guild message, while some related scene IDs use home_evening and cafe_evening. This may be a legacy scene naming convention, a later time skip or an intentional alternate schedule. The story source does not explain the relationship by itself.

**Decision:** build a minute-by-minute Act I timeline: wake-up, room exploration, corridor, kitchen, street, cafe, guild/office, evening return. Ensure scene lighting, ambient audio, NPC schedules, text references and quest timing agree.

**Priority:** P1 continuity audit.

## 5. Narrative quality diagnosis to validate in playtest

The opening has a strong identity hook: an IT engineer, a suspicious incident, poetry hidden in code, post-Soviet city atmosphere and the question of who is erasing memory. This is the distinctive material worth protecting.

The risk is that the player may be asked to absorb a lot of descriptive text and move through several named hubs before the central dramatic question becomes tangible. The opening needs to let the player discover the poetry-in-code mystery through action, not only through paragraphs explaining it.

Use the following beat test for every golden-path node:

1. **Player intent:** what does Volodka want right now?
2. **Immediate obstacle:** why can't he simply do it?
3. **New information:** what changes in the player's understanding?
4. **Character pressure:** who wants something different?
5. **Choice:** what meaningful action can the player take?
6. **Consequence:** what changes in a flag, relationship, resource, world state or future scene?
7. **Embodied action:** what does the player actually do in the 3D world?
8. **Aftertaste:** what image, line, sound or unresolved question makes the beat memorable?

If a node has no player intent, pressure or change, consider turning it into a short environmental observation, merging it with another beat or removing it from the golden path. Do not automatically delete side content; first decide whether it belongs in optional exploration.

## 6. Authorial and character bible required before rewriting

Create one canonical source of truth with the following sections:

### World
- Parallel-galaxy / “Солнечный контур” premise and the rules of the setting.
- What “Солнечная Россия” means in politics, daily life, technology and visual language.
- The USSR rebirth premise and its contradictions; what is satire, what is history and what is alternative fiction.
- The Crash: cause, date, public explanation, hidden truth and who benefits.
- The IT Guild, Panopticon, Atmosphere-U, archives and the mechanism by which poems are erased or hidden.
- Geography, travel time, districts, weather, technology and everyday life.

### Protagonist
- Canonical name, age, occupation and biography.
- What Volodka wants before the story begins.
- What he avoids, fears, regrets and believes.
- Skills and weaknesses expressed through gameplay, not only dialogue.
- Why poetry matters to him and what it costs to preserve it.
- The difference between player choice and Volodka's established character.

### Characters
For each recurring NPC:
- canonical ID, display name and known aliases;
- age/role/appearance where authored;
- want, need, fear, secret and contradiction;
- history with Volodka;
- speech rhythm, vocabulary and forbidden phrases;
- relationship state and what changes it;
- first appearance and every later re-entry;
- what the character knows at each act;
- whether the player can materially change the relationship.

Include Alina/Solnysh, Zarema, Victoria/Maria, Albert, Alexander, Dmitry and Shiz as first-pass priorities.

### Poetry
- Preserve author-supplied poems verbatim.
- Track which poem appears in which act, location, object and dramatic context.
- Explain what the protagonist and world learn from each poem.
- Do not treat poems as collectible loot alone. Their discovery should alter character, world state, memory or player understanding.

## 7. Seven-act editorial process

Do not rewrite all seven acts in one pass.

For each act, create:
- one-sentence dramatic promise;
- protagonist goal and antagonist/system pressure;
- beginning / midpoint / turning point / climax / aftermath;
- character arcs advanced;
- poems and their meaning;
- main quests and optional quests;
- consequential choices;
- scene list and embodied gameplay;
- unresolved questions carried into the next act.

Then run a cross-act continuity review. An event introduced in Act I must have a later payoff or an intentional resolution. A character cannot know a secret before learning it. A relationship cannot jump without an event. A major choice cannot disappear unless the story explicitly shows why.

## 8. First playable slice: editorial and gameplay rewrite

The first rewrite target is the opening sequence, not the entire campaign:

1. Main menu and prologue choice.
2. Wake-up cinematic: show a specific disturbance, not generic exposition.
3. Volodka's room: objects, monitors, incomplete poem, a message and environmental clues.
4. First free exploration: every discoverable object has a purpose, an optional story fragment or a meaningful resource/relationship effect.
5. Shiz's introduction and the distinction from other animals in the world.
6. Corridor: Alina/Solnysh, Umka if retained, a clear personal conflict and a physically staged interaction.
7. Kitchen: Zarema, her own objective and the radio's first suspicious signal.
8. Street/cafe: a controlled reveal, not a pile of lore.
9. First meaningful choice that changes a later conversation or access path.
10. Autosave and reload at a tested narrative checkpoint.

For each beat, write both:
- the authored scene/line/choice;
- the 3D direction: camera framing, NPC position, animation, gaze, body language, lighting, sound, subtitles, skip/advance control and how the player resumes control.

A dialogue box over an idle 3D character is not a cinematic scene.

## 9. Unified narrative presentation contract

Keep story and dialogue data types where they serve different authoring needs, but standardise the presentation contract used by StoryRenderer and DialogueRenderer.

Required fields:
- canonical speaker ID and display identity;
- line text, optional inner monologue and stage direction;
- emotion/intention authored explicitly, not guessed from punctuation or selected words;
- scene/camera/shot intent;
- voice line and subtitle metadata;
- choices with conditions and clear consequence policy;
- effects applied exactly once;
- relationship changes and visible feedback when appropriate;
- autosave boundaries;
- return state and input hand-off;
- reduced-motion and skip/hold behaviour.

Do not rely on heuristic emotion detection such as finding selected words and punctuation in the dialogue text as the definitive character emotion. The actor/line author should own the emotional intent; any automated inference is only a fallback.

## 10. Tests and production acceptance

### Structural tests
- every story link resolves;
- no unintended duplicate node IDs;
- all flags have a producer and a meaningful consumer;
- no unreachable mandatory nodes;
- every main quest objective is completable;
- all choices are valid for the state in which they appear;
- no autosave boundary loses a pending choice or consequence.

### Canon and continuity tests
- one canonical protagonist age/name/occupation;
- one canonical ID for each character plus intentional aliases;
- consistent NPC ownership and animal/companion identity;
- scene time and location consistency;
- no contradiction in relationship history;
- no character uses knowledge before acquiring it;
- no duplicate or stale text from shadowed node definitions.

### Playability tests

**Current E2E limitation:** the Act I vertical-slice test checks that synthetic KeyW input moves the player, but the room-to-corridor hand-off is not yet a fully physical player interaction. The test bridge places the player at a known coordinate and directly calls interactTriggerZone('room_door'). The related physical-dialogue test uses the same kind of bridge call. This validates the trigger/scene transition path, but it does not yet prove that a first-time player can naturally approach the door, see the correct prompt, press the normal interaction key and transition without a developer bridge.

This must become a separate acceptance test before the first slice can be called production-ready.

- first-time player can understand what to do without using a developer bridge;
- world interaction is performed through normal controls;
- player can walk to the door, approach the NPC, trigger the interaction and regain control;
- dialogue can be skipped/advanced using keyboard, mouse and touch;
- consequences appear in the next relevant scene;
- save/reload preserves flags, collected poems, relationship values and current objective.

### Editorial playtest
After each Act I iteration, ask a first-time player:
- What do you think happened?
- What do you want to do next?
- Who do you trust and why?
- What did your last choice change?
- Which character or moment do you remember?
- What was confusing, repetitive or emotionally unearned?

If the player cannot answer, do not solve the problem by adding more hints. Fix scene motivation, staging, dialogue or choice feedback.

## 11. Priority register

| Priority | Finding | Next action |
|---|---|---|
| P0 | Character canon / alias decisions are not explicit in the Act I source | Resolve age, Maria/Victoria and animal ownership |
| P0 | Relationships can sound contradictory | Reconcile Zarema and Alina/Solnysh roles |
| P0 | Opening experience needs authored 3D staging and meaningful player action | Rewrite and playtest first slice |
| P1 | Story and dialogue pipelines are separate and cross over | Define shared presentation contract |
| P1 | Structural tests do not assess dramatic quality | Add continuity and choice-consequence validations |
| P1 | Act I time/location names need review | Create one authoritative timeline |
| P2 | Isolated copy errors and technical metaphors | Editorial pass with canon/style guide |

## 12. Non-goals and protections

- Never rewrite or delete user-authored poems without explicit approval.
- Never replace Shiz with another animal or silently change companion canon.
- Do not expand the number of quests until the existing golden path is understandable and playable.
- Do not turn every dramatic choice into a numeric karma transaction.
- Do not make every NPC speak in the same lyrical voice.
- Do not resolve uncertainty by inventing lore; mark the question for authorial decision.
- Do not equate node count, dialogue length or test count with story quality.

## 13. Definition of production-ready narrative

The narrative is ready when:
- the canon bible has no unresolved identity or timeline contradictions;
- every main-path beat has player intent, pressure, choice and consequence;
- characters have distinct voices and evolving relationships;
- poems are preserved and integrated into the dramatic arc;
- major choices produce observable or remembered consequences;
- dialogue and cutscenes are staged with actual 3D direction;
- optional content deepens the world without obscuring the main path;
- the first-act experience has been played by first-time players and revised from their feedback;
- continuity is protected by both automated checks and human editorial review.

---

## Source files reviewed

- src/data/story/structures/act1.structure.ts
- src/data/story/texts/act1.json
- src/data/story/act1.ts
- src/data/story/buildStoryNodes.ts
- src/data/story/index.ts
- src/data/goldenPath.ts
- src/data/story/storyConnectivity.test.ts
- src/components/game/StoryRenderer.tsx
- src/components/game/DialogueRenderer.tsx
- src/shared/validation/storyNodeValidation.ts
- src/engine/narrative/narrativeChoiceExecutor.ts
- e2e/act1-smoke.spec.ts
- e2e/act1-physical-dialogue.spec.ts
