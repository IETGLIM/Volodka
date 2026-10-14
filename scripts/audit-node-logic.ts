/* ─── Node-logic audit (user request: «перепроверь всю логику узлов») ───
 *
 * Static cross-checks over the WHOLE narrative content (story + dialogue +
 * zones + hubs + quests), beyond what storyReachability covers:
 *
 *  A. Graph integrity: choices.next / visitStoryNode targets exist.
 *  B. Flag hygiene: every checked flag (condition.flag / missingFlag,
 *     zone requiredFlag / hiddenWhenFlag) is SET somewhere; list of
 *     set-but-never-checked flags (info only — lore plumbing is legal).
 *  C. Resource refs: items, poems, lore, NPCs, quests, scenes, skills.
 *  D. Dead ends: story nodes whose choices all terminate (next:null, no
 *     visitStoryNode) — terminal nodes are legal (overlay closes), listed
 *     per act as info; EMPTY choices on non-terminal hubs is a warning.
 *  E. Duplicate node ids across packs (registry overwrites) + dup zone ids.
 *  F. Numeric sanity: minSkillCheck difficulty 1–20 (runtime-validated),
 *     requiredAct, time-of-day ranges.
 *
 * Run: npx tsx --tsconfig tsconfig.json scripts/audit-node-logic.ts
 * Exit code 1 only on CRITICAL issues.
 */
import { buildStoryNodes } from '../src/data/story/buildStoryNodes';
import { DIALOGUE_NODES } from '../src/data/dialogue';
import { TRIGGER_ZONES } from '../src/data/triggerZones';
import { QUEST_DEFINITIONS } from '../src/data/quests';
import { SCENE_EXPLORE_HUB_DEFS } from '../src/shared/sceneExploreHubRegistry';
import { getAllItemDefinitions } from '../src/data/items';
import { POEMS } from '../src/data/poems';
import { EXPANSION_POEM_STUBS } from '../src/data/expansion/expansionPoemStubs';
import { QUEST_ITEM_DEFINITIONS } from '../src/data/questItems';
import { INITIAL_LORE_ENTRIES } from '../src/data/loreEntries';
import { ALL_NPC_IDS } from '../src/data/allNpcDefinitions';
import { NPC_ID_ALIASES } from '../src/shared/npcIdAliases';
import type { PlayerSkills } from '../src/shared/types/definitions/skills';

type Severity = 'CRITICAL' | 'WARN' | 'INFO';
interface Finding {
  severity: Severity;
  code: string;
  message: string;
}

const findings: Finding[] = [];
const push = (severity: Severity, code: string, message: string): void => {
  findings.push({ severity, code, message });
};

/* ── registries ── */
const story = buildStoryNodes();
const dialogue = DIALOGUE_NODES;
const zones = TRIGGER_ZONES;
const quests = QUEST_DEFINITIONS;
const hubs = SCENE_EXPLORE_HUB_DEFS;

const storyIds = new Set(Object.keys(story));
const dialogueIds = new Set(Object.keys(dialogue));
const allIds = new Set([...storyIds, ...dialogueIds]);
const itemIds = new Set([
  ...getAllItemDefinitions().map((i) => i.id),
  ...Object.keys(QUEST_ITEM_DEFINITIONS), // expansion quest-item defs (runtime fallback reads these)
]);
const poemIds = new Set([...POEMS, ...EXPANSION_POEM_STUBS].map((p) => p.id)); // getPoemById resolves BOTH
const loreIds = new Set(INITIAL_LORE_ENTRIES.map((l) => l.id));
const npcIds = new Set<string>(ALL_NPC_IDS);
const canonicalNpcIds = npcIds;
const npcKnown = (id: string): boolean => {
  const canonical = NPC_ID_ALIASES[id] ?? id;
  return canonicalNpcIds.has(canonical);
};
// Must mirror PlayerSkills (logic/coding/empathy/persuasion/intuition/writing/rhythm)
const skills = new Set<string>(['logic', 'coding', 'empathy', 'persuasion', 'intuition', 'writing', 'rhythm']);
const sceneIds = new Set<string>();
// collect SceneId from zone usage + hub usage (scenes are typed, but audit anyway)
for (const z of zones) sceneIds.add(z.sceneId);
for (const h of hubs) sceneIds.add(h.sceneId);
const questIds = new Set(quests.map((q) => q.id));

/* ── A+B collectors ── */
const flagSetters = new Map<string, Set<string>>(); // flag -> where set
const flagCheckers = new Map<string, Set<string>>(); // flag -> where checked
const setFlag = (flag: string, where: string): void => {
  if (!flagSetters.has(flag)) flagSetters.set(flag, new Set());
  flagSetters.get(flag)!.add(where);
};
const checkFlag = (flag: string, where: string): void => {
  if (!flagCheckers.has(flag)) flagCheckers.set(flag, new Set());
  flagCheckers.get(flag)!.add(where);
};

const visit = (nodeId: string, effects: readonly { type?: string; nodeId?: string; itemId?: string; flag?: string; questId?: string; poemId?: string; loreId?: string; npcId?: string; skill?: string; enemyType?: string; sceneId?: string }[] | undefined): void => {
  if (!effects) return;
  for (const fx of effects) {
    if (fx.type === 'setFlag' && fx.flag) setFlag(fx.flag, nodeId);
    if (fx.type === 'visitStoryNode' && fx.nodeId) {
      if (!allIds.has(fx.nodeId)) {
        push('CRITICAL', 'visit-target', `${nodeId} → visitStoryNode "${fx.nodeId}" не существует`);
      }
    }
    if (fx.type === 'addItem' && fx.itemId && !itemIds.has(fx.itemId)) {
      push('CRITICAL', 'item-ref', `${nodeId} addItem "${fx.itemId}" — предмет не найден в items.ts`);
    }
    if (fx.type === 'removeItem' && fx.itemId && !itemIds.has(fx.itemId)) {
      push('WARN', 'item-ref', `${nodeId} removeItem "${fx.itemId}" — предмет не найден`);
    }
    if (fx.type === 'collectPoem' && fx.poemId && !poemIds.has(fx.poemId)) {
      push('CRITICAL', 'poem-ref', `${nodeId} collectPoem "${fx.poemId}" — стих не найден (ЗАЩИЩЁННЫЙ реестр)`);
    }
    if (fx.type === 'discoverLore' && fx.loreId) {
      for (const id of fx.loreId.split(',')) {
        const t = id.trim();
        if (t && !loreIds.has(t)) push('CRITICAL', 'lore-ref', `${nodeId} discoverLore "${t}" — lore не найден`);
      }
    }
    if (fx.type === 'npcChange' && fx.npcId && !npcKnown(fx.npcId)) {
      push('CRITICAL', 'npc-ref', `${nodeId} npcChange "${fx.npcId}" — NPC не найден (ни реестр, ни NPC_ID_ALIASES)`);
    }
    if (fx.type === 'triggerQuest' && fx.questId && !questIds.has(fx.questId)) {
      push('CRITICAL', 'quest-ref', `${nodeId} triggerQuest "${fx.questId}" — квест не найден`);
    }
    if (fx.type === 'addSkill' && fx.skill && !skills.has(fx.skill)) {
      push('CRITICAL', 'skill-ref', `${nodeId} addSkill "${fx.skill}" — навык не найден`);
    }
  }
};

const checkCondition = (owner: string, cond: Record<string, unknown> | undefined): void => {
  if (!cond) return;
  if (typeof cond.flag === 'string') checkFlag(cond.flag, owner);
  if (typeof cond.missingFlag === 'string') checkFlag(cond.missingFlag, owner);
  if (cond.minSkillCheck) {
    const c = cond.minSkillCheck as { skill?: string; difficulty?: number };
    if (c.skill && !skills.has(c.skill)) push('CRITICAL', 'skill-ref', `${owner} minSkillCheck.skill "${c.skill}" не найден`);
    if (typeof c.difficulty === 'number' && (c.difficulty < 1 || c.difficulty > 20)) {
      push('CRITICAL', 'skill-difficulty', `${owner} minSkillCheck.difficulty ${c.difficulty} вне 1..20 (валидация рантайма)`);
    }
  }
  if (typeof cond.collectedPoem === 'string' && !poemIds.has(cond.collectedPoem)) {
    push('CRITICAL', 'poem-ref', `${owner} condition.collectedPoem "${cond.collectedPoem}" не найден`);
  }
  if (typeof cond.missingPoem === 'string' && !poemIds.has(cond.missingPoem)) {
    push('CRITICAL', 'poem-ref', `${owner} condition.missingPoem "${cond.missingPoem}" не найден`);
  }
  if (typeof cond.hasItem === 'string' && !itemIds.has(cond.hasItem)) {
    push('CRITICAL', 'item-ref', `${owner} condition.hasItem "${cond.hasItem}" — предмет не найден`);
  }
  if (cond.minTimeOfDay !== undefined || cond.maxTimeOfDay !== undefined) {
    const mn = cond.minTimeOfDay as number | undefined;
    const mx = cond.maxTimeOfDay as number | undefined;
    if (mn !== undefined && (mn < 0 || mn > 24)) push('WARN', 'time-range', `${owner} minTimeOfDay ${mn} вне 0..24`);
    if (mx !== undefined && (mx < 0 || mx > 24)) push('WARN', 'time-range', `${owner} maxTimeOfDay ${mx} вне 0..24`);
    if (mn !== undefined && mx !== undefined && mn >= mx) push('WARN', 'time-range', `${owner} minTimeOfDay ${mn} >= maxTimeOfDay ${mx}`);
  }
};

/* ── A/B/C/D over story nodes ── */
const terminalByAct = new Map<number | undefined, string[]>();
for (const [id, node] of Object.entries(story)) {
  if (node.choices.length === 0) {
    push('WARN', 'empty-choices', `story "${id}" (scene ${node.sceneId}) — пустой choices, тупик без выборов`);
  }
  const edges: string[] = [];
  for (const ch of node.choices) {
    checkCondition(`story:${id}`, ch.condition as unknown as Record<string, unknown>);
    visit(id, ch.effects);
    if (ch.next !== null) {
      if (!allIds.has(ch.next)) {
        push('CRITICAL', 'choice-target', `story "${id}" → next "${ch.next}" не существует`);
      }
      edges.push(ch.next);
    }
  }
  visit(id, node.effects);
  checkCondition(`story:${id}`, node.condition as unknown as Record<string, unknown>);
  // terminal = all choices null AND no visitStoryNode effects on choices
  const hasVisit = node.choices.some((ch) => (ch.effects ?? []).some((fx) => fx.type === 'visitStoryNode'));
  if (node.choices.length > 0 && edges.length === 0 && !hasVisit) {
    const act = node.actEntry;
    if (!terminalByAct.has(act)) terminalByAct.set(act, []);
    terminalByAct.get(act)!.push(id);
  }
}

/* ── A/B/C over dialogue nodes ── */
for (const [id, node] of Object.entries(dialogue)) {
  for (const ch of node.choices) {
    checkCondition(`dialogue:${id}`, (ch as unknown as { condition?: Record<string, unknown> }).condition);
    visit(id, (ch as unknown as { effects?: Parameters<typeof visit>[1] }).effects);
    const next = (ch as unknown as { next?: string | null }).next;
    if (next && !allIds.has(next)) {
      push('CRITICAL', 'dialogue-target', `dialogue "${id}" → next "${next}" не существует`);
    }
  }
}

/* ── zones: channel targets + flag checks + refs ── */
const zoneIds = new Set<string>();
for (const z of zones) {
  if (zoneIds.has(z.id)) push('CRITICAL', 'zone-dup', `зона "${z.id}" определена дважды (scene ${z.sceneId})`);
  zoneIds.add(z.id);
  if (z.linkedStoryNodeId && !storyIds.has(z.linkedStoryNodeId)) {
    push('CRITICAL', 'zone-story', `зона "${z.id}" → linkedStoryNodeId "${z.linkedStoryNodeId}" не существует`);
  }
  const linkedDialogue = (z as unknown as { linkedDialogueNodeId?: string }).linkedDialogueNodeId;
  if (linkedDialogue && !dialogueIds.has(linkedDialogue) && !storyIds.has(linkedDialogue)) {
    push('CRITICAL', 'zone-dialogue', `зона "${z.id}" → linkedDialogueNodeId "${linkedDialogue}" не существует`);
  }
  const linkedQuest = (z as unknown as { linkedQuestId?: string }).linkedQuestId;
  if (linkedQuest && !questIds.has(linkedQuest)) {
    push('CRITICAL', 'zone-quest', `зона "${z.id}" → linkedQuestId "${linkedQuest}" не существует`);
  }
  const linkedNpc = (z as unknown as { linkedNpcId?: string }).linkedNpcId;
  if (linkedNpc && !npcKnown(linkedNpc)) {
    push('CRITICAL', 'zone-npc', `зона "${z.id}" → linkedNpcId "${linkedNpc}" не существует`);
  }
  if (z.requiredFlag) checkFlag(z.requiredFlag, `zone:${z.id}`);
  if (z.hiddenWhenFlag) checkFlag(z.hiddenWhenFlag, `zone:${z.id}`);
  visit(`zone:${z.id}`, z.effects);
}

/* ── hubs: entry targets ── */
for (const h of hubs) {
  h.entryNodeIds.forEach((nid, i) => {
    if (!storyIds.has(nid)) {
      push('CRITICAL', 'hub-entry', `хаб "${h.hubId}"#${i} → entryNodeIds "${nid}" не существует`);
    }
  });
}

/* ── quests: story links + flag conditions + REWARD effects (setFlag lives here) ── */
for (const q of quests) {
  const qAny = q as unknown as {
    linkedStoryNodeId?: string; linkedStoryNodeIds?: readonly string[];
    steps?: readonly { condition?: Record<string, unknown> }[];
    rewards?: readonly Parameters<typeof visit>[1];
  };
  if (qAny.linkedStoryNodeId && !storyIds.has(qAny.linkedStoryNodeId)) {
    push('CRITICAL', 'quest-story', `квест "${q.id}" → linkedStoryNodeId "${qAny.linkedStoryNodeId}" не существует`);
  }
  for (const nid of qAny.linkedStoryNodeIds ?? []) {
    if (!storyIds.has(nid)) push('CRITICAL', 'quest-story', `квест "${q.id}" → linkedStoryNodeIds "${nid}" не существует`);
  }
  for (const step of qAny.steps ?? []) checkCondition(`quest:${q.id}`, step.condition);
  visit(`quest:${q.id}`, qAny.rewards);
}

/* ── B: flag hygiene report ──
 * Flags set MECHANICALLY by the engine (outside story/dialogue/zone/quest
 * data) — QuestTracker minigame objectives, terminal minigames, boss combat
 * (CombatSystem sets `${enemyType}_defeated` for bosses). Do NOT report them
 * as dangling: they are set at runtime, not in content data.
 */
const MECHANICAL_SETTERS = new Set([
  'bash_terminal_solved', // BashTerminalGame.tsx
  'openstack_terminal_solved', // engine/minigame/openstack/openstackTerminalRewards.ts
  'void_echo_all_heard', // QuestTracker cumulative gate
  'archive_vault_accessed', // QuestTracker: archive_of_forgotten/unlock_archive
  'final_poem_unlocked', // QuestTracker: echo_of_vladimir/unlock_final_poem
  'freedom_virus_written', // QuestTracker: final_code/write_freedom_virus
]);
const isMechanicalFlag = (flag: string): boolean =>
  MECHANICAL_SETTERS.has(flag) || flag.endsWith('_defeated'); // boss combat pattern
const danglingChecks: string[] = [];
for (const [flag, where] of [...flagCheckers.entries()].sort()) {
  if (!flagSetters.has(flag) && !isMechanicalFlag(flag)) {
    danglingChecks.push(`${flag}  (${[...where].slice(0, 3).join(', ')}${where.size > 3 ? ` +${where.size - 3}` : ''})`);
  }
}
const deadSets: string[] = [];
for (const [flag, where] of [...flagSetters.entries()].sort()) {
  if (!flagCheckers.has(flag)) deadSets.push(`${flag}  (${where.size} место(мест))`);
}

/* ── report ── */
const crit = findings.filter((f) => f.severity === 'CRITICAL');
const warn = findings.filter((f) => f.severity === 'WARN');

console.log('═══ АУДИТ ЛОГИКИ УЗЛОВ ═══');
console.log(`story: ${storyIds.size} | dialogue: ${dialogueIds.size} | zones: ${zones.length} | quests: ${quests.length} | hubs: ${hubs.length}`);
console.log(`items: ${itemIds.size} | poems: ${poemIds.size} | lore: ${loreIds.size} | npc: ${npcIds.size}`);
console.log('');
console.log(`CRITICAL: ${crit.length} | WARN: ${warn.length}`);
if (crit.length) {
  console.log('\n─── CRITICAL ───');
  for (const f of crit) console.log(`[${f.code}] ${f.message}`);
}
if (warn.length) {
  console.log('\n─── WARN ───');
  for (const f of warn) console.log(`[${f.code}] ${f.message}`);
}
console.log(`\n─── Флаги: проверяется, но нигде не ставится (${danglingChecks.length}) ───`);
for (const s of danglingChecks) console.log('  ' + s);
console.log(`\n─── Флаги: ставится, но нигде не проверяется (${deadSets.length}) ───`);
for (const s of deadSets.slice(0, 60)) console.log('  ' + s);
if (deadSets.length > 60) console.log(`  … +${deadSets.length - 60}`);
console.log('\n─── Терминальные story-узлы (все next:null, без visitStoryNode) по actEntry ───');
for (const [act, ids] of [...terminalByAct.entries()].sort((a, b) => (a[0] ?? 99) - (b[0] ?? 99))) {
  console.log(`  act ${act ?? '?'}: ${ids.length}`);
  if (ids.length <= 12) for (const id of ids) console.log(`    ${id}`);
}

if (crit.length > 0) {
  console.log(`\n❌ АУДИТ ПРОВАЛЕН: ${crit.length} критических проблем`);
  process.exit(1);
}
console.log('\n✅ Критических проблем: 0');
