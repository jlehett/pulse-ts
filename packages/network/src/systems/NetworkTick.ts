import { System } from '@pulse-ts/core';
import { TransportService } from '../services/TransportService';

/**
 * A system that flushes the outgoing and dispatches the incoming messages.
 */
export class NetworkTick extends System {
    static updateKind: 'frame' | 'fixed' = 'frame';
    static updatePhase: 'early' | 'update' | 'late' = 'early';
    static order = -1000; // run very early to minimize latency

    update(_dt: number): void {
        const svc = this.world?.getService(TransportService);
        if (!svc) return;
        // Flush outbox first, then process incoming to reduce feedback loops
        svc.flushOutgoing();
        svc.dispatchIncoming(256);
    }
}
