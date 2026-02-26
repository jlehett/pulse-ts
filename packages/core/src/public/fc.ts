export type { FC } from '../domain/fc/runtime';
export { mountFC as mount, __fcCurrent } from '../domain/fc/runtime';
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
} from '../domain/fc/hooks';
export {
    createContext,
    useProvideContext,
    useContext,
    useOptionalContext,
} from '../domain/fc/context';
export type { Context } from '../domain/fc/context';
