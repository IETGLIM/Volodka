import fs from 'fs';
import path from 'path';

const root = process.cwd();

function patch(file, replacers) {
  const full = path.join(root, file);
  let text = fs.readFileSync(full, 'utf8');
  for (const [from, to] of replacers) {
    if (!text.includes(from)) {
      throw new Error(`Patch miss in ${file}: ${from.slice(0, 60)}...`);
    }
    text = text.replace(from, to);
  }
  fs.writeFileSync(full, text);
  console.log('patched', file);
}

fs.writeFileSync(path.join(root, 'src/engine/events/emptyPayload.ts'), `/** Shared empty payload for events with no fields. */
export type EmptyEventPayload = Record<string, never>;

/** Runtime empty payload — use instead of \`{} as Record<string, never>\`. */
export const EMPTY_EVENT_PAYLOAD: EmptyEventPayload = {};
`);

fs.writeFileSync(path.join(root, 'scripts/check-event-map.mjs'), `import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, files);
    else if (/\\.(tsx?)$/.test(e.name)) files.push(p);
  }
  return files;
}

const used = new Set();
const usageRe = /eventBus\\.(?:emit|on|off)\\(\\s*['"]([^'"]+)['"]/g;
for (const file of walk('src')) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = usageRe.exec(text))) used.add(m[1]);
}

const defined = new Set();
const keyRe = /['"]([^'"]+)['"]\\s*:/g;
for (const f of fs.readdirSync('src/engine/events').filter((x) => x.endsWith('Events.ts'))) {
  const text = fs.readFileSync(path.join('src/engine/events', f), 'utf8');
  let m;
  while ((m = keyRe.exec(text))) defined.add(m[1]);
}

const missing = [...used].filter((e) => !defined.has(e)).sort();
console.log(\`Used: \${used.size}, Defined: \${defined.size}\`);
console.log('Used but NOT defined:', missing.length ? missing : '(none)');
if (missing.length > 0) process.exit(1);
`);

fs.writeFileSync(path.join(root, 'src/engine/events/EventMap.types.test.ts'), `import { describe, expectTypeOf, it } from 'vitest';
import type { EventMap, EventName } from '@/engine/events';
import { createEventBus, type EventBusClass } from '@/engine/EventBus';

describe('EventMap compile-time contracts', () => {
  it('createEventBus defaults to EventMap', () => {
    const bus = createEventBus();
    expectTypeOf(bus).toEqualTypeOf<EventBusClass<EventMap>>();
  });

  it('emit/on keys are EventName', () => {
    const bus = createEventBus<EventMap>();
    expectTypeOf(bus.emit).parameter(0).toEqualTypeOf<EventName>();
    expectTypeOf(bus.on).parameter(0).toEqualTypeOf<EventName>();
    expectTypeOf(bus.off).parameter(0).toEqualTypeOf<EventName>();
  });

  it('payload types flow from EventMap', () => {
    expectTypeOf<EventMap['camera:recenter']>().toEqualTypeOf<Record<string, never>>();
    expectTypeOf<EventMap['combat:turn']>().toMatchTypeOf<{ turn: number; isPlayerTurn: boolean }>();
  });

  it('handlers receive inferred payload types', () => {
    const bus = createEventBus<EventMap>();
    bus.on('weather:snow', (payload) => {
      expectTypeOf(payload).toEqualTypeOf<EventMap['weather:snow']>();
    });
  });
});
`);

patch('src/engine/EventBus.ts', [
  [`export type { EventBusScopeHost } from '@/engine/eventBusScope';

type EventHandler`, `export type { EventBusScopeHost } from '@/engine/eventBusScope';
export type { EventMap, EventName, EmptyEventPayload } from '@/engine/events';
export { EMPTY_EVENT_PAYLOAD } from '@/engine/events';

type EventHandler`],
  [`/** Events that should never be deduped — each emission must fire */
const DEDUP_EXEMPT = new Set([
  'combat:hit',
  'combat:damage',
  'combat:heal',
  'combat:turn',
  'combat:action',
  'combat:victory',
  'combat:defeat',
  'scene:enter',
  'object:interact',
  'npc:interact_staged',
  'interaction:end',
]);`, `/** Events that should never be deduped — each emission must fire. */
const DEDUP_EXEMPT_EVENTS = [
  'combat:hit',
  'combat:damage',
  'combat:heal',
  'combat:turn',
  'combat:action',
  'combat:victory',
  'combat:defeat',
  'scene:enter',
  'object:interact',
  'npc:interact_staged',
  'interaction:end',
] as const satisfies readonly (keyof EventMap)[];

const DEDUP_EXEMPT = new Set<string>(DEDUP_EXEMPT_EVENTS);`],
  [`export class EventBusClass implements EventBusScopeHost {
  private handlers = new Map<keyof EventMap, PrioritizedListener[]>();`, `export class EventBusClass<TMap extends Record<string, unknown> = EventMap>
  implements EventBusScopeHost<TMap>
{
  private handlers = new Map<keyof TMap, PrioritizedListener[]>();`],
  [`  createScope(): EventBusScope {
    return new EventBusScope(this);
  }`, `  createScope(): EventBusScope<TMap> {
    return new EventBusScope(this);
  }`],
  [`  on<K extends keyof EventMap>(
    event: K,
    handler: EventHandler<EventMap[K]>`, `  on<K extends keyof TMap>(
    event: K,
    handler: EventHandler<TMap[K]>`],
  [`  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {`, `  emit<K extends keyof TMap>(event: K, payload: TMap[K]): void {`],
  [`          (handler as EventHandler<EventMap[K]>)(payload);`, `          (handler as EventHandler<TMap[K]>)(payload);`],
  [`  off<K extends keyof EventMap>(
    event: K,
    handler: EventHandler<EventMap[K]>`, `  off<K extends keyof TMap>(
    event: K,
    handler: EventHandler<TMap[K]>`],
  [`export function createEventBus(): EventBusClass {
  return new EventBusClass();
}

/** Singleton event bus instance */
export const eventBus = new EventBusClass();`, `export function createEventBus<TMap extends Record<string, unknown> = EventMap>(): EventBusClass<TMap> {
  return new EventBusClass<TMap>();
}

/** Singleton event bus instance — typed with the consolidated EventMap. */
export const eventBus = createEventBus<EventMap>();`],
]);

fs.writeFileSync(path.join(root, 'src/engine/eventBusScope.ts'), fs.readFileSync(path.join(root, 'src/engine/eventBusScope.ts'), 'utf8')
  .replace(
    'export interface EventBusScopeHost {',
    'export interface EventBusScopeHost<TMap extends Record<string, unknown> = EventMap> {',
  )
  .replace(
    '  on<K extends keyof EventMap>(\n    event: K,\n    handler: EventHandler<EventMap[K]>,',
    '  on<K extends keyof TMap>(\n    event: K,\n    handler: EventHandler<TMap[K]>,',
  )
  .replace('export class EventBusScope {', 'export class EventBusScope<TMap extends Record<string, unknown> = EventMap> {')
  .replace(
    '  constructor(private readonly bus: EventBusScopeHost) {}',
    '  constructor(private readonly bus: EventBusScopeHost<TMap>) {}',
  )
  .replace(
    '  on<K extends keyof EventMap>(\n    event: K,\n    handler: EventHandler<EventMap[K]>,',
    '  on<K extends keyof TMap>(\n    event: K,\n    handler: EventHandler<TMap[K]>,',
  )
  .replace(
    'export function bindEventBusScope(\n  bus: EventBusScopeHost,\n  register: (scope: EventBusScope) => void,',
    'export function bindEventBusScope<TMap extends Record<string, unknown> = EventMap>(\n  bus: EventBusScopeHost<TMap>,\n  register: (scope: EventBusScope<TMap>) => void,',
  ));
console.log('patched eventBusScope.ts');

patch('src/engine/events/index.ts', [
  [`export { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from './photoEvents';

/** Flat typed event map`, `export { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from './photoEvents';
export type { EmptyEventPayload } from './emptyPayload';
export { EMPTY_EVENT_PAYLOAD } from './emptyPayload';

/** Flat typed event map`],
  [`  StoryEvents;

/** Registry of domain prefixes`, `  StoryEvents;

/** All registered event names on the singleton bus. */
export type EventName = keyof EventMap;

/** Registry of domain prefixes`],
]);

patch('src/engine/events/photoEvents.ts', [
  [`/**
 * Photo mode screenshot feature`, `import { EMPTY_EVENT_PAYLOAD } from './emptyPayload';

/**
 * Photo mode screenshot feature`],
  [`export const PHOTO_EMPTY_PAYLOAD = {} as Record<string, never>;`, `export const PHOTO_EMPTY_PAYLOAD = EMPTY_EVENT_PAYLOAD;`],
]);

patch('src/store/slices/saveSlice.ts', [
  [`import { eventBus } from '@/engine/EventBus';`, `import { eventBus, EMPTY_EVENT_PAYLOAD } from '@/engine/EventBus';`],
  [`eventBus.emit('game:loaded', {} as Record<string, never>);`, `eventBus.emit('game:loaded', EMPTY_EVENT_PAYLOAD);`],
]);

for (const file of [
  'src/components/game/PlayerStatsPanel.tsx',
  'src/components/game/StatusEffectsBar.tsx',
  'src/components/game/hud/useHUDController.ts',
  'src/components/game/PoemPowerEffect.tsx',
]) {
  patch(file, [
    [`(payload: { active: boolean })`, `(payload)`],
    [`(payload: { poemId: string; powerName: string })`, `(payload)`],
  ]);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
pkg.scripts['events:check'] = 'node scripts/check-event-map.mjs';
fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
console.log('done');
