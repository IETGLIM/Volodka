/* ─── Volodka RPG – content pipeline cross-reference validator ───
 * Validates: Story Node → Quest → NPC → Scene → Trigger → Reward → Poem/Item
 * Run via: npm run validate
 */

import type { StoryEffect } from '@/shared/types/game';
import { STORY_NODES } from '@/data/storyNodes';
import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { validateNpcDefinitionModelPaths } from '@/data/npcDefinitions';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { SCENE_DEFINITIONS, type SceneId } from '@/config/sceneDefinitions';
import { POEMS } from '@/data/poems';
import { getAllItemDefinitions } from '@/data/items';
import { getAllUnifiedPoems } from '@/data/unifiedPoemRegistry';
import { INITIAL_LORE_ENTRIES } from '@/data/loreEntries';
import { LORE_SCENE_MAP, LORE_STORY_NODE_MAP } from '@/data/loreSceneMap';
import { CUTSCENES } from '@/data/cutscenes';
import { NPC_SCHEDULES, ACT_SCHEDULE_OVERRIDES } from '@/data/npcSchedules';
import { EXPANDED_NPC_QUEST_LINKS } from '@/data/expandedNPCs';
import {
  GOLDEN_PATH_STORY_SPINE,
  GOLDEN_PATH_QUEST_SPINE,
  STORY_NODE_ALIASES,
  NPC_ID_ALIASES,
  getNpcIdForStoryNode,
} from '@/data/goldenPath';
import { getGoldenPathDerivationReport } from '@/engine/guidedStory/buildGuidedStoryPath';
import { QUEST_ITEM_DEFINITIONS } from '@/data/questItems';
import { isKnownMinigameId, MINIGAME_COMPLETION_FLAGS } from '@/shared/constants/minigames';
import { QUEST_MINIGAME_MAP } from '@/data/questMinigameMap';
import { ENEMY_TEMPLATES } from '@/engine/combat/enemies';
import {
  QUEST_START_ITEMS,
  QUEST_REQUIRED_ITEMS,
  QUEST_COMPLETION_CONSUME_ITEMS,
} from '@/data/questItems';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  category: string;
  path: string;
  message: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

function issue(
  severity: ValidationSeverity,
  category: string,
  path: string,
  message: string,
): ValidationIssue {
  return { severity, category, path, message };
}

function buildSets() {
  const storyNodeIds = new Set(Object.keys(STORY_NODES));
  const dialogueNodeIds = new Set(Object.keys(DIALOGUE_NODES));
  const questIds = new Set(QUEST_DEFINITIONS.map((q) => q.id));
  const npcIds = new Set(ALL_NPC_DEFINITIONS.map((n) => n.id));
  const sceneIds = new Set(Object.keys(SCENE_DEFINITIONS) as SceneId[]);
  const poemIds = new Set(POEMS.map((p) => p.id));
  const unifiedPoemIds = new Set(getAllUnifiedPoems().map((p) => p.id));
  const itemIds = new Set([
    ...getAllItemDefinitions().map((i) => i.id),
    ...Object.keys(QUEST_ITEM_DEFINITIONS),
  ]);
  const loreIds = new Set(INITIAL_LORE_ENTRIES.map((l) => l.id));
  const cutsceneIds = new Set(Object.keys(CUTSCENES));
  const enemyTypes = new Set(Object.keys(ENEMY_TEMPLATES));
  const triggerMinigames = new Set(['codebreaker', 'openstack_terminal', 'bash_terminal']);

  return {
    storyNodeIds,
    dialogueNodeIds,
    questIds,
    npcIds,
    sceneIds,
    poemIds,
    unifiedPoemIds,
    itemIds,
    loreIds,
    cutsceneIds,
    enemyTypes,
    triggerMinigames,
  };
}

function resolveNodeRef(
  next: string | null | undefined,
  storyNodeIds: Set<string>,
  dialogueNodeIds: Set<string>,
): boolean {
  if (next == null) return true;
  const resolved = STORY_NODE_ALIASES[next] ?? next;
  return storyNodeIds.has(resolved) || storyNodeIds.has(next) || dialogueNodeIds.has(next);
}

function isKnownNpcId(npcId: string, reg: ReturnType<typeof buildSets>): boolean {
  return reg.npcIds.has(npcId) || npcId in NPC_ID_ALIASES;
}

function walkEffects(
  effects: StoryEffect[] | undefined,
  path: string,
  reg: ReturnType<typeof buildSets>,
  out: ValidationIssue[],
): void {
  if (!effects) return;
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    const ep = `${path}.effects[${i}]`;
    switch (e.type) {
      case 'collectPoem':
        if (e.poemId && !reg.poemIds.has(e.poemId)) {
          out.push(issue('error', 'effect', ep, `unknown poemId "${e.poemId}"`));
        }
        break;
      case 'triggerQuest':
        if (e.questId && !reg.questIds.has(e.questId)) {
          out.push(issue('error', 'effect', ep, `unknown questId "${e.questId}"`));
        }
        break;
      case 'addItem':
      case 'removeItem':
        if (e.itemId && !reg.itemIds.has(e.itemId)) {
          out.push(issue('error', 'effect', ep, `unknown itemId "${e.itemId}"`));
        }
        break;
      case 'npcChange':
        if (e.npcId && !isKnownNpcId(e.npcId, reg)) {
          out.push(issue('error', 'effect', ep, `unknown npcId "${e.npcId}"`));
        }
        break;
      case 'discoverLore':
        if (e.loreId) {
          for (const lid of e.loreId.split(',').map((s) => s.trim()).filter(Boolean)) {
            if (!reg.loreIds.has(lid)) {
              out.push(issue('error', 'effect', ep, `unknown loreId "${lid}"`));
            }
          }
        }
        break;
      case 'combat':
        if (e.enemyType && !reg.enemyTypes.has(e.enemyType)) {
          out.push(issue('error', 'effect', ep, `unknown enemyType "${e.enemyType}"`));
        }
        break;
      default:
        break;
    }
  }
}

function validateStoryGraph(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  for (const [key, node] of Object.entries(STORY_NODES)) {
    const base = `story:${key}`;
    if (node.id !== key) {
      out.push(issue('error', 'story', base, `record key "${key}" !== node.id "${node.id}"`));
    }
    if (node.sceneId && !reg.sceneIds.has(node.sceneId)) {
      out.push(issue('error', 'story', base, `unknown sceneId "${node.sceneId}"`));
    }
    for (let i = 0; i < (node.choices?.length ?? 0); i++) {
      const choice = node.choices![i];
      const cp = `${base}.choices[${i}]`;
      if (!resolveNodeRef(choice.next, reg.storyNodeIds, reg.dialogueNodeIds)) {
        out.push(issue('error', 'story', cp, `next "${choice.next}" not in STORY_NODES or DIALOGUE_NODES`));
      }
      walkEffects(choice.effects, cp, reg, out);
    }
    walkEffects(node.effects, base, reg, out);
  }
}

function validateDialogueGraph(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  for (const [key, node] of Object.entries(DIALOGUE_NODES)) {
    const base = `dialogue:${key}`;
    if (node.id !== key) {
      out.push(issue('error', 'dialogue', base, `record key "${key}" !== node.id "${node.id}"`));
    }
    for (let i = 0; i < (node.choices?.length ?? 0); i++) {
      const choice = node.choices![i];
      const cp = `${base}.choices[${i}]`;
      if (!resolveNodeRef(choice.next, reg.storyNodeIds, reg.dialogueNodeIds)) {
        out.push(issue('error', 'dialogue', cp, `next "${choice.next}" not in STORY_NODES or DIALOGUE_NODES`));
      }
      walkEffects(choice.effects, cp, reg, out);
    }
  }
}

function validateQuests(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  const questIdList = QUEST_DEFINITIONS.map((q) => q.id);
  const dupes = questIdList.filter((id, i) => questIdList.indexOf(id) !== i);
  for (const id of new Set(dupes)) {
    out.push(issue('error', 'quest', `quest:${id}`, 'duplicate quest id'));
  }

  for (const quest of QUEST_DEFINITIONS) {
    const base = `quest:${quest.id}`;

    if (quest.linkedStoryNodeId && !reg.storyNodeIds.has(quest.linkedStoryNodeId)) {
      out.push(issue('error', 'quest', base, `linkedStoryNodeId "${quest.linkedStoryNodeId}" not in STORY_NODES`));
    }
    for (const nodeId of quest.linkedStoryNodeIds ?? []) {
      if (!reg.storyNodeIds.has(nodeId)) {
        out.push(issue('error', 'quest', base, `linkedStoryNodeIds contains unknown "${nodeId}"`));
      }
    }

    if (quest.questGiverNpcId && !isKnownNpcId(quest.questGiverNpcId, reg)) {
      out.push(issue('error', 'quest', base, `questGiverNpcId "${quest.questGiverNpcId}" not in NPC registry`));
    }

    for (const reqId of quest.requiresQuests ?? []) {
      if (!reg.questIds.has(reqId)) {
        out.push(issue('error', 'quest', base, `requiresQuests contains unknown "${reqId}"`));
      }
    }

    for (const objective of quest.objectives) {
      const op = `${base}.objective:${objective.id}`;
      if (!objective.target) continue;
      switch (objective.type) {
        case 'location_visited':
          if (!reg.sceneIds.has(objective.target as SceneId)) {
            out.push(issue('error', 'quest', op, `location target "${objective.target}" not in SCENE_DEFINITIONS`));
          }
          break;
        case 'npc_talked':
          if (!isKnownNpcId(objective.target, reg)) {
            out.push(issue('error', 'quest', op, `npc_talked target "${objective.target}" not in NPC registry`));
          }
          break;
        case 'item_collected':
          if (!reg.itemIds.has(objective.target)) {
            out.push(issue('error', 'quest', op, `item_collected target "${objective.target}" not in items`));
          }
          break;
        case 'poem_collected':
          if (!reg.poemIds.has(objective.target)) {
            out.push(issue('error', 'quest', op, `poem_collected target "${objective.target}" not in POEMS`));
          }
          break;
        case 'minigame_completed':
          if (!isKnownMinigameId(objective.target)) {
            out.push(issue('error', 'quest', op, `minigame_completed target "${objective.target}" unknown`));
          } else if (!MINIGAME_COMPLETION_FLAGS[objective.target]) {
            out.push(
              issue(
                'error',
                'quest',
                op,
                `minigame_completed target "${objective.target}" missing MINIGAME_COMPLETION_FLAGS entry`,
              ),
            );
          }
          break;
        default:
          break;
      }
      if (objective.poemPowerBypass && !reg.poemIds.has(objective.poemPowerBypass)) {
        out.push(issue('error', 'quest', op, `poemPowerBypass "${objective.poemPowerBypass}" not in POEMS`));
      }
    }

    walkEffects(quest.rewards, `${base}.rewards`, reg, out);

    const flagObjectives = quest.objectives.filter((o) => o.type === 'flag_set' && o.target);
    const byFlag = new Map<string, string[]>();
    for (const o of flagObjectives) {
      const ids = byFlag.get(o.target!) ?? [];
      ids.push(o.id);
      byFlag.set(o.target!, ids);
    }
    for (const [flag, ids] of byFlag) {
      if (ids.length > 1) {
        out.push(issue('warning', 'quest', base, `duplicate flag_set target "${flag}" on objectives: ${ids.join(', ')}`));
      }
    }
    for (const reward of quest.rewards ?? []) {
      if (reward.type === 'setFlag' && reward.flag) {
        const match = flagObjectives.find((o) => o.target === reward.flag);
        if (match) {
          out.push(issue('warning', 'quest', base, `reward setFlag "${reward.flag}" duplicates objective "${match.id}"`));
        }
      }
    }
  }

  // requiresQuests cycle detection
  const graph = new Map<string, string[]>();
  for (const q of QUEST_DEFINITIONS) {
    graph.set(q.id, q.requiresQuests ?? []);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function dfs(id: string, stack: string[]): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      out.push(issue('error', 'quest', `quest:${id}`, `requiresQuests cycle: ${[...stack, id].join(' → ')}`));
      return;
    }
    visiting.add(id);
    for (const dep of graph.get(id) ?? []) {
      dfs(dep, [...stack, id]);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const q of QUEST_DEFINITIONS) dfs(q.id, []);
}

function validateMinigameQuestBridge(out: ValidationIssue[]): void {
  const minigameObjectives: Array<{ questId: string; objectiveId: string; target: string }> = [];

  for (const quest of QUEST_DEFINITIONS) {
    for (const objective of quest.objectives) {
      if (objective.type !== 'minigame_completed' || !objective.target) continue;
      minigameObjectives.push({
        questId: quest.id,
        objectiveId: objective.id,
        target: objective.target,
      });
    }
  }

  for (const { questId, objectiveId, target } of minigameObjectives) {
    const mapping = QUEST_MINIGAME_MAP[questId];
    const base = `quest:${questId}.objective:${objectiveId}`;
    if (!mapping) {
      out.push(
        issue(
          'error',
          'quest-minigame',
          base,
          `minigame_completed objective missing QUEST_MINIGAME_MAP entry (target "${target}")`,
        ),
      );
      continue;
    }
    if (mapping.objectiveId !== objectiveId || mapping.minigameType !== target) {
      out.push(
        issue(
          'error',
          'quest-minigame',
          base,
          `QUEST_MINIGAME_MAP mismatch: map has objective "${mapping.objectiveId}" / "${mapping.minigameType}", quest has "${objectiveId}" / "${target}"`,
        ),
      );
    }
  }

  for (const [questId, mapping] of Object.entries(QUEST_MINIGAME_MAP)) {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === questId);
    if (!quest) {
      out.push(issue('error', 'quest-minigame', `QUEST_MINIGAME_MAP.${questId}`, 'unknown quest id'));
      continue;
    }
    const objective = quest.objectives.find((o) => o.id === mapping.objectiveId);
    if (!objective || objective.type !== 'minigame_completed') {
      out.push(
        issue(
          'error',
          'quest-minigame',
          `QUEST_MINIGAME_MAP.${questId}`,
          `objective "${mapping.objectiveId}" is not minigame_completed in quest definition`,
        ),
      );
    }
  }
}

function validateQuestStoryGiverAlignment(out: ValidationIssue[]): void {
  for (const quest of QUEST_DEFINITIONS) {
    if (!quest.linkedStoryNodeId || !quest.questGiverNpcId) continue;
    const storyNpc = getNpcIdForStoryNode(quest.linkedStoryNodeId);
    if (!storyNpc) continue;
    const canonicalGiver = NPC_ID_ALIASES[quest.questGiverNpcId] ?? quest.questGiverNpcId;
    const canonicalStoryNpc = NPC_ID_ALIASES[storyNpc] ?? storyNpc;
    if (canonicalGiver !== canonicalStoryNpc) {
      out.push(
        issue(
          'warning',
          'quest',
          `quest:${quest.id}`,
          `questGiverNpcId "${quest.questGiverNpcId}" differs from story node NPC "${storyNpc}" for linkedStoryNodeId "${quest.linkedStoryNodeId}"`,
        ),
      );
    }
  }
}

function validateNpcs(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  for (const { npcId, message } of validateNpcDefinitionModelPaths()) {
    out.push(issue('warning', 'npc', `npc:${npcId}`, message));
  }

  for (const npc of ALL_NPC_DEFINITIONS) {
    const base = `npc:${npc.id}`;
    if (npc.dialogueNodeId && !reg.dialogueNodeIds.has(npc.dialogueNodeId)) {
      out.push(issue('error', 'npc', base, `dialogueNodeId "${npc.dialogueNodeId}" not in DIALOGUE_NODES`));
    }
  }

  for (const schedule of NPC_SCHEDULES) {
    const base = `schedule:${schedule.npcId}`;
    if (!reg.npcIds.has(schedule.npcId)) {
      out.push(issue('error', 'npc', base, `schedule references unknown npcId "${schedule.npcId}"`));
    }
    for (let i = 0; i < schedule.entries.length; i++) {
      const entry = schedule.entries[i];
      if (!reg.sceneIds.has(entry.sceneId)) {
        out.push(issue('error', 'npc', `${base}.entries[${i}]`, `unknown sceneId "${entry.sceneId}"`));
      }
    }
  }

  for (const override of ACT_SCHEDULE_OVERRIDES) {
    for (const reqId of override.requiredCompletedQuests ?? []) {
      if (!reg.questIds.has(reqId)) {
        out.push(issue('error', 'npc', `schedule-override:${override.id}`, `unknown requiredCompletedQuest "${reqId}"`));
      }
    }
  }

  for (const [npcId, questLinks] of Object.entries(EXPANDED_NPC_QUEST_LINKS)) {
    if (!reg.npcIds.has(npcId)) {
      out.push(issue('error', 'npc', `expanded-links:${npcId}`, 'unknown npcId in EXPANDED_NPC_QUEST_LINKS'));
    }
    for (const qid of questLinks) {
      if (!reg.questIds.has(qid)) {
        out.push(issue('error', 'npc', `expanded-links:${npcId}`, `unknown questId "${qid}"`));
      }
    }
  }
}

function validateTriggers(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  const zoneIds = new Set<string>();
  for (const zone of TRIGGER_ZONES) {
    const base = `trigger:${zone.id}`;
    if (zoneIds.has(zone.id)) {
      out.push(issue('error', 'trigger', base, 'duplicate trigger zone id'));
    }
    zoneIds.add(zone.id);

    if (!reg.sceneIds.has(zone.sceneId)) {
      out.push(issue('error', 'trigger', base, `unknown sceneId "${zone.sceneId}"`));
    }
    if (zone.linkedStoryNodeId && !reg.storyNodeIds.has(zone.linkedStoryNodeId)) {
      out.push(issue('error', 'trigger', base, `linkedStoryNodeId "${zone.linkedStoryNodeId}" not in STORY_NODES`));
    }
    if (zone.linkedDialogueNodeId && !reg.dialogueNodeIds.has(zone.linkedDialogueNodeId)) {
      out.push(issue('error', 'trigger', base, `linkedDialogueNodeId "${zone.linkedDialogueNodeId}" not in DIALOGUE_NODES`));
    }
    if (zone.linkedQuestId && !reg.questIds.has(zone.linkedQuestId)) {
      out.push(issue('error', 'trigger', base, `linkedQuestId "${zone.linkedQuestId}" not in QUEST_DEFINITIONS`));
    }
    if (zone.linkedNpcId && !isKnownNpcId(zone.linkedNpcId, reg)) {
      out.push(issue('error', 'trigger', base, `linkedNpcId "${zone.linkedNpcId}" not in NPC registry`));
    }
    if (zone.linkedMinigame && !reg.triggerMinigames.has(zone.linkedMinigame)) {
      out.push(issue('error', 'trigger', base, `linkedMinigame "${zone.linkedMinigame}" invalid`));
    }
    walkEffects(zone.effects, base, reg, out);
  }
}

function validateScenes(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  for (const [sceneId, def] of Object.entries(SCENE_DEFINITIONS)) {
    const base = `scene:${sceneId}`;
    for (let i = 0; i < (def.exits?.length ?? 0); i++) {
      const exit = def.exits![i];
      if (!reg.sceneIds.has(exit.targetScene)) {
        out.push(issue('error', 'scene', `${base}.exits[${i}]`, `targetScene "${exit.targetScene}" unknown`));
      }
    }
  }
}

function validatePoems(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  const seenIds = new Set<string>();
  const orderToIds = new Map<number, string[]>();

  for (const poem of POEMS) {
    if (seenIds.has(poem.id)) {
      out.push(issue('error', 'poem', `poem:${poem.id}`, 'duplicate poem id in POEMS'));
    }
    seenIds.add(poem.id);

    const orderList = orderToIds.get(poem.order) ?? [];
    orderList.push(poem.id);
    orderToIds.set(poem.order, orderList);

    if (!reg.storyNodeIds.has(poem.unlocksAt)) {
      out.push(
        issue('error', 'poem', `poem:${poem.id}`, `unlocksAt "${poem.unlocksAt}" not in STORY_NODES`),
      );
    }
  }

  for (const [order, ids] of orderToIds) {
    if (ids.length > 1) {
      out.push(
        issue('warning', 'poem', 'poems', `duplicate poem order ${order}: ${ids.join(', ')}`),
      );
    }
  }

  for (const poemId of reg.poemIds) {
    if (!reg.unifiedPoemIds.has(poemId)) {
      out.push(issue('warning', 'poem', `poem:${poemId}`, 'missing from UNIFIED_POEM_REGISTRY'));
    }
  }
  for (const poemId of reg.unifiedPoemIds) {
    if (!reg.poemIds.has(poemId)) {
      out.push(issue('warning', 'poem', `unified:${poemId}`, 'in UNIFIED_POEM_REGISTRY but not in POEMS'));
    }
  }
}

function validateStoryNodeAliases(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  for (const [alias, target] of Object.entries(STORY_NODE_ALIASES)) {
    if (!reg.storyNodeIds.has(alias)) {
      out.push(issue('error', 'story-alias', alias, `alias node missing in STORY_NODES (→ ${target})`));
    } else if (!reg.storyNodeIds.has(target)) {
      out.push(issue('error', 'story-alias', alias, `alias target "${target}" not in STORY_NODES`));
    }
  }
}

function validateNpcAliases(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  for (const [alias, canonical] of Object.entries(NPC_ID_ALIASES)) {
    if (!reg.npcIds.has(canonical)) {
      out.push(issue('error', 'npc-alias', alias, `alias target "${canonical}" not in NPC registry`));
    }
  }
}

function validateLore(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  for (const entry of INITIAL_LORE_ENTRIES) {
    for (const rel of entry.relatedEntries ?? []) {
      if (!reg.loreIds.has(rel)) {
        out.push(issue('error', 'lore', `lore:${entry.id}`, `relatedEntries contains unknown "${rel}"`));
      }
    }
  }
  for (const [sceneId, ids] of Object.entries(LORE_SCENE_MAP)) {
    if (!reg.sceneIds.has(sceneId as SceneId)) {
      out.push(issue('error', 'lore', `LORE_SCENE_MAP.${sceneId}`, 'unknown scene key'));
    }
    for (const lid of ids ?? []) {
      if (!reg.loreIds.has(lid)) {
        out.push(issue('error', 'lore', `LORE_SCENE_MAP.${sceneId}`, `unknown loreId "${lid}"`));
      }
    }
  }
  for (const [nodeId, ids] of Object.entries(LORE_STORY_NODE_MAP)) {
    if (!reg.storyNodeIds.has(nodeId)) {
      out.push(issue('error', 'lore', `LORE_STORY_NODE_MAP.${nodeId}`, 'unknown story node key'));
    }
    for (const lid of ids ?? []) {
      if (!reg.loreIds.has(lid)) {
        out.push(issue('error', 'lore', `LORE_STORY_NODE_MAP.${nodeId}`, `unknown loreId "${lid}"`));
      }
    }
  }
}

function validateCutscenes(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  for (const [id, cut] of Object.entries(CUTSCENES)) {
    const base = `cutscene:${id}`;
    if (cut.triggerStoryNode && !reg.storyNodeIds.has(cut.triggerStoryNode)) {
      out.push(issue('error', 'cutscene', base, `triggerStoryNode "${cut.triggerStoryNode}" not in STORY_NODES`));
    }
  }
}

function validateQuestItems(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  const maps: Array<[string, Record<string, unknown>]> = [
    ['QUEST_START_ITEMS', QUEST_START_ITEMS],
    ['QUEST_REQUIRED_ITEMS', QUEST_REQUIRED_ITEMS],
    ['QUEST_COMPLETION_CONSUME_ITEMS', QUEST_COMPLETION_CONSUME_ITEMS],
  ];
  for (const [name, map] of maps) {
    for (const [questId, items] of Object.entries(map)) {
      if (!reg.questIds.has(questId)) {
        out.push(issue('error', 'quest-items', `${name}.${questId}`, 'unknown quest id key'));
      }
      const raw = items as unknown;
      const itemList = Array.isArray(raw)
        ? raw.map((entry) => (typeof entry === 'string' ? entry : (entry as { id?: string }).id))
        : [typeof raw === 'string' ? raw : (raw as { id?: string }).id];
      for (const itemId of itemList) {
        if (itemId && !reg.itemIds.has(itemId)) {
          out.push(issue('error', 'quest-items', `${name}.${questId}`, `unknown itemId "${itemId}"`));
        }
      }
    }
  }
}

function validateGoldenPath(reg: ReturnType<typeof buildSets>, out: ValidationIssue[]): void {
  for (const nodeId of GOLDEN_PATH_STORY_SPINE) {
    if (!reg.storyNodeIds.has(nodeId)) {
      out.push(issue('error', 'golden-path', 'GOLDEN_PATH_STORY_SPINE', `unknown story node "${nodeId}"`));
    }
  }
  for (const questId of GOLDEN_PATH_QUEST_SPINE) {
    if (!reg.questIds.has(questId)) {
      out.push(issue('error', 'golden-path', 'GOLDEN_PATH_QUEST_SPINE', `unknown quest id "${questId}"`));
    }
  }

  const report = getGoldenPathDerivationReport(STORY_NODES);

  if (report.storySpine.length !== GOLDEN_PATH_STORY_SPINE.length) {
    out.push(
      issue(
        'warning',
        'golden-path',
        'deriveStorySpine',
        `derived spine length ${report.storySpine.length} !== manual ${GOLDEN_PATH_STORY_SPINE.length} — add choice.goldenPath markers or update fallback`,
      ),
    );
  } else {
    for (let i = 0; i < GOLDEN_PATH_STORY_SPINE.length; i++) {
      if (report.storySpine[i] !== GOLDEN_PATH_STORY_SPINE[i]) {
        out.push(
          issue(
            'warning',
            'golden-path',
            `deriveStorySpine[${i}]`,
            `derived "${report.storySpine[i]}" !== manual "${GOLDEN_PATH_STORY_SPINE[i]}"`,
          ),
        );
        break;
      }
    }
  }

  for (const nodeId of report.missingGoldenPathMarkers) {
    if (nodeId === GOLDEN_PATH_STORY_SPINE[GOLDEN_PATH_STORY_SPINE.length - 1]) {
      continue;
    }
    out.push(
      issue(
        'warning',
        'golden-path',
        `story.${nodeId}`,
        'spine step lacks choice.goldenPath — still using GOLDEN_PATH_STORY_SPINE fallback',
      ),
    );
  }

  for (const { nodeId, targets } of report.ambiguousGoldenPathNodes) {
    out.push(
      issue(
        'error',
        'golden-path',
        `story.${nodeId}`,
        `multiple choices marked goldenPath (${targets.length}) → ${targets.join(', ')}`,
      ),
    );
  }

  for (const [nodeId, node] of Object.entries(STORY_NODES)) {
    const goldenChoices = node.choices.filter((c) => c.goldenPath === true);
    for (const choice of goldenChoices) {
      if (!choice.next || !reg.storyNodeIds.has(choice.next)) {
        out.push(
          issue(
            'error',
            'golden-path',
            `story.${nodeId}`,
            `goldenPath choice points to missing node "${choice.next ?? 'null'}"`,
          ),
        );
      }
    }
  }
}

/** Run all content pipeline cross-reference checks. */
export function validateContentPipeline(): ValidationReport {
  const reg = buildSets();
  const issues: ValidationIssue[] = [];

  validateStoryGraph(reg, issues);
  validateDialogueGraph(reg, issues);
  validateQuests(reg, issues);
  validateMinigameQuestBridge(issues);
  validateQuestStoryGiverAlignment(issues);
  validateNpcs(reg, issues);
  validateTriggers(reg, issues);
  validateScenes(reg, issues);
  validatePoems(reg, issues);
  validateStoryNodeAliases(reg, issues);
  validateNpcAliases(reg, issues);
  validateLore(reg, issues);
  validateCutscenes(reg, issues);
  validateQuestItems(reg, issues);
  validateGoldenPath(reg, issues);

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return { issues, errorCount, warningCount };
}

/** Log issues to console (dev / CLI). Returns true if no errors. */
export function logValidationReport(report: ValidationReport, prefix = '[ContentPipeline]'): boolean {
  for (const i of report.issues) {
    const tag = i.severity === 'error' ? 'ERROR' : 'WARN';
    console.warn(`${prefix} [${tag}] ${i.category} ${i.path}: ${i.message}`);
  }
  return report.errorCount === 0;
}
