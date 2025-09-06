import { System } from '@pulse-ts/core';
import { ReplicationService } from '../services/ReplicationService';

/**
 * Periodically builds and sends replication snapshots.
 *
 * - Runs in fixed.update to align with simulation steps.
 */
export class SnapshotSystem extends System {
    static updateKind: 'frame' | 'fixed' = 'fixed';
    static updatePhase: 'early' | 'update' | 'late' = 'update';
    static order = 0;

    update(dt: number): void {
        const rep = this.world?.getService(ReplicationService);
        rep?.tick(dt);
    }
}
