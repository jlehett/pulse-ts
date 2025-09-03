import type { InputProvider } from '../bindings/types';
import { InputService } from '../services/Input';

/**
 * Minimal gamepad poller (stub). Not registered by default; safe to import in non-DOM envs.
 */
export class GamepadProvider implements InputProvider {
    constructor(private service: InputService) {}

    start(_target: EventTarget): void {
        // no-op
    }
    stop(): void {
        // no-op
    }
    update(): void {
        const nav: any =
            typeof navigator !== 'undefined' ? (navigator as any) : null;
        if (!nav?.getGamepads) return;
        const pads: any[] = Array.from(nav.getGamepads() || []);
        // Future: map pad buttons/axes via bindings
        // This stub intentionally does nothing in v0 to keep scope tight.
    }
}
