import { describe, it, expect } from 'vitest';
import { applyRapierInitFix } from './rapierInitFix';

describe('rapierInitFix', () => {
  it('patches minified pattern to object form', () => {
    // Simulate minified wasm-bindgen output
    const fakeBase64 = 'A'.repeat(150_000); // > MIN_BASE64_LEN
    const input = `function x(){yield initSomething(foo.toByteArray("${fakeBase64}").buffer)}))}`;
    const output = applyRapierInitFix(input);
    expect(output).toContain('{module_or_path:foo.toByteArray("');
    expect(output).not.toBe(input);
  });

  it('patches formatted close pattern', () => {
    const fakeBase64 = 'B'.repeat(150_000);
    const input = `yield initFn(bar.toByteArray("${fakeBase64}").buffer);`;
    const output = applyRapierInitFix(input);
    expect(output).toContain('{module_or_path:bar.toByteArray("');
    expect(output).toContain('").buffer});');
  });

  it('does not double-patch already patched code', () => {
    const fakeBase64 = 'C'.repeat(150_000);
    const once = applyRapierInitFix(`yield a(b.toByteArray("${fakeBase64}").buffer);`);
    const twice = applyRapierInitFix(once);
    expect(twice).toBe(once);
    expect(twice).toContain('{module_or_path:');
  });

  it('returns original if base64 too short (suspicious)', () => {
    const short = 'ABCD';
    const input = `yield a(b.toByteArray("${short}").buffer);`;
    const output = applyRapierInitFix(input);
    expect(output).toBe(input); // should abort patch due to MIN length
  });

  it('returns original if pattern not found', () => {
    const input = `console.log("no rapier here")`;
    const output = applyRapierInitFix(input);
    expect(output).toBe(input);
  });

  it('handles large scan limit gracefully', () => {
    // Very long base64 that would exceed MAX should return original
    const huge = 'D'.repeat(3_000_001);
    const input = `yield a(b.toByteArray("${huge}").buffer);`;
    const output = applyRapierInitFix(input);
    // Should return original due to scan limit exceeded
    expect(output).toBe(input);
  });
});
