export * from './types';
export { Vec3 } from './math/vec3';
export { Quat } from './math/quat';
export {
    Transform,
    attachTransform,
    maybeGetTransform,
    getTransform,
    type TRS,
    createTRS,
} from './transform';
export { Node } from './node';
export {
    World,
    __worldRegisterTick,
    __worldAddTransform,
    __worldRemoveTransform,
    type ServiceKey,
    createServiceKey,
} from './world';

// FC API
export type { FC } from './fc/runtime';
export { mountFC as mount, __fcCurrent } from './fc/runtime';
export {
    useWorld,
    useNode,
    useInit,
    useDestroy,
    useTransform,
    useFixedEarly,
    useFixedUpdate,
    useFixedLate,
    useFrameEarly,
    useFrameUpdate,
    useFrameLate,
    useChild,
} from './fc/hooks';
