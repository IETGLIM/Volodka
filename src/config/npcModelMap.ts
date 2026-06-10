/**
 * Maps each story NPC to a distinct CC0 animated GLB (Khronos / Three.js samples).
 * Used when quality preset `npcRenderMode` is `hybrid` or `glb`.
 * Procedural models remain the default on low/medium presets.
 */

import { LOCAL_MODEL_PATHS } from '@/config/modelUrls';

export const NPC_MODEL_MAP: Record<string, string> = {
  // Act 1–2 core cast
  albert: LOCAL_MODEL_PATHS.cc0KhronosRiggedFigure,
  zarema: LOCAL_MODEL_PATHS.cc0Michelle,
  maria: LOCAL_MODEL_PATHS.cc0Michelle,
  cafe_barista: LOCAL_MODEL_PATHS.cc0KhronosCesiumMan,
  office_alexander: LOCAL_MODEL_PATHS.cc0Soldier,
  office_colleague: LOCAL_MODEL_PATHS.cc0KhronosCesiumMan,
  office_dmitry: LOCAL_MODEL_PATHS.cc0Xbot,
  viktor: LOCAL_MODEL_PATHS.cc0Soldier,
  kira: LOCAL_MODEL_PATHS.cc0Michelle,
  boris: LOCAL_MODEL_PATHS.cc0KhronosBrainStem,
  tamara: LOCAL_MODEL_PATHS.cc0Michelle,
  grisha: LOCAL_MODEL_PATHS.cc0KhronosCesiumMan,
  // Expanded cast
  vera: LOCAL_MODEL_PATHS.cc0Michelle,
  sergey: LOCAL_MODEL_PATHS.cc0Soldier,
  lena: LOCAL_MODEL_PATHS.cc0Michelle,
  oleg: LOCAL_MODEL_PATHS.cc0KhronosCesiumMan,
  kate: LOCAL_MODEL_PATHS.cc0Michelle,
  maxim: LOCAL_MODEL_PATHS.cc0Soldier,
  zeka: LOCAL_MODEL_PATHS.cc0Xbot,
  anya: LOCAL_MODEL_PATHS.cc0Michelle,
  // CHK sanctuary
  chk_ru: LOCAL_MODEL_PATHS.cc0KhronosCesiumMan,
  chk_based: LOCAL_MODEL_PATHS.cc0Soldier,
  chk_smert: LOCAL_MODEL_PATHS.cc0Michelle,
  chk_stalker: LOCAL_MODEL_PATHS.cc0KhronosRiggedFigure,
  chk_elis: LOCAL_MODEL_PATHS.cc0Michelle,
  chk_guest_devops: LOCAL_MODEL_PATHS.cc0Xbot,
  chk_guest_analyst: LOCAL_MODEL_PATHS.cc0KhronosCesiumMan,
};

export function getNpcModelUrl(npcId: string): string | undefined {
  return NPC_MODEL_MAP[npcId];
}
