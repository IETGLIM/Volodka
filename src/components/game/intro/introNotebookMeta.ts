/* ─── Volodka RPG – Метка листа ночной тетради (v4.48.4) ───
 * Чистая утилита без React — легко тестируется. Римские цифры для
 * шапки разворота («лист II» — порядок стиха в собрании).
 */

const ROMAN_TABLE: ReadonlyArray<readonly [number, string]> = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function toRoman(n: number): string {
  let rest = Math.max(1, Math.floor(n));
  let out = '';
  for (const [value, glyph] of ROMAN_TABLE) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out || 'I';
}
