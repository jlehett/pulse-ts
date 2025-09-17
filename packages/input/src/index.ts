export { installInput } from './install';

// Service and systems
export { InputService } from './services/Input';
export { InputCommitSystem } from './systems/commit';

// FC hooks
export {
    useInput,
    useAction,
    useAxis1D,
    useAxis2D,
    usePointer,
} from './fc/hooks';

// Types
export type {
    ActionState,
    Vec,
    PointerSnapshot,
    InputOptions,
    InputProvider,
} from './bindings/types';

// Declarative bindings API
export {
    Key,
    Axis1D,
    Axis2D,
    PointerMovement,
    PointerWheelScroll,
    Chord,
    Sequence,
} from './bindings/expr';
export type {
    BindingExpr,
    KeyBinding,
    Axis1DBinding,
    Axis2DBinding,
    PointerMovementBinding,
    PointerWheelBinding,
    ChordBinding,
    SequenceBinding,
    ExprBindings,
} from './bindings/types';
