/* ─── Volodka RPG – trigger zones barrel export ─── */

import { CHK_TRIGGER_ZONES } from '../chkTolpa/triggerZones';
import { NARRATIVE_EXPANSION_TRIGGER_ZONES } from '../narrativeExpansionTriggerZones';
import type { TriggerZone } from './types';

// ─── Re-export types ───
export type { TriggerZone } from './types';

// ─── Re-export utilities ───
export { INTERACTION_LABELS, findTriggerZoneByNpcId, findTriggerZoneByDialogueNodeId, isTriggerZoneAvailable } from './utils';

// ─── Import zone chunks (order preserved from original file) ───
import { zones as volodkaRoomZones } from './volodkaRoom';
import { zones as corridorZones } from './corridor';
import { zones as homeEarlyZones } from './homeEarly';
import { zones as officeZones } from './office';
import { zones as cafePoetryAndStreetZones } from './cafePoetryAndStreet';
import { zones as libraryAndParkZones } from './libraryAndPark';
import { zones as narrativeZones } from './narrative';
import { zones as questsZones } from './quests';
import { zones as factoryBasementZones } from './factoryBasement';
import { zones as actPathsZones } from './actPaths';
import { zones as containerZones } from './containers';

// ─── Assemble the complete TRIGGER_ZONES array ───
export const TRIGGER_ZONES: TriggerZone[] = [
  ...volodkaRoomZones,
  ...corridorZones,
  ...homeEarlyZones,
  ...officeZones,
  ...cafePoetryAndStreetZones,
  ...libraryAndParkZones,
  ...narrativeZones,
  ...questsZones,
  ...factoryBasementZones,
  ...actPathsZones,
  ...containerZones,
  ...NARRATIVE_EXPANSION_TRIGGER_ZONES,
  ...CHK_TRIGGER_ZONES,
];
