import type { Vec } from '../bindings/types';
import { InputService } from '../services/Input';

/**
 * Virtual input helper for tests and bots. Does not attach to DOM.
 */
export class VirtualInput {
    constructor(private service: InputService) {}

    /**
     * Press an action.
     * @param action The action to press.
     * @param sourceId
     */
    press(action: string, sourceId = 'virt'): void {
        this.service.injectDigital(action, `virt:${sourceId}`, true);
    }

    /**
     * Release an action.
     * @param action The action to release.
     * @param sourceId The source ID.
     */
    release(action: string, sourceId = 'virt'): void {
        this.service.injectDigital(action, `virt:${sourceId}`, false);
    }

    /**
     * Inject a axis 2D action.
     * @param action The action to inject.
     * @param axes The axes to inject.
     */
    axis2D(action: string, axes: Vec): void {
        this.service.injectAxis2D(action, axes);
    }
}
