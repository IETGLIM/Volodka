#!/usr/bin/env npx tsx
/**
 * Quest reachability analyzer (QA, static analysis only).
 *
 * For every quest in QUEST_DEFINITIONS checks whether ANY activation path
 * exists from reachable narrative roots (scheduled NPC dialogues, trigger
 * zones, explore hubs, prologue, cinematic activations). See
 * src/shared/validation/questReachability.ts for the traversal rules.
 *
 * Usage: npx tsx scripts/analyze-quest-reachability.ts
 * Exit 1 when unreachable quests exist (useful for CI / pre-push checks).
 */
import { QUEST_DEFINITIONS } from '../src/data/quests/index.ts';
import { STORY_NODES } from '../src/data/story/index.ts';
import { DIALOGUE_NODES } from '../src/data/dialogue/index.ts';
import { TRIGGER_ZONES } from '../src/data/triggerZones.ts';
import { SCENE_EXPLORE_HUB_DEFS } from '../src/shared/sceneExploreHubRegistry.ts';
import { NPC_SCHEDULES_MAP } from '../src/data/npcSchedules.ts';
import { ALL_NPC_DEFINITIONS } from '../src/data/allNpcDefinitions.ts';
import { computeQuestReachability } from '../src/shared/validation/questReachability.ts';

const report = computeQuestReachability({
  quests: QUEST_DEFINITIONS,
  storyNodes: STORY_NODES as never,
  dialogueNodes: DIALOGUE_NODES as never,
  zones: TRIGGER_ZONES,
  hubIds: SCENE_EXPLORE_HUB_DEFS.map((d) => d.hubId),
  npcDefinitions: ALL_NPC_DEFINITIONS,
  scheduledNpcIds: new Set(Object.keys(NPC_SCHEDULES_MAP)),
  prologueNodeId: 'start',
  // CinematicTimelineRunner dispatches quest/activate directly:
  cinematicQuestIds: ['first_reading', 'morning_sync'],
});

const reachable = QUEST_DEFINITIONS.length - report.unreachableIds.length;

console.log(`Всего квестов: ${QUEST_DEFINITIONS.length}`);
console.log(`Достижимых (есть путь активации): ${reachable}`);
console.log(`НЕДОСТИЖИМЫХ: ${report.unreachableIds.length}`);

if (report.unreachableIds.length > 0) {
  const byPack = new Map<string, string[]>();
  for (const quest of QUEST_DEFINITIONS) {
    if (!report.unreachableIds.includes(quest.id)) continue;
    const prefix = quest.id.split('_').slice(0, quest.id.startsWith('quest_act') ? 2 : 1).join('_');
    const list = byPack.get(prefix) ?? [];
    list.push(`${quest.id} (акт ${quest.act ?? '?'}, ${quest.questType})`);
    byPack.set(prefix, list);
  }
  for (const [pack, list] of [...byPack.entries()].sort()) {
    console.log(`\n── ${pack} (${list.length}) ──`);
    for (const line of list) console.log(`  ${line}`);
  }
  process.exit(1);
}
process.exit(0);
