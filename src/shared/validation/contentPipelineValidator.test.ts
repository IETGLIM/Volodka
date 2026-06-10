import { describe, expect, it } from 'vitest';
import { validateContentPipeline } from './contentPipelineValidator';

describe('validateContentPipeline', () => {
  it('returns zero errors for the full shipped content graph', () => {
    const report = validateContentPipeline();
    const errors = report.issues.filter((i) => i.severity === 'error');

    if (errors.length > 0) {
      const summary = errors
        .slice(0, 10)
        .map((e) => `${e.category} ${e.path}: ${e.message}`)
        .join('\n');
      expect.fail(`${errors.length} content pipeline error(s):\n${summary}`);
    }

    expect(report.errorCount).toBe(0);
  });
});
