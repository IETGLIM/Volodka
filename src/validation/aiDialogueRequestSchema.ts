/**
 * Валидация тела POST /api/ai-dialogue: лимиты строк/массивов и обязательные поля,
 * которые читает `buildDialogueContext` / `getFallbackDialogue` без optional chaining.
 */
import { z } from 'zod';
import type { DialogueRequest } from '@/lib/ai-types';

const playerPathEnum = z.enum(['none', 'creator', 'escapist', 'observer', 'broken']);

const dialogueLineSchema = z.object({
  speaker: z.enum(['player', 'npc']),
  text: z.string().max(12_000),
});

const npcRelationSchema = z
  .object({
    id: z.string().max(128),
    value: z.number().optional(),
    trust: z.number().optional(),
    respect: z.number().optional(),
    intimacy: z.number().optional(),
    stage: z.string().max(64).optional(),
  })
  .passthrough();

const dialoguePlayerStateSchema = z
  .object({
    mood: z.number().finite(),
    creativity: z.number().finite(),
    stability: z.number().finite(),
    energy: z.number().finite(),
    karma: z.number().finite(),
    selfEsteem: z.number().finite(),
    stress: z.number().finite(),
    panicMode: z.boolean(),
    path: playerPathEnum,
    act: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    skills: z
      .object({
        empathy: z.number().finite(),
        persuasion: z.number().finite(),
        intuition: z.number().finite(),
      })
      .passthrough(),
  })
  .passthrough();

export const dialogueRequestSchema = z.object({
  npcId: z.string().min(1).max(128),
  npcName: z.string().min(1).max(200),
  playerState: dialoguePlayerStateSchema,
  npcRelations: z.array(npcRelationSchema).max(120).optional(),
  dialogueHistory: z.array(dialogueLineSchema).max(100).optional(),
  currentTopic: z.string().max(8000).optional(),
});

export type ParsedDialogueRequest = z.infer<typeof dialogueRequestSchema>;

export function safeParseDialogueRequest(body: unknown): {
  ok: true;
  data: DialogueRequest;
} | {
  ok: false;
  error: z.ZodError;
} {
  const r = dialogueRequestSchema.safeParse(body);
  if (!r.success) {
    return { ok: false, error: r.error };
  }
  return {
    ok: true,
    data: {
      npcId: r.data.npcId,
      npcName: r.data.npcName,
      playerState: r.data.playerState as unknown as DialogueRequest['playerState'],
      npcRelations: (r.data.npcRelations ?? []) as unknown as DialogueRequest['npcRelations'],
      dialogueHistory: r.data.dialogueHistory ?? [],
      currentTopic: r.data.currentTopic ?? 'общая беседа',
    },
  };
}
