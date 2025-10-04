import type { InputProvider } from '../../domain/bindings/types';
import { InputService } from '../../domain/services/Input';

/**
 * Minimal gamepad poller (stub). Not registered by default; safe to import in non-DOM envs.
 * @internal
 */
export class GamepadProvider implements InputProvider {
    constructor(private service: InputService) {}

    start(_target: EventTarget): void {
        void _target; // keep signature; no-op
    }
    stop(): void {
        // no-op
    }
    update(): void {
        const nav: any =
            typeof navigator !== 'undefined' ? (navigator as any) : null;
        if (!nav?.getGamepads) return;
        void nav.getGamepads();
        // Future: map pad buttons/axes via bindings
        // This stub intentionally does nothing in v0 to keep scope tight.
    }
}
