import { describe, expect, it } from 'vitest';
import { findTriggerZoneByNpcId, TRIGGER_ZONES } from '@/data/triggerZones';
import { resolveNpcNarrativeTarget } from '@/engine/interaction/npcNarrativeRouting';
import { resolveNpcIdFromSpeaker } from '@/data/allNpcDefinitions';

describe('findTriggerZoneByNpcId', () => {
  it('prefers zone in the requested scene', () => {
    const corridor = findTriggerZoneByNpcId(TRIGGER_ZONES, 'solnysh', 'volodka_corridor');
    expect(corridor?.id).toBe('corridor_solnysh');

    const room = findTriggerZoneByNpcId(TRIGGER_ZONES, 'solnysh', 'solnysh_room');
    expect(room?.id).toBe('solnysh_vera_talk');
  });
});

describe('resolveNpcNarrativeTarget', () => {
  it('opens corridor greeting for vera in volodka_corridor', () => {
    const target = resolveNpcNarrativeTarget('solnysh', 'vera_greeting', 'volodka_corridor');
    expect(target).toEqual({ kind: 'dialogue', nodeId: 'solnysh_corridor_greeting' });
  });

  it('opens room story for vera in solnysh_room', () => {
    const target = resolveNpcNarrativeTarget('solnysh', 'vera_greeting', 'solnysh_room');
    expect(target).toEqual({ kind: 'story', nodeId: 'solnysh_room_talk' });
  });

  it('falls back to default dialogue outside home scenes', () => {
    const target = resolveNpcNarrativeTarget('solnysh', 'vera_greeting', 'library_day');
    expect(target).toEqual({ kind: 'default_dialogue', nodeId: 'vera_greeting' });
  });

  it('opens lyonya greeting in solnysh_room', () => {
    const target = resolveNpcNarrativeTarget('lyonya', 'lyonya_greeting', 'solnysh_room');
    expect(target).toEqual({ kind: 'dialogue', nodeId: 'lyonya_greeting' });
  });
});

describe('resolveNpcIdFromSpeaker', () => {
  it('maps Солныш and Алина to solnysh', () => {
    expect(resolveNpcIdFromSpeaker('Солныш')).toBe('solnysh');
    expect(resolveNpcIdFromSpeaker('Алина')).toBe('solnysh');
  });

  it('maps Лёня and Леонид to lyonya', () => {
    expect(resolveNpcIdFromSpeaker('Лёня')).toBe('lyonya');
    expect(resolveNpcIdFromSpeaker('Леонид')).toBe('lyonya');
  });
});
