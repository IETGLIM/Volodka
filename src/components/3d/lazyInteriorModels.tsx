/**
 * Lazy-loaded interior props — defers scene-shared-interior chunk until first prop renders.
 * InteriorModels stays in the shared Vite chunk (scene-shared-interior).
 */

import { lazy, Suspense, type ComponentType } from 'react';

type InteriorModule = typeof import('./InteriorModels');

let interiorModulePromise: Promise<InteriorModule> | null = null;

function loadInteriorModule(): Promise<InteriorModule> {
  if (!interiorModulePromise) {
    interiorModulePromise = import('./InteriorModels');
  }
  return interiorModulePromise;
}

function lazyInterior<K extends keyof InteriorModule>(exportName: K) {
  type Props = Parameters<Extract<InteriorModule[K], (props: object) => unknown>>[0];

  const LazyComponent = lazy(() =>
    loadInteriorModule().then((mod) => ({
      default: mod[exportName] as ComponentType<Props>,
    })),
  );

  return function LazyInteriorProp(props: Props) {
    return (
      <Suspense fallback={null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export const Desk = lazyInterior('Desk');
export const Chair = lazyInterior('Chair');
export const Bookshelf = lazyInterior('Bookshelf');
export const Bed = lazyInterior('Bed');
export const Couch = lazyInterior('Couch');
export const Table = lazyInterior('Table');
export const Wardrobe = lazyInterior('Wardrobe');
export const KitchenCounter = lazyInterior('KitchenCounter');
export const Monitor = lazyInterior('Monitor');
export const Laptop = lazyInterior('Laptop');
export const TV = lazyInterior('TV');
export const Phone = lazyInterior('Phone');
export const Lamp = lazyInterior('Lamp');
export const FloorLamp = lazyInterior('FloorLamp');
export const Plant = lazyInterior('Plant');
export const Rug = lazyInterior('Rug');
export const Picture = lazyInterior('Picture');
export const Clock = lazyInterior('Clock');
export const Window = lazyInterior('Window');
export const Door = lazyInterior('Door');
export const Radiator = lazyInterior('Radiator');
export const CoffeeMachine = lazyInterior('CoffeeMachine');
export const PastryCase = lazyInterior('PastryCase');
export const CafeTable = lazyInterior('CafeTable');
export const Stove = lazyInterior('Stove');
export const Fridge = lazyInterior('Fridge');
export const Sink = lazyInterior('Sink');
