import { useFixedUpdate } from './hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for a single state in a {@link StateMachineConfig}.
 */
export interface StateConfig {
    /** Called once when entering this state. */
    onEnter?: () => void;
    /** Called once when leaving this state. */
    onExit?: () => void;
    /** Called each fixed tick while in this state. */
    onUpdate?: (dt: number) => void;
}

/**
 * An automatic transition definition. Evaluated each fixed tick in
 * declaration order; the first matching transition fires.
 *
 * @typeParam S - The union of state name strings.
 */
export interface TransitionConfig<S extends string> {
    /** Source state(s) for this transition. */
    from: S | S[];
    /** Target state to transition to. */
    to: S;
    /** Guard — transition fires when this returns `true`. */
    when: () => boolean;
    /** Side effect to run during the transition (after onExit, before onEnter). */
    action?: () => void;
}

/**
 * Full configuration for {@link useStateMachine}.
 *
 * @typeParam S - The union of state name strings.
 */
export interface StateMachineConfig<S extends string> {
    /** Initial state. */
    initial: S;
    /** State definitions with optional lifecycle hooks. */
    states: Record<S, StateConfig<S>>;
    /** Automatic transitions evaluated each fixed tick in declaration order. */
    transitions?: Array<TransitionConfig<S>>;
}

/**
 * Handle returned by {@link useStateMachine} for reading current state
 * and forcing imperative transitions.
 *
 * @typeParam S - The union of state name strings.
 */
export interface StateMachineHandle<S extends string> {
    /** Current state name. */
    readonly current: S;
    /** Force a transition to a specific state. Fires onExit/onEnter hooks. */
    send(state: S): void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

function transition<S extends string>(
    config: StateMachineConfig<S>,
    currentState: S,
    nextState: S,
    action?: () => void,
): void {
    const fromDef = config.states[currentState];
    const toDef = config.states[nextState];
    fromDef.onExit?.();
    action?.();
    toDef.onEnter?.();
}

/**
 * Creates a declarative state machine that evaluates guard-based transitions
 * each fixed tick. Fires `onExit`/`onEnter` hooks on state changes and calls
 * `onUpdate` each tick while in a state.
 *
 * **Transition lifecycle** (automatic or via `send()`):
 * 1. Current state's `onExit()` is called (if defined).
 * 2. Transition's `action()` is called (if defined, automatic transitions only).
 * 3. Current state updates to the new state.
 * 4. New state's `onEnter()` is called (if defined).
 *
 * Automatic transitions are evaluated each fixed tick in declaration order.
 * The first matching transition fires. Only one transition fires per tick.
 *
 * @typeParam S - A string union of state names.
 * @param config - State machine configuration.
 * @returns A {@link StateMachineHandle} for reading current state and forcing transitions.
 *
 * @example
 * ```ts
 * import { useStateMachine } from '@pulse-ts/core';
 *
 * const sm = useStateMachine({
 *     initial: 'idle',
 *     states: {
 *         idle: { onEnter: () => console.log('entered idle') },
 *         running: {
 *             onUpdate: (dt) => moveForward(dt),
 *         },
 *         jumping: {
 *             onEnter: () => applyJumpForce(),
 *         },
 *     },
 *     transitions: [
 *         { from: 'idle', to: 'running', when: () => input.forward },
 *         { from: 'running', to: 'idle', when: () => !input.forward },
 *         { from: ['idle', 'running'], to: 'jumping', when: () => input.jump },
 *     ],
 * });
 *
 * // Imperative transition
 * sm.send('idle');
 * // Read current state
 * console.log(sm.current); // 'idle'
 * ```
 */
export function useStateMachine<S extends string>(
    config: StateMachineConfig<S>,
): StateMachineHandle<S> {
    let currentState: S = config.initial;
    config.states[currentState].onEnter?.();

    const handle: StateMachineHandle<S> = {
        get current() {
            return currentState;
        },
        send(state: S) {
            if (state === currentState) return;
            transition(config, currentState, state);
            currentState = state;
        },
    };

    useFixedUpdate((dt) => {
        // Evaluate automatic transitions (declaration order, first match wins)
        if (config.transitions) {
            for (const t of config.transitions) {
                const sources = Array.isArray(t.from) ? t.from : [t.from];
                if (sources.includes(currentState) && t.when()) {
                    transition(config, currentState, t.to, t.action);
                    currentState = t.to;
                    break; // one transition per tick
                }
            }
        }

        // Run onUpdate for the current state
        config.states[currentState].onUpdate?.(dt);
    });

    return handle;
}
