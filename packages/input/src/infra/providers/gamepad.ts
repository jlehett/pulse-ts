import type { InputProvider } from '../../domain/bindings/types';
import { InputService } from '../../domain/services/Input';

/**
 * Minimal gamepad poller (stub).
 * Not registered by default; safe to import in non‑DOM environments.
 * Polls `navigator.getGamepads()` when available but does not map buttons yet.
 * @internal
 */
export class GamepadProvider implements InputProvider {
    /**
     * Create the gamepad provider.
     * @param service Target `InputService` (reserved for future mapping).
     */
    constructor(private service: InputService) {}

    /**
     * Start the provider (no‑op for now).
     */
    start(_target: EventTarget): void {
        void _target; // keep signature; no-op
    }
    /** Stop the provider (no‑op). */
    stop(): void {}
    /** Poll gamepads via the Navigator API (no mapping in v0). */
    update(): void {
        const nav: any =
            typeof navigator !== 'undefined' ? (navigator as any) : null;
        if (!nav?.getGamepads) return;
        void nav.getGamepads();
        // Future: map pad buttons/axes via bindings
        // This stub intentionally does nothing in v0 to keep scope tight.
    }
}
