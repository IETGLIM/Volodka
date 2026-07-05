import { describe, expect, it } from 'vitest';
import { sanitizePlainText } from './sanitizePlainText';

describe('sanitizePlainText', () => {
  it('strips HTML tags from narrative strings', () => {
    expect(sanitizePlainText('Hello <b>world</b>')).toBe('Hello world');
    expect(sanitizePlainText('<script>alert(1)</script>Текст')).toBe('alert(1)Текст');
  });

  it('leaves plain text unchanged', () => {
    expect(sanitizePlainText('Комната небольшая, но уютная.')).toBe(
      'Комната небольшая, но уютная.',
    );
  });
});
