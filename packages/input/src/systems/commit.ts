import { System, UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { InputService } from '../services/Input';

/**
 * Runs at frame.early to snapshot inputs before user update.
 */
export class InputCommitSystem extends System {
    static updateKind: UpdateKind = 'frame';
    static updatePhase: UpdatePhase = 'early';

    update(): void {
        const svc = this.world?.getService(InputService);
        svc?.commit();
    }
}
