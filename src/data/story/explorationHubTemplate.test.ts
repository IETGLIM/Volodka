import { describe, expect, it } from 'vitest';
import { buildExplorationHubNode } from './explorationHubTemplate';

describe('buildExplorationHubNode', () => {
  it('chains free-roam passes with missingFlag', () => {
    const node = buildExplorationHubNode({
      id: 'test_hub',
      sceneId: 'volodka_room',
      text: 'hub',
      choices: [{ text: 'Leave', next: 'start' }],
      freeRoamPasses: [
        { flag: 'hub_pass_1' },
        { flag: 'hub_pass_2' },
      ],
    });

    const roam = node.choices.filter((c) => c.next === 'test_hub');
    expect(roam).toHaveLength(2);
    expect(roam[0]?.condition).toEqual({ missingFlag: 'hub_pass_1' });
    expect(roam[1]?.condition).toEqual({ flag: 'hub_pass_1', missingFlag: 'hub_pass_2' });
  });
});
