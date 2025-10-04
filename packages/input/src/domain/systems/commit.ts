import { System, UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { InputService } from '../services/Input';

/**
 * System that commits input at `frame.early` so user code reads a stable snapshot.
 *
 * @example
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { InputCommitSystem, InputService } from '@pulse-ts/input';
 * const world = new World();
 * world.provideService(new InputService());
 * world.addSystem(new InputCommitSystem());
 * ```
 */
export class InputCommitSystem extends System {
    static updateKind: UpdateKind = 'frame';
    static updatePhase: UpdatePhase = 'early';

    update(): void {
        const svc = this.world?.getService(InputService);
        svc?.commit();
    }
}
