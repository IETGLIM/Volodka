import { STORY_NODES_ACT1_EXTENDED } from '../src/data/story/act1Extended.ts';
import { STORY_NODES_ACT1_CAFE_OFFICE } from '../src/data/story/act1ExtendedCafeOffice.ts';
import { QUESTS_ACT1 } from '../src/data/quests/act1.ts';
import { SCENE_IDS } from '../src/config/sceneDefinitions.ts';
import { STORY_NODES } from '../src/data/story/index.ts';
import { EXPLORATION_DIALOGUE_NODES } from '../src/data/explorationDialogueNodes.ts';
import { TRIGGER_ZONES } from '../src/data/triggerZones.ts';
import { NPC_DEFINITIONS } from '../src/data/npcDefinitions.ts';
import { EXPANDED_NPCS } from '../src/data/expandedNPCs.ts';

const sceneSet = new Set(SCENE_IDS);
const npcIds = new Set([...NPC_DEFINITIONS, ...EXPANDED_NPCS].map((n) => n.id));
const storyIds = new Set(Object.keys(STORY_NODES));
const dialogueIds = new Set(Object.keys(EXPLORATION_DIALOGUE_NODES));

const errors: string[] = [];
const warnings: string[] = [];

const EXTENDED_NODES = { ...STORY_NODES_ACT1_EXTENDED, ...STORY_NODES_ACT1_CAFE_OFFICE };

for (const [id, node] of Object.entries(EXTENDED_NODES)) {
  if (!sceneSet.has(node.sceneId)) errors.push(`story ${id}: missing scene ${node.sceneId}`);
  for (const c of node.choices) {
    if (c.next && !storyIds.has(c.next)) errors.push(`story ${id}: missing next ${c.next}`);
    for (const e of c.effects ?? []) {
      if (e.type === 'npcChange' && !npcIds.has(e.npcId)) errors.push(`story ${id}: missing npc ${e.npcId}`);
      if (e.type === 'visitStoryNode' && !storyIds.has(e.nodeId)) {
        errors.push(`story ${id}: missing visitStoryNode ${e.nodeId}`);
      }
    }
  }
}

const newQuestIds = ['corridor_letter', 'zarema_radio', 'morning_ritual', 'cafe_backroom_echo'];
for (const q of QUESTS_ACT1.filter((q) => newQuestIds.includes(q.id))) {
  if (q.linkedStoryNodeId && !storyIds.has(q.linkedStoryNodeId)) {
    errors.push(`quest ${q.id}: missing linkedStoryNode ${q.linkedStoryNodeId}`);
  }
  if (q.questGiverNpcId && !npcIds.has(q.questGiverNpcId)) {
    errors.push(`quest ${q.id}: missing questGiver ${q.questGiverNpcId}`);
  }
}

const act1Scenes = [
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'street_night',
  'cafe_evening',
  'office_day',
] as const;
const act1Zones = TRIGGER_ZONES.filter((z) => act1Scenes.includes(z.sceneId as (typeof act1Scenes)[number]));

const zoneByDialogue = new Map(
  act1Zones.filter((z) => z.linkedDialogueNodeId).map((z) => [z.linkedDialogueNodeId, z.id]),
);

const newDialogueLinks = [
  'explore_corridor_letter',
  'explore_corridor_intercom',
  'explore_room_wardrobe',
  'explore_kitchen_radio',
  'explore_street_guild_tower',
  'explore_cafe_backroom',
  'explore_office_server_hum',
  'explore_office_vault_bash',
  'explore_office_vault_archive',
];

for (const lid of newDialogueLinks) {
  if (!dialogueIds.has(lid)) errors.push(`missing dialogue ${lid}`);
  if (!zoneByDialogue.has(lid)) warnings.push(`no act1 trigger zone for dialogue ${lid}`);
}

const npcInAct1Zones = new Set(act1Zones.map((z) => z.linkedNpcId).filter(Boolean));
const expectedAct1Npcs = ['vera', 'zarema', 'albert', 'maria', 'cafe_barista', 'office_alexander', 'office_colleague'];
for (const npcId of expectedAct1Npcs) {
  if (!npcIds.has(npcId)) errors.push(`missing npc definition ${npcId}`);
  if (!npcInAct1Zones.has(npcId)) warnings.push(`npc ${npcId} has no act1 trigger zone (schedule-only)`);
}

console.log('Act1 extended scene/NPC verification');
console.log(`Story nodes: ${Object.keys(EXTENDED_NODES).length}`);
console.log(`Act1 trigger zones: ${act1Zones.length}`);
console.log(`Act1 scenes registered: ${act1Scenes.every((s) => sceneSet.has(s))}`);
console.log('Errors:', errors.length ? errors : 'none');
console.log('Warnings:', warnings.length ? warnings : 'none');

if (errors.length) process.exit(1);
