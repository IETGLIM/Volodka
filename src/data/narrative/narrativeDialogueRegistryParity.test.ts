import { describe, it, expect, beforeEach } from 'vitest';
import { DIALOGUE_NODES } from '@/data/dialogue';
import {
  loadAllNarrativePacks,
  getDialogueNodesCache,
  ensureDialogueNode,
  resetNarrativePackRegistryForTests,
} from './narrativePackRegistry';

/**
 * CI guard (аудит, этап 96): рантайм-лениво-грузящийся диалоговый реестр
 * (narrativePackRegistry) должен быть ЭКВИВАЛЕНТЕН статическому слиянию
 * DIALOGUE_NODES (dialogue/index.ts) — не только по множеству id, но и по
 * СОДЕРЖИМОМУ каждого узла. Порядок слияния паков определяет победителя при
 * коллизиях ключей (поздний пак выигрывает): deep-equal проверка ловит
 * расхождение порядка даже там, где сегодня коллизий нет (история v4.8.9:
 * 220 узлов не попадали в рантайм-кэш; ws-фиксы добавляли паки то в статику,
 * то в рантайм). Паритет для story покрывает narrativeRegistryParity.test.ts —
 * этот тест закрывает вторую половину.
 */
describe('narrative dialogue registry parity (static vs runtime)', () => {
  beforeEach(() => {
    resetNarrativePackRegistryForTests();
  });

  it('loadAllNarrativePacks включает каждый статический DIALOGUE_NODES id', async () => {
    await loadAllNarrativePacks();

    const runtimeIds = new Set(Object.keys(getDialogueNodesCache()));
    const missing = Object.keys(DIALOGUE_NODES).filter((id) => !runtimeIds.has(id));

    expect(missing, `runtime registry missing ${missing.length} static node(s)`).toEqual([]);
  });

  it('runtime-кэш не содержит узлов вне статического слияния (лишние паки)', async () => {
    await loadAllNarrativePacks();

    const staticIds = new Set(Object.keys(DIALOGUE_NODES));
    const extra = Object.keys(getDialogueNodesCache()).filter((id) => !staticIds.has(id));

    expect(extra, `runtime registry has ${extra.length} node(s) not in static merge`).toEqual([]);
  });

  it('каждый узел deep-equal: порядок слияния паков статика ≡ рантайм', async () => {
    await loadAllNarrativePacks();

    const runtime = getDialogueNodesCache();
    const mismatches: string[] = [];
    for (const [id, staticNode] of Object.entries(DIALOGUE_NODES)) {
      const runtimeNode = runtime[id];
      if (!runtimeNode) {
        mismatches.push(`${id}: нет в рантайме`);
        continue;
      }
      if (runtimeNode !== staticNode && JSON.stringify(runtimeNode) !== JSON.stringify(staticNode)) {
        mismatches.push(`${id}: содержимое расходится (порядок паков?)`);
      }
    }

    expect(mismatches, mismatches.slice(0, 10).join('; ')).toEqual([]);
  });

  it('диалоговый пак Виктории резолвится через ensureDialogueNode (этап 95)', async () => {
    await ensureDialogueNode('victoria_greeting');
    const cache = getDialogueNodesCache();
    expect(cache.victoria_greeting).toBeDefined();
    expect(cache.victoria_greeting.speakerId).toBe('victoria');
    expect(cache.victoria_return).toBeDefined();
    // npc:talked с хранительницей ключей резолвится в живой диалог, не в bark.
    await ensureDialogueNode('victoria_return');
    expect(cache.victoria_keys_question).toBeDefined();
  });
});
