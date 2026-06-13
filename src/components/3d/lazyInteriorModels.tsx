/**
 * Lazy-loaded interior props — defers scene-shared-interior chunk until first prop renders.
 * InteriorModels stays in the shared Vite chunk (scene-shared-interior).
 */

import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export type InteriorModule = typeof import('./InteriorModels');

let interiorModulePromise: Promise<InteriorModule> | null = null;
let loadedInteriorModule: InteriorModule | null = null;

function loadInteriorModule(): Promise<InteriorModule> {
  if (!interiorModulePromise) {
    interiorModulePromise = import('./InteriorModels');
  }
  return interiorModulePromise;
}

function resetInteriorModuleCache(): void {
  interiorModulePromise = null;
  loadedInteriorModule = null;
}

if (import.meta.hot) {
  import.meta.hot.dispose(resetInteriorModuleCache);
  import.meta.hot.accept('./InteriorModels', resetInteriorModuleCache);
}

const LazyInteriorModuleGate = lazy(() =>
  loadInteriorModule().then((mod) => {
    loadedInteriorModule = mod;
    return {
      default: function InteriorModuleGate({ children }: { children: React.ReactNode }) {
        return <>{children}</>;
      },
    };
  }),
);

type InteriorComponentKey = {
  [K in keyof InteriorModule]: InteriorModule[K] extends ComponentType<any> ? K : never;
}[keyof InteriorModule];

/** Keeps a valid R3F object mounted while the interior chunk streams in (avoids null fallback flash). */
function InteriorLoadPlaceholder() {
  return (
    <mesh visible={false}>
      <boxGeometry args={[0.001, 0.001, 0.001]} />
      <meshBasicMaterial />
    </mesh>
  );
}

/** Renders one interior export after LazyInteriorModuleGate resolves — avoids eager renderLoaded during suspend. */
function DeferredInteriorRenderer({
  exportName,
  interiorProps,
}: {
  exportName: InteriorComponentKey;
  interiorProps: Record<string, unknown>;
}) {
  if (!loadedInteriorModule) {
    return <InteriorLoadPlaceholder />;
  }
  const Component = loadedInteriorModule[exportName] as ComponentType<any>;
  return <Component {...interiorProps} />;
}

function createInteriorComponent<K extends InteriorComponentKey>(exportName: K) {
  type Props = ComponentProps<InteriorModule[K]>;

  function renderLoaded(props: Props) {
    if (!loadedInteriorModule) {
      return <InteriorLoadPlaceholder />;
    }
    const Component = loadedInteriorModule[exportName] as ComponentType<any>;
    return <Component {...props} />;
  }

  function InteriorProp(props: Props) {
    const deferredProps = props as Record<string, unknown>;
    const content = loadedInteriorModule
      ? renderLoaded(props)
      : (
        <Suspense fallback={<InteriorLoadPlaceholder />}>
          <LazyInteriorModuleGate>
            <DeferredInteriorRenderer exportName={exportName} interiorProps={deferredProps} />
          </LazyInteriorModuleGate>
        </Suspense>
      );

    return (
      <ErrorBoundary name={`interior:${String(exportName)}`} fallback={null}>
        {content}
      </ErrorBoundary>
    );
  }

  return InteriorProp;
}

export const Desk = createInteriorComponent('Desk');
export const Chair = createInteriorComponent('Chair');
export const Bookshelf = createInteriorComponent('Bookshelf');
export const Bed = createInteriorComponent('Bed');
export const Couch = createInteriorComponent('Couch');
export const Table = createInteriorComponent('Table');
export const Wardrobe = createInteriorComponent('Wardrobe');
export const KitchenCounter = createInteriorComponent('KitchenCounter');
export const Monitor = createInteriorComponent('Monitor');
export const Laptop = createInteriorComponent('Laptop');
export const TV = createInteriorComponent('TV');
export const Phone = createInteriorComponent('Phone');
export const Lamp = createInteriorComponent('Lamp');
export const FloorLamp = createInteriorComponent('FloorLamp');
export const Plant = createInteriorComponent('Plant');
export const Rug = createInteriorComponent('Rug');
export const Picture = createInteriorComponent('Picture');
export const Clock = createInteriorComponent('Clock');
export const Window = createInteriorComponent('Window');
export const Door = createInteriorComponent('Door');
export const Radiator = createInteriorComponent('Radiator');
export const CoffeeMachine = createInteriorComponent('CoffeeMachine');
export const PastryCase = createInteriorComponent('PastryCase');
export const CafeTable = createInteriorComponent('CafeTable');
export const Stove = createInteriorComponent('Stove');
export const Fridge = createInteriorComponent('Fridge');
export const Sink = createInteriorComponent('Sink');
