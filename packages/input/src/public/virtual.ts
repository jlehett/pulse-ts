import type { Vec } from '../domain/bindings/types';
import { InputService } from '../domain/services/Input';

/**
 * Virtual input helper for tests and bots. Does not attach to DOM.
 *
 * @example
 * ```ts
 * import { VirtualInput } from '@pulse-ts/input';
 * const vi = new VirtualInput(service);
 * vi.press('jump');
 * vi.axis2D('move', { x: 1, y: 0 });
 * ```
 */
export class VirtualInput {
    constructor(private service: InputService) {}

    /**
     * Press an action.
     * @param action Action name.
     * @param sourceId Optional virtual source id for debugging.
     */
    press(action: string, sourceId = 'virt'): void {
        this.service.injectDigital(action, `virt:${sourceId}`, true);
    }

    /**
     * Release an action.
     * @param action Action name.
     * @param sourceId Optional virtual source id used in press().
     */
    release(action: string, sourceId = 'virt'): void {
        this.service.injectDigital(action, `virt:${sourceId}`, false);
    }

    /**
     * Inject per-frame 2D axis deltas.
     * @param action Axis2D action name.
     * @param axes Object with numeric components to accumulate this frame.
     */
    axis2D(action: string, axes: Vec): void {
        this.service.injectAxis2D(action, axes);
    }
}
