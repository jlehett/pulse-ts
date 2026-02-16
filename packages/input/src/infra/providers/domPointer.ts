import type { InputProvider } from '../../domain/bindings/types';
import { InputService } from '../../domain/services/Input';

/**
 * DOM pointer provider.
 * Maps pointer events to pointer state and pointer‑movement bindings.
 * Optionally prevents default behavior and can request pointer lock on down.
 * @internal
 */
export class DOMPointerProvider implements InputProvider {
    private target: EventTarget | null = null;
    private onMove?: (e: any) => void;
    private onDown?: (e: any) => void;
    private onUp?: (e: any) => void;
    private onCancel?: (e: any) => void;
    private onWheel?: (e: any) => void;

    private lastX = 0;
    private lastY = 0;

    /**
     * Create the DOM pointer provider.
     * @param service Target `InputService` to forward pointer events to.
     * @param opts `{ preventDefault, pointerLock }` behavior toggles.
     */
    constructor(
        private service: InputService,
        private opts: { preventDefault?: boolean; pointerLock?: boolean } = {},
    ) {}

    /**
     * Update the provider.
     */
    update?(): void {
        // noop
    }

    /**
     * Start listening to pointer and wheel events on `target`.
     * @param target An `EventTarget` (e.g., `window` or a canvas element).
     */
    start(target: EventTarget): void {
        this.target = target;
        const getLocked = () => {
            try {
                return !!(
                    typeof document !== 'undefined' &&
                    (document as any).pointerLockElement
                );
            } catch {
                return false;
            }
        };

        const move = (e: any) => {
            const x: number =
                typeof e.clientX === 'number' ? e.clientX : this.lastX;
            const y: number =
                typeof e.clientY === 'number' ? e.clientY : this.lastY;
            const dx: number =
                typeof e.movementX === 'number' ? e.movementX : x - this.lastX;
            const dy: number =
                typeof e.movementY === 'number' ? e.movementY : y - this.lastY;
            this.lastX = x;
            this.lastY = y;
            if (this.opts.preventDefault) e.preventDefault?.();
            this.service.handlePointerMove(
                x,
                y,
                dx,
                dy,
                getLocked(),
                e?.buttons >>> 0 || 0,
            );
        };

        const down = (e: any) => {
            if (this.opts.preventDefault) e.preventDefault?.();
            const btn: number = e?.button ?? 0;
            this.service.handlePointerButton(btn, true);
            if (this.opts.pointerLock) {
                const el: any = e?.target;
                el?.requestPointerLock?.();
            }
        };

        const up = (e: any) => {
            if (this.opts.preventDefault) e.preventDefault?.();
            const btn: number = e?.button ?? 0;
            this.service.handlePointerButton(btn, false);
        };

        const cancel = (e: any) => {
            if (this.opts.preventDefault) e.preventDefault?.();
            // On cancel, clear all buttons by sending up for common buttons
            for (const b of [0, 1, 2])
                this.service.handlePointerButton(b, false);
        };

        const wheel = (e: any) => {
            if (this.opts.preventDefault) e.preventDefault?.();
            this.service.handleWheel(
                e?.deltaX ?? 0,
                e?.deltaY ?? 0,
                e?.deltaZ ?? 0,
            );
        };

        (target as any).addEventListener?.('pointermove', move, {
            passive: !this.opts.preventDefault,
        });
        (target as any).addEventListener?.('pointerdown', down, {
            passive: !this.opts.preventDefault,
        });
        (target as any).addEventListener?.('pointerup', up, {
            passive: !this.opts.preventDefault,
        });
        (target as any).addEventListener?.('pointercancel', cancel, {
            passive: !this.opts.preventDefault,
        });
        (target as any).addEventListener?.('wheel', wheel, {
            passive: !this.opts.preventDefault,
        });

        this.onMove = move;
        this.onDown = down;
        this.onUp = up;
        this.onCancel = cancel;
        this.onWheel = wheel;
    }

    /**
     * Remove installed listeners and release references.
     */
    stop(): void {
        if (!this.target) return;
        (this.target as any).removeEventListener?.('pointermove', this.onMove!);
        (this.target as any).removeEventListener?.('pointerdown', this.onDown!);
        (this.target as any).removeEventListener?.('pointerup', this.onUp!);
        (this.target as any).removeEventListener?.(
            'pointercancel',
            this.onCancel!,
        );
        (this.target as any).removeEventListener?.('wheel', this.onWheel!);
        this.onMove =
            this.onDown =
            this.onUp =
            this.onCancel =
            this.onWheel =
                undefined;
        this.target = null;
        this.lastX = this.lastY = 0;
    }
}
