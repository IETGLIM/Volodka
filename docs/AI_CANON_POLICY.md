# AI Canon Policy — ВОЛОДЬКА

**Status:** Enforced from Phase A scaffolding onward.  
**Owner:** Engineering + narrative review.

Poems and dialogue by **Vladimir Lebedev** are immutable narrative canon. Browser ML is an **optional enhancement layer**, never a content author.

---

## 1. Hard Rules (non-negotiable)

### ❌ Forbidden — LLM / generative AI

| Surface | Rule |
|---------|------|
| `DialogueRenderer` | **No LLM calls.** All quest and story dialogue comes from typed data files. |
| `StoryRenderer` | **No LLM calls.** |
| Poem text (`poems.ts`, combat poem powers) | **No generation, paraphrase, or translation by AI.** |
| Main-quest NPC lines | **No procedural bark variation** that could alter meaning or canon. |
| Save game / quest state | **No AI-written state mutations.** |

### ✅ Allowed — opt-in only (`volodka_ai_features=1`)

| Use case | Model (planned) | Canon-safe because |
|----------|-----------------|-------------------|
| **Codex / lore search** | `Xenova/all-MiniLM-L6-v2` embeddings | Retrieval over existing metadata; no text generation |
| **Minigame hints** | Keyword / tiny classifier | Suggests strategy; does not solve or alter puzzles |
| **Voice commands (ASR)** | `Xenova/whisper-tiny` | Maps speech → existing game actions |
| **Poem discovery UX** | Semantic similarity on **tags/titles only** | Never rewrites poem body text |

---

## 2. transformers.js Integration Rules

1. **Opt-in only** — default OFF. Gate: `localStorage.volodka_ai_features === '1'`.
2. **Lazy load** — dynamic import via `src/engine/ml/transformersBridge.ts`; never in boot bundle.
3. **Web Worker** — inference off main thread when implemented.
4. **Separate budget tier** — hard max in `config/performanceBudgets.json`; +2–8 MB gzip per model.
5. **No npm install in boot path** — `@huggingface/transformers` added only when bundle impact is isolated.

```text
Settings → "AI-функции" (OFF by default)
     ↓ isAiFeaturesEnabled()
transformersBridge.loadMlEngine()  // lazy dynamic import
     ↓ Web Worker + WASM models (CDN)
EventBus: ml:search:result, ml:asr:command
     ↓
Codex panel, minigame hub — NEVER DialogueRenderer
```

---

## 3. Module Boundaries

`transformersBridge.ts` **must not import**:

- `@/components/game/DialogueRenderer`
- `@/components/game/StoryRenderer`
- `@/data/poems` (poem body text)
- `@/data/dialogue/*` (story dialogue nodes)

Allowed imports: lore index metadata, codex tags, minigame config, EventBus, feature flags.

**Code review checklist:**

- [ ] No `import` from dialogue or poem content modules in `src/engine/ml/**`
- [ ] No `fetch` to generative LLM APIs for in-game text
- [ ] AI toggle visible in Settings; default OFF
- [ ] Unit test: `isAiFeaturesEnabled()` false by default

---

## 4. User-Facing Disclosure

When AI features are enabled, Settings must state (Russian):

> Экспериментальные функции: поиск по архиву и голосовые команды. Сюжет и стихи не генерируются ИИ.

English equivalent in dev docs: story and poems are never AI-generated.

---

## 5. Violations

Any PR that routes LLM output into dialogue, poem display, or quest text is **blocked** until removed. Narrative changes require human authorship and Lebedev canon review.

---

*See also: [AAA_PIONEER_ROADMAP.md](./AAA_PIONEER_ROADMAP.md) Phase C.*
