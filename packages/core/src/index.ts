// Public API surface

// Core
export { World } from './core/world';
export { Node } from './core/node';
export { Group } from './core/group';
export { Signal } from './core/signals';
export { TransformCommitter } from './core/transform-committer';

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

export {
    Transform,
    withTransform,
    hasTransform,
    getTransform,
    maybeGetTransform,
} from './capabilities/transform';

// Queries / helpers
export { groupByTag, groupByUpdate, groupWithTransform } from './core/queries';

// Scheduler interface (only if a consumer wants to bring their own)
export { type Scheduler, defaultScheduler } from './scheduler';

// Math
export { Vec3 } from './math/vec3';
export { Quat } from './math/quat';
