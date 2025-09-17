export * from './types';

// Components
export { Bounds, type AABB, createAABB } from './components/Bounds';
export { Transform, type TRS, createTRS } from './components/Transform';
export { Visibility } from './components/Visibility';
export { State } from './components/State';
export { StableId } from './components/StableId';

// Services
export { CullingCamera } from './services/CullingCamera';
export { StatsService } from './services/Stats';

// Systems
export { CullingSystem } from './systems/Culling';

// Core API
export { System } from './System';
export { Service } from './Service';
export { Component } from './Component';
export { Node } from './node';
export { World, type WorldOptions } from './world';
export { TypedEvent, EventBus, type Listener } from './event';
export {
    getComponent,
    setComponent,
    attachComponent,
} from './componentRegistry';
export {
    ancestors,
    descendants,
    traversePreOrder,
    traversePostOrder,
    siblings,
} from './world/traversal';

// FC API
export type { FC } from './fc/runtime';
export { mountFC as mount, __fcCurrent } from './fc/runtime';
export {
    useWorld,
    useNode,
    useInit,
    useDestroy,
    useComponent,
    useFixedEarly,
    useFixedUpdate,
    useFixedLate,
    useFrameEarly,
    useFrameUpdate,
    useFrameLate,
    useChild,
    useState,
    useStableId,
    useService,
} from './fc/hooks';

// Math
export { Vec3 } from './math/vec3';
export { Quat } from './math/quat';
