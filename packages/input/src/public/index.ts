export { installInput } from './install';

// Service and systems
export { InputService } from '../domain/services/Input';
export { InputCommitSystem } from '../domain/systems/commit';

// FC hooks
export { useInput, useAction, useAxis1D, useAxis2D, usePointer } from './hooks';

// Testing/bots helper
export { VirtualInput } from './virtual';

// Types
export type {
    ActionState,
    Vec,
    PointerSnapshot,
    InputOptions,
    InputProvider,
    BindingExpr,
    KeyBinding,
    Axis1DBinding,
    Axis2DBinding,
    PointerMovementBinding,
    PointerWheelBinding,
    PointerButtonBinding,
    ChordBinding,
    SequenceBinding,
    ExprBindings,
} from '../domain/bindings/types';

// Declarative bindings API
export {
    Key,
    Axis1D,
    Axis2D,
    PointerMovement,
    PointerWheelScroll,
    PointerButton,
    Chord,
    Sequence,
} from '../domain/bindings/expr';
