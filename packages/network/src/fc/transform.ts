import { useInit, useNode, useWorld } from '@pulse-ts/core';
import { attachComponent } from '@pulse-ts/core';
import { Transform } from '@pulse-ts/core';
import { StableId } from '@pulse-ts/core';
import { ReplicationService } from '../services/ReplicationService';
import { InterpolationService } from '../services/InterpolationService';
import { SnapshotSystem } from '../systems/SnapshotSystem';
import { NetworkTick } from '../systems/NetworkTick';
import { InterpolationSystem } from '../systems/InterpolationSystem';
import { useReplication } from './hooks';

/**
 * Replicates the local Transform of this node under replica key 'transform'.
 *
 * - Producer: sends { p:{x,y,z}, r:{x,y,z,w}, s:{x,y,z} } at snapshot rate.
 * - Consumer: applies incoming patches as smoothing targets via InterpolationService.
 *
 * Usage:
 * - On both sides, ensure `useStableId('entity-id')` or pass `opts.id`.
 * - Call `useReplicateTransform({ role: 'producer'|'consumer'|'both' })`.
 */
export function useReplicateTransform(
    opts: {
        id?: string;
        role?: 'producer' | 'consumer' | 'both';
        /** Smoothing rate constant (per second). Higher is snappier. Default 12. */
        lambda?: number;
        /** Snap immediately if further than this distance. Default 5 units. */
        snapDist?: number;
    } = {},
) {
    const world = useWorld();
    const node = useNode();
    const trans = attachComponent(node, Transform);

    // Ensure services/systems once
    useInit(() => {
        if (!world.getService(ReplicationService))
            world.provideService(new ReplicationService());
        if (!world.getService(InterpolationService))
            world.provideService(new InterpolationService());
        if (!world.getSystem(NetworkTick)) world.addSystem(new NetworkTick());
        if (!world.getSystem(SnapshotSystem))
            world.addSystem(new SnapshotSystem());
        if (!world.getSystem(InterpolationSystem))
            world.addSystem(new InterpolationSystem());
    });

    const id = opts.id ?? attachComponent(node, StableId).id;
    const role = opts.role ?? 'both';

    // Consumer path: register interpolation target entry
    useInit(() => {
        if (role === 'consumer' || role === 'both') {
            const interp = world.getService(InterpolationService)!;
            interp.register(node, {
                id,
                lambda: opts.lambda,
                snapDist: opts.snapDist,
            });
        }
    });

    // Wire into replication service via generic hook
    useReplication('transform', {
        id,
        read:
            role === 'producer' || role === 'both'
                ? () => ({
                      p: {
                          x: trans.localPosition.x,
                          y: trans.localPosition.y,
                          z: trans.localPosition.z,
                      },
                      r: {
                          x: trans.localRotation.x,
                          y: trans.localRotation.y,
                          z: trans.localRotation.z,
                          w: trans.localRotation.w,
                      },
                      s: {
                          x: trans.localScale.x,
                          y: trans.localScale.y,
                          z: trans.localScale.z,
                      },
                  })
                : undefined,
        apply:
            role === 'consumer' || role === 'both'
                ? (patch: any) => {
                      const interp = world.getService(InterpolationService)!;
                      const eid = (
                          opts.id ?? attachComponent(node, StableId).id
                      ).trim();
                      if (!eid) return;
                      interp.setTarget(eid, patch);
                  }
                : undefined,
    });
}
