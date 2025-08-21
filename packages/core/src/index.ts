// Public API surface

// Core
export { World } from './core/world';
export { Node } from './core/node';
export { Group } from './core/group';
export { Signal } from './core/signals';

// Capabilities & decorators
export {
    UpdatePhase,
    type UpdateKind,
    tickEarly,
    tickUpdate,
    tickLate,
    fixedEarly,
    fixedUpdate,
    fixedLate,
} from './capabilities/tick';

// Queries / helpers
export { groupByTag, groupByUpdate } from './core/queries';

// Scheduler interface (only if a consumer wants to bring their own)
export { type Scheduler, defaultScheduler } from './scheduler';
