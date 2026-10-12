/* ─── NaN/Inf scrub effect — детерминированная зачистка poisoned-кадра ───
 *
 * Контекст (расследование v4.48.7, приоритет №4 очереди судей):
 * N8AO на SwiftShader выдавал NaN на выходе пасса, который затем
 * распространялся через весь композер (NaN × 0 = NaN в любой арифметике
 * ниже по цепочке) → чёрный экран на ultra (v4.45.2, отключение пасса).
 *
 * Этот Effect ставится В ДЕТЕЙ КОМПОЗЕРА сразу после N8AO. Все обычные
 * Effect-дети сливаются @react-three/postprocessing в ОДИН EffectPass,
 * поэтому скраб исполняется в составе следующей за N8AO группы эффектов —
 * фактическая цена ~несколько ALU-операций на пиксель, отдельный
 * фуллскрин-проход не добавляется.
 *
 * Механика скраба (без WebGL2-специфичного isnan() — работает и на
 * GLSL ES 1.00-подобных трансляциях):
 *   NaN не равен ничему, включая себя → `c != c` надёжно его ловит;
 *   Inf зажимается до HALF_MAX (буферы композера — half float).
 *
 * Скраб монтируется вместе с N8AO (см. shouldMountN8ao) и остаётся
 * включённым даже при pass.enabled=false у N8AO — цена нулевая,
 * защита глобальная на весь full-пайплайн.
 */

import { Effect, BlendFunction } from 'postprocessing';
import { Uniform } from 'three';

export const NAN_SCRUB_EFFECT_NAME = 'VolodkaNanScrubEffect';

/**
 * Порядок каналов не важен — каждый проверяется независимо.
 * Альфа-канал не трогаем: композер-пайплайн держит альфу валидной,
 * а NaN в RGB — реальный вектор отравления кадра.
 */
export const NAN_SCRUB_FRAGMENT_SHADER = /* glsl */ `
uniform float uScrubEnabled;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    if (uScrubEnabled < 0.5) {
        outputColor = inputColor;
        return;
    }

    vec3 c = inputColor.rgb;

    // NaN: сравнение с самим собой проваливается — единственный надёжный
    // тест, доступный без GLSL ES 3.0 isnan().
    if (c.r != c.r) c.r = 0.0;
    if (c.g != c.g) c.g = 0.0;
    if (c.b != c.b) c.b = 0.0;

    // Inf → HALF_MAX (half-float буферы EffectComposer), NaN после
    // зажима невозможен (min(NaN, x) вернул бы NaN, поэтому проверка выше).
    c = min(c, vec3(65504.0));

    outputColor = vec4(c, inputColor.a);
}
`;

export class NanScrubEffect extends Effect {
  constructor({ blendFunction = BlendFunction.NORMAL }: { blendFunction?: BlendFunction } = {}) {
    super(NAN_SCRUB_EFFECT_NAME, NAN_SCRUB_FRAGMENT_SHADER, {
      blendFunction,
      uniforms: new Map<string, Uniform>([
        ['uScrubEnabled', new Uniform(1)],
      ]),
    });
  }

  /** Runtime toggle — остаётся включённым по умолчанию; API для тика/тестов. */
  setEnabled(value: boolean): void {
    const uniform = this.uniforms.get('uScrubEnabled');
    if (uniform) uniform.value = value ? 1 : 0;
  }

  isScrubEnabled(): boolean {
    const uniform = this.uniforms.get('uScrubEnabled');
    return uniform ? uniform.value >= 0.5 : false;
  }
}
