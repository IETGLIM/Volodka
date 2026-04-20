// ============================================
// ECS-LITE — Entity Component System для RPG
// ============================================
// Лёгкая реализация ECS, интегрированная с
// существующим движком и EventBus.
//
// Entity = ID (строка)
// Components = data (POJO)
// Systems = logic (функции/классы с update())
//
// НЕ overengineered — читаемый, совместимый
// с текущей архитектурой.

import { eventBus, type EventMap } from '../engine/EventBus';

// ============================================
// CORE TYPES
// ============================================

/** Entity is just a unique string ID */
export type EntityId = string;

/** Component is a plain data object with a type discriminator */
export interface Component {
  readonly type: string;
}

/** Component constructor type */
export type ComponentClass<T extends Component> = new (...args: never[]) => T;

/** System priority: lower = runs first */
export type SystemPriority = number;

/** System update context — what systems can access */
export interface SystemContext {
  /** Get a component from an entity */
  getComponent: <T extends Component>(entityId: EntityId, type: string) => T | undefined;
  /** Set a component on an entity */
  setComponent: (entityId: EntityId, component: Component) => void;
  /** Remove a component from an entity */
  removeComponent: (entityId: EntityId, type: string) => void;
  /** Check if entity has a component */
  hasComponent: (entityId: EntityId, type: string) => boolean;
  /** Get all entities that have a specific component */
  query: (...componentTypes: string[]) => EntityId[];
  /** Get all entities that have ALL specified components */
  queryAll: (...componentTypes: string[]) => EntityId[];
  /** Emit an event via the event bus (только известные ключи EventMap — без `as never`). */
  emit: <K extends keyof EventMap>(event: K, payload: EventMap[K]) => void;
  /** Delta time since last update (ms) */
  deltaTime: number;
}

/** Base system interface */
export interface ISystem {
  /** Unique system name */
  readonly name: string;
  /** Priority: lower = runs first */
  readonly priority: SystemPriority;
  /** Update the system */
  update(ctx: SystemContext): void;
  /** Initialize the system (called once) */
  init?(ctx: SystemContext): void;
  /** Clean up the system */
  destroy?(): void;
}

// ============================================
// BUILT-IN COMPONENT TYPES
// ============================================

/** Health component */
export interface HealthComponent extends Component {
  readonly type: 'health';
  current: number;
  max: number;
}

/** Position component (2D/3D) */
export interface PositionComponent extends Component {
  readonly type: 'position';
  x: number;
  y: number;
  z: number;
  rotation: number;
}

/** DialogueState component */
export interface DialogueStateComponent extends Component {
  readonly type: 'dialogueState';
  currentNodeId: string | null;
  history: Array<{ nodeId: string; choiceText: string; timestamp: number }>;
  flags: Record<string, boolean>;
}

/** StatsComponent — maps to PlayerState */
export interface StatsComponent extends Component {
  readonly type: 'stats';
  mood: number;
  creativity: number;
  stability: number;
  energy: number;
  karma: number;
  selfEsteem: number;
  stress: number;
  panicMode: boolean;
}

/** NPCRelationComponent — NPC relationship data */
export interface NPCRelationComponent extends Component {
  readonly type: 'npcRelation';
  npcId: string;
  value: number;
  trust: number;
  respect: number;
  intimacy: number;
}

/** InventoryComponent — entity inventory */
export interface InventoryComponent extends Component {
  readonly type: 'inventory';
  items: Array<{ itemId: string; quantity: number }>;
  capacity: number;
}

/** QuestComponent — quest tracking */
export interface QuestComponent extends Component {
  readonly type: 'quest';
  questId: string;
  status: 'locked' | 'available' | 'active' | 'completed' | 'failed';
  objectives: Record<string, number>;
}

/** Tag component — no data, just a label */
export interface TagComponent extends Component {
  readonly type: 'tag';
  tag: string;
}

// ============================================
// ECS WORLD — Container for entities, components, systems
// ============================================

export class ECSWorld {
  private entities = new Set<EntityId>();
  private components = new Map<string, Map<string, Component>>(); // type -> entityId -> component
  private systems: ISystem[] = [];
  private entityCounter = 0;
  private lastUpdateTime = Date.now();

  // ========================================
  // ENTITY MANAGEMENT
  // ========================================

  /** Create a new entity with an optional ID */
  createEntity(customId?: EntityId): EntityId {
    const id = customId ?? `entity_${++this.entityCounter}_${Date.now()}`;
    this.entities.add(id);
    return id;
  }

  /** Remove an entity and all its components */
  destroyEntity(entityId: EntityId): void {
    this.entities.delete(entityId);
    for (const componentMap of this.components.values()) {
      componentMap.delete(entityId);
    }
  }

  /** Check if an entity exists */
  hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  /** Get all entity IDs */
  getAllEntities(): EntityId[] {
    return [...this.entities];
  }

  // ========================================
  // COMPONENT MANAGEMENT
  // ========================================

  /** Add/set a component on an entity */
  setComponent(entityId: EntityId, component: Component): void {
    if (!this.entities.has(entityId)) {
      throw new Error(`[ECS] Entity ${entityId} does not exist`);
    }
    if (!this.components.has(component.type)) {
      this.components.set(component.type, new Map());
    }
    this.components.get(component.type)!.set(entityId, component);
  }

  /** Get a component from an entity */
  getComponent<T extends Component>(entityId: EntityId, type: string): T | undefined {
    return this.components.get(type)?.get(entityId) as T | undefined;
  }

  /** Remove a component from an entity */
  removeComponent(entityId: EntityId, type: string): void {
    this.components.get(type)?.delete(entityId);
  }

  /** Check if entity has a component */
  hasComponent(entityId: EntityId, type: string): boolean {
    return this.components.get(type)?.has(entityId) ?? false;
  }

  /** Get all components of a type */
  getComponentsOfType<T extends Component>(type: string): Map<EntityId, T> {
    return (this.components.get(type) ?? new Map()) as Map<EntityId, T>;
  }

  // ========================================
  // QUERIES
  // ========================================

  /** Find all entities that have ANY of the specified component types */
  query(...componentTypes: string[]): EntityId[] {
    const result = new Set<EntityId>();
    for (const type of componentTypes) {
      const componentMap = this.components.get(type);
      if (componentMap) {
        for (const entityId of componentMap.keys()) {
          result.add(entityId);
        }
      }
    }
    return [...result];
  }

  /** Find all entities that have ALL of the specified component types */
  queryAll(...componentTypes: string[]): EntityId[] {
    if (componentTypes.length === 0) return [];

    // Start with the smallest component set
    const sorted = [...componentTypes].sort((a, b) =>
      (this.components.get(a)?.size ?? 0) - (this.components.get(b)?.size ?? 0)
    );

    const firstMap = this.components.get(sorted[0]);
    if (!firstMap) return [];

    const result: EntityId[] = [];
    for (const entityId of firstMap.keys()) {
      if (sorted.every(type => this.components.get(type)?.has(entityId) ?? false)) {
        result.push(entityId);
      }
    }
    return result;
  }

  // ========================================
  // SYSTEM MANAGEMENT
  // ========================================

  /** Register a system */
  registerSystem(system: ISystem): void {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  /** Remove a system by name */
  removeSystem(name: string): void {
    const idx = this.systems.findIndex(s => s.name === name);
    if (idx >= 0) {
      this.systems[idx].destroy?.();
      this.systems.splice(idx, 1);
    }
  }

  /** Get a system by name */
  getSystem(name: string): ISystem | undefined {
    return this.systems.find(s => s.name === name);
  }

  // ========================================
  // UPDATE LOOP
  // ========================================

  /** Update all systems */
  update(): void {
    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    const ctx: SystemContext = {
      getComponent: <T extends Component>(entityId: EntityId, type: string) =>
        this.getComponent<T>(entityId, type),
      setComponent: (entityId: EntityId, component: Component) =>
        this.setComponent(entityId, component),
      removeComponent: (entityId: EntityId, type: string) =>
        this.removeComponent(entityId, type),
      hasComponent: (entityId: EntityId, type: string) =>
        this.hasComponent(entityId, type),
      query: (...types: string[]) => this.query(...types),
      queryAll: (...types: string[]) => this.queryAll(...types),
      emit: (event, payload) => eventBus.emit(event, payload),
      deltaTime,
    };

    for (const system of this.systems) {
      try {
        system.update(ctx);
      } catch (err) {
        console.error(`[ECS] Error in system "${system.name}":`, err);
      }
    }
  }

  /** Initialize all systems */
  init(): void {
    const ctx: SystemContext = {
      getComponent: <T extends Component>(entityId: EntityId, type: string) =>
        this.getComponent<T>(entityId, type),
      setComponent: (entityId: EntityId, component: Component) =>
        this.setComponent(entityId, component),
      removeComponent: (entityId: EntityId, type: string) =>
        this.removeComponent(entityId, type),
      hasComponent: (entityId: EntityId, type: string) =>
        this.hasComponent(entityId, type),
      query: (...types: string[]) => this.query(...types),
      queryAll: (...types: string[]) => this.queryAll(...types),
      emit: (event, payload) => eventBus.emit(event, payload),
      deltaTime: 0,
    };

    for (const system of this.systems) {
      system.init?.(ctx);
    }
  }

  // ========================================
  // UTILITY
  // ========================================

  /** Get total entity count */
  get entityCount(): number {
    return this.entities.size;
  }

  /** Get system count */
  get systemCount(): number {
    return this.systems.length;
  }

  /** Get world statistics */
  getStats(): { entities: number; systems: number; componentTypes: string[] } {
    return {
      entities: this.entities.size,
      systems: this.systems.length,
      componentTypes: [...this.components.keys()],
    };
  }

  /** Clear the entire world */
  clear(): void {
    for (const system of this.systems) {
      system.destroy?.();
    }
    this.entities.clear();
    this.components.clear();
    this.systems = [];
  }
}

// ============================================
// DEFAULT WORLD INSTANCE
// ============================================

export const world = new ECSWorld();
