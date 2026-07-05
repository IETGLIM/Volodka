import { describe, expect, it } from 'vitest';
import { resolveVoiceLineAudioUrl } from '@/engine/audio/voiceLinePlayer';
import { getVoiceLine, initVoiceLineRegistry } from '@/engine/audio/VoiceLineRegistry';

describe('voiceLinePlayer', () => {
  it('resolves conventional VO path for registered spine nodes', () => {
    initVoiceLineRegistry();
    expect(getVoiceLine('maria_introduction')).toBeDefined();
    expect(resolveVoiceLineAudioUrl('maria_introduction')).toBe('/audio/vo/maria_introduction.ogg');
  });

  it('returns undefined for unregistered nodes', () => {
    expect(resolveVoiceLineAudioUrl('not_a_real_node_xyz')).toBeUndefined();
  });
});
