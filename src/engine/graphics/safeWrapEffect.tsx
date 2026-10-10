/* ─── safeWrapEffect — защита от «Converting circular structure to JSON» ───
 *
 * ДИАГНОЗ (краш v4.45.1 в проде):
 *   Uncaught TypeError: Converting circular structure to JSON
 *     at JSON.stringify — внутри wrapEffect() фабрики
 *     @react-three/postprocessing@3.0.4 (postfx-чанк, строка с депсами useMemo).
 *
 * Причина: React 19 передаёт `ref` функциональному компоненту как обычный
 * пропс. wrapEffect 3.0.4 деструктурирует только blendFunction/opacity —
 * `ref` (объект {current: Effect}) попадает в rest-props `s` и в депсы
 * `[JSON.stringify(s)]` useMemo. После монтирования R3F вешает на эффект
 * `__r3f`-состояние ({children: [...], parent: ...} — циклические простые
 * объекты) → ЛЮБОЙ повторный рендер враппера = TypeError, который срывает
 * React-рендер канваса (чёрный экран, ErrorBoundary-цикл).
 *
 * Лекарство (как в @react-three/postprocessing ≥3.1, но без апгрейда:
 * их EffectComposer в 3.1.x переписан и в нашей связке рендерил чёрный кадр):
 *   1. forwardRef-обёртка — ref НЕ попадает в props вообще;
 *   2. депсы useMemo — stableStringify (циклы → '[Circular]',
 *      функции → '[Function]') вместо сырого JSON.stringify.
 *
 * Паритет с 3.0.4: те же defaults, тот же R3F-элемент
 * ({camera, blendMode-*, ...props, args}), тот же extend-реестр (WeakMap +
 * счётчик в имени — переживает минификацию имён классов).
 */
import { createElement, forwardRef, useMemo, type ComponentType, type Ref } from 'react';
import { extend, useThree } from '@react-three/fiber';
import type { BlendFunction, Effect } from 'postprocessing';

export interface SafeEffectCommonProps {
  /** Переопределяет дефолт обёртки; в эффект уходит как blendMode-blendFunction. */
  blendFunction?: BlendFunction;
  /** Начальное blendMode.opacity. */
  opacity?: number;
  /** Прямые args конструктора (как в wrapEffect); перекрывает сборку из опций. */
  args?: unknown[];
  ref?: Ref<unknown>;
}

/** Цикло- и функция-безопасная сериализация для депсов useMemo. */
function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const replacer = (_k: string, v: unknown) => {
    if (typeof v === 'function') return '[Function]';
    if (typeof v === 'bigint') return v.toString();
    if (typeof v === 'object' && v !== null) {
      if (v instanceof Map || v instanceof Set) return '[Collection]';
      if (seen.has(v)) return '[Circular]';
      seen.add(v);
    }
    return v;
  };
  try {
    return JSON.stringify(value, replacer);
  } catch {
    // Например, toJSON, кидающий исключение — ключ деградирует, но рендер жив.
    return '[Unserializable]';
  }
}

const registered = new WeakMap<object, string>();
let registrationSeq = 0;

/**
 * Поведенчески точная замена wrapEffect из @react-three/postprocessing@3.0.4
 * для эффектов с опциями-конструктором. Отличия: `ref` не попадает в props
 * (forwardRef) и депсы useMemo сериализуются цикло-безопасно.
 *
 * @example
 *   const Bloom = safeWrapEffect(BloomEffect, { blendFunction: BlendFunction.ADD });
 *   ...
 *   <Bloom ref={bloomRef} intensity={0.5} mipmapBlur />
 */
export function safeWrapEffect<TCtor extends new (...args: never[]) => Effect>(
  effectClass: TCtor,
  defaults?: Partial<ConstructorParameters<TCtor>[0]> & { blendFunction?: BlendFunction; opacity?: number; args?: unknown[] },
): ComponentType<Partial<ConstructorParameters<TCtor>[0]> & SafeEffectCommonProps> {
  const componentName = effectClass.name || 'Effect';
  return forwardRef<Effect, Partial<ConstructorParameters<TCtor>[0]> & SafeEffectCommonProps>(
    function SafeWrappedEffect(
      { blendFunction = defaults?.blendFunction, opacity = defaults?.opacity, ...props },
      ref,
    ) {
      let extendedName = registered.get(effectClass);
      if (!extendedName) {
        // R3F (createInstance→validateInstance) ищет в каталоге toPascalCase(type):
        // имя должно начинаться с символа, не изменяемого капитализацией
        // (как '@react-three/...' у самой библиотеки) — иначе элемент не резолвится.
        extendedName = `@volodka/${componentName}-${registrationSeq++}`;
        extend({ [extendedName]: effectClass });
        registered.set(effectClass, extendedName);
      }
      const camera = useThree((state) => state.camera);
      const args = useMemo(
        () => [...(defaults?.args ?? []), ...(props.args ?? [{ ...(defaults as object) ?? {}, ...props }])],
        // ВАЖНО: props НЕ содержит ref (forwardRef) и сериализуется безопасно.
        [stableStringify(props)],
      );
      return createElement(extendedName, {
        camera,
        'blendMode-blendFunction': blendFunction,
        'blendMode-opacity-value': opacity,
        ...props,
        args,
        ref,
      } as Record<string, unknown>);
    },
  ) as unknown as ComponentType<Partial<ConstructorParameters<TCtor>[0]> & SafeEffectCommonProps>;
}
