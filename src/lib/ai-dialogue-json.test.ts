import { describe, expect, it } from 'vitest';
import { parseDialogueFromModelRaw, stripMarkdownFromModelJson } from './ai-dialogue-json';

describe('ai-dialogue-json', () => {
  it('strips markdown fences', () => {
    const inner = '{"npcResponse":"Привет","playerChoices":[{"text":"Ок","mood":"нейтрально"}],"relationshipHint":"ok"}';
    expect(stripMarkdownFromModelJson(`\`\`\`json\n${inner}\n\`\`\``)).toBe(inner);
  });

  it('repairs trailing comma and parses', () => {
    const raw = `{"npcResponse":"Да", "playerChoices":[{"text":"Хм","mood":"тихо",},],}`;
    const r = parseDialogueFromModelRaw(raw);
    expect(r.npcResponse).toBe('Да');
    expect(r.playerChoices.length).toBeGreaterThanOrEqual(1);
  });
});
