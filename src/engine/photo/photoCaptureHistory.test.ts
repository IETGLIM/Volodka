import { describe, expect, it } from 'vitest';
import {
  PHOTO_CAPTURE_HISTORY_MAX,
  pushPhotoCaptureHistory,
  selectPhotoCaptureFromHistory,
} from './photoCaptureHistory';

describe('photoCaptureHistory', () => {
  it('prepends newest and caps length', () => {
    let hist = pushPhotoCaptureHistory([], {
      dataUrl: 'data:image/png;base64,a',
      timestamp: 1,
      filter: 'cyberpunk_neon',
      sceneName: 'Street',
    });
    hist = pushPhotoCaptureHistory(hist, {
      dataUrl: 'data:image/png;base64,b',
      timestamp: 2,
      filter: 'noir',
      sceneName: 'Pier',
    });
    expect(hist[0].sceneName).toBe('Pier');
    expect(hist).toHaveLength(2);

    for (let i = 0; i < PHOTO_CAPTURE_HISTORY_MAX + 2; i++) {
      hist = pushPhotoCaptureHistory(hist, {
        dataUrl: `data:image/png;base64,${i}`,
        timestamp: 10 + i,
        filter: 'cyberpunk_neon',
        sceneName: `S${i}`,
      });
    }
    expect(hist).toHaveLength(PHOTO_CAPTURE_HISTORY_MAX);
    expect(hist[0].sceneName).toBe(`S${PHOTO_CAPTURE_HISTORY_MAX + 1}`);
  });

  it('selects entry by id', () => {
    const hist = pushPhotoCaptureHistory([], {
      dataUrl: 'data:image/png;base64,x',
      timestamp: 99,
      filter: 'noir',
      sceneName: 'Roof',
    });
    expect(selectPhotoCaptureFromHistory(hist, hist[0].id)?.sceneName).toBe('Roof');
    expect(selectPhotoCaptureFromHistory(hist, 'missing')).toBeNull();
  });
});
