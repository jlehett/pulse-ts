import { useWorld, useStableId } from '@pulse-ts/core';
import { InterpolationService } from '../domain/services/InterpolationService';
import { useReplicateTransform } from './transform';

/**
 * Interpolation data handle returned by {@link useRemoteEntity}.
 */
export interface RemoteEntityHandle {
    /** The stable ID used for replication. */
    readonly stableId: string;
    /** Current target velocity from the interpolation service (may be null before first network update). */
    readonly targetVelocity: { x: number; y: number; z: number } | null;
    /** Current target position from the interpolation service (may be null before first network update). */
    readonly targetPosition: { x: number; y: number; z: number } | null;
}

/**
 * Sets up a consumer-side replicated entity: assigns stable ID,
 * configures transform replication as consumer, and provides
 * convenient access to interpolation data.
 *
 * Combines `useStableId` + `useReplicateTransform({ role: 'consumer' })`
 * into a single call with built-in interpolation data accessors.
 *
 * @param stableId - Unique network identity for this entity.
 * @param options - Optional configuration.
 * @param options.lambda - Interpolation smoothing factor. Higher = snappier. Default 12.
 * @returns A handle with interpolation data accessors.
 *
 * @example
 * ```ts
 * const remote = useRemoteEntity(`player-${remotePlayerId}`, { lambda: 25 });
 *
 * useFixedUpdate(() => {
 *     const rv = remote.targetVelocity;
 *     if (rv) setPlayerVelocity(remotePlayerId, rv.x, rv.z);
 * });
 * ```
 */
export function useRemoteEntity(
    stableId: string,
    options?: {
        /** Interpolation smoothing factor. Higher = snappier. */
        lambda?: number;
    },
): RemoteEntityHandle {
    const world = useWorld();

    useStableId(stableId);
    useReplicateTransform({
        id: stableId,
        role: 'consumer',
        lambda: options?.lambda,
    });

    return {
        stableId,
        get targetVelocity() {
            const interp = world.getService(InterpolationService);
            return interp?.getTargetVelocity(stableId) ?? null;
        },
        get targetPosition() {
            const interp = world.getService(InterpolationService);
            return interp?.getTargetPosition(stableId) ?? null;
        },
    };
}

/**
 * Sets up a producer-side replicated entity: assigns stable ID
 * and configures transform replication as producer.
 *
 * Combines `useStableId` + `useReplicateTransform({ role: 'producer' })`
 * into a single call.
 *
 * @param stableId - Unique network identity for this entity.
 *
 * @example
 * ```ts
 * useLocalEntity(`player-${playerId}`);
 * ```
 */
export function useLocalEntity(stableId: string): void {
    useStableId(stableId);
    useReplicateTransform({ id: stableId, role: 'producer' });
}
