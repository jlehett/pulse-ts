import { useComponent, useFixedUpdate, Transform } from '@pulse-ts/core';
import { RigidBody } from './components/RigidBody';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A 3D point as `[x, y, z]`. */
export type Point3 = [number, number, number];

/** Built-in easing preset names. */
export type EasingPreset = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

/** An easing function or a preset name. */
export type EasingOption = EasingPreset | ((t: number) => number);

/**
 * Custom interpolation function. Receives the segment endpoints and a
 * normalized progress `t` in `[0, 1]`, returns the interpolated position.
 */
export type InterpolateFn = (from: Point3, to: Point3, t: number) => Point3;

/** Options for {@link useWaypointPatrol}. */
export interface WaypointPatrolOptions {
    /** Two or more waypoints the body patrols between. */
    waypoints: Point3[];

    /**
     * Constant travel speed in world units/second (speed mode).
     * Mutually exclusive with `duration`.
     */
    speed?: number;

    /**
     * Time in seconds to traverse each segment (duration mode).
     * Mutually exclusive with `speed`.
     */
    duration?: number;

    /**
     * Easing function or preset applied to segment progress in duration mode.
     * Ignored when using `speed` mode.
     *
     * @default 'linear'
     */
    easing?: EasingOption;

    /**
     * Custom position interpolation function. When provided, the patrol
     * computes `t` (eased progress) and calls this to get the target position.
     * Falls back to linear interpolation if omitted.
     */
    interpolate?: InterpolateFn;

    /**
     * Loop mode. `true` restarts at the first waypoint after reaching the
     * last (`A → B → C → A`). `false` (default) ping-pongs back and forth
     * (`A → B → C → B → A`).
     *
     * @default false
     */
    loop?: boolean;
}

/** Handle returned by {@link useWaypointPatrol}. */
export interface PatrolHandle {
    /** Pauses the patrol. The body's velocity is set to zero. */
    pause(): void;

    /** Resumes a paused patrol. */
    resume(): void;

    /** Whether the patrol is currently paused. */
    readonly paused: boolean;

    /** Index of the current segment (0-based). */
    readonly currentSegment: number;

    /** `1` when travelling forward through waypoints, `-1` when reversing (ping-pong only). */
    readonly direction: 1 | -1;
}

// ---------------------------------------------------------------------------
// Built-in easings
// ---------------------------------------------------------------------------

const EASINGS: Record<EasingPreset, (t: number) => number> = {
    linear: (t) => t,
    'ease-in': (t) => t * t,
    'ease-out': (t) => t * (2 - t),
    'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

function resolveEasing(opt?: EasingOption): (t: number) => number {
    if (!opt || opt === 'linear') return EASINGS.linear;
    if (typeof opt === 'function') return opt;
    return EASINGS[opt] ?? EASINGS.linear;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function lerp3(a: Point3, b: Point3, t: number): Point3 {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ];
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

/**
 * Patrols a kinematic rigid body between a set of waypoints. Supports two
 * modes:
 *
 * - **Speed mode** (`speed`): constant velocity along each segment, immediate
 *   direction reversal at endpoints. This matches the classic platformer
 *   moving-platform pattern.
 * - **Duration mode** (`duration`): time-based traversal with optional easing
 *   and custom interpolation per segment.
 *
 * By default the patrol ping-pongs (A → B → A). Set `loop: true` to wrap
 * around (A → B → C → A).
 *
 * @param body - The kinematic `RigidBody` to move.
 * @param options - Patrol configuration.
 * @returns A {@link PatrolHandle} for pausing/resuming and reading state.
 *
 * @example
 * ```ts
 * import { useRigidBody, useWaypointPatrol } from '@pulse-ts/physics';
 *
 * function MovingPlatform() {
 *     const body = useRigidBody({ type: 'kinematic' });
 *     const patrol = useWaypointPatrol(body, {
 *         waypoints: [[0, 2, 0], [10, 2, 0]],
 *         speed: 3,
 *     });
 * }
 * ```
 *
 * @example
 * ```ts
 * // Duration mode with easing
 * const patrol = useWaypointPatrol(body, {
 *     waypoints: [[0, 0, 0], [5, 5, 0], [10, 0, 0]],
 *     duration: 2,
 *     easing: 'ease-in-out',
 *     loop: true,
 * });
 * ```
 */
export function useWaypointPatrol(
    body: RigidBody,
    options: WaypointPatrolOptions,
): PatrolHandle {
    const { waypoints, loop = false } = options;
    const transform = useComponent(Transform);
    const easing = resolveEasing(options.easing);
    const interpFn = options.interpolate ?? lerp3;

    let segment = 0;
    let direction: 1 | -1 = 1;
    let paused = false;
    let segmentTime = 0; // elapsed time within current segment (duration mode)

    const handle: PatrolHandle = {
        pause() {
            paused = true;
            body.setLinearVelocity(0, 0, 0);
        },
        resume() {
            paused = false;
        },
        get paused() {
            return paused;
        },
        get currentSegment() {
            return segment;
        },
        get direction() {
            return direction;
        },
    };

    if (options.speed != null) {
        // ── Speed mode ──────────────────────────────────────────────────
        const speed = options.speed;

        useFixedUpdate((dt) => {
            if (paused) return;

            const pos = transform.localPosition;

            // Current target waypoint
            const targetIdx = direction === 1 ? segment + 1 : segment;
            const target = waypoints[targetIdx];
            const dx = target[0] - pos.x;
            const dy = target[1] - pos.y;
            const dz = target[2] - pos.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Arrived at waypoint — advance segment
            if (dist <= speed * dt) {
                advanceSegment();
            }

            // Recompute target after possible segment change
            const nextIdx = direction === 1 ? segment + 1 : segment;
            const next = waypoints[nextIdx];
            const ndx = next[0] - pos.x;
            const ndy = next[1] - pos.y;
            const ndz = next[2] - pos.z;
            const ndist = Math.sqrt(ndx * ndx + ndy * ndy + ndz * ndz);

            if (ndist > 1e-6) {
                const inv = 1 / ndist;
                body.setLinearVelocity(
                    ndx * inv * speed,
                    ndy * inv * speed,
                    ndz * inv * speed,
                );
            }
        });
    } else if (options.duration != null) {
        // ── Duration mode ───────────────────────────────────────────────
        const segDuration = options.duration;

        useFixedUpdate((dt) => {
            if (paused) return;

            segmentTime += dt;

            // Advance segments while time exceeds segment duration
            while (segmentTime >= segDuration) {
                segmentTime -= segDuration;
                advanceSegment();
            }

            const rawT = segmentTime / segDuration;
            const t = easing(Math.min(rawT, 1));

            const fromIdx = direction === 1 ? segment : segment + 1;
            const toIdx = direction === 1 ? segment + 1 : segment;
            const target = interpFn(waypoints[fromIdx], waypoints[toIdx], t);

            // Set velocity to reach target position in this step
            const pos = transform.localPosition;
            const dx = target[0] - pos.x;
            const dy = target[1] - pos.y;
            const dz = target[2] - pos.z;
            body.setLinearVelocity(dx / dt, dy / dt, dz / dt);
        });
    }

    function advanceSegment() {
        const maxSegment = waypoints.length - 2;

        if (loop) {
            segment = direction === 1 ? segment + 1 : segment - 1;
            if (segment > maxSegment) segment = 0;
            if (segment < 0) segment = maxSegment;
        } else {
            // Ping-pong
            if (direction === 1) {
                if (segment < maxSegment) {
                    segment++;
                } else {
                    direction = -1;
                }
            } else {
                if (segment > 0) {
                    segment--;
                } else {
                    direction = 1;
                }
            }
        }
    }

    return handle;
}
