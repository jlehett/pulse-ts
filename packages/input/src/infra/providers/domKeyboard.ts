import type { InputProvider } from '../../domain/bindings/types';
import { InputService } from '../../domain/services/Input';

/**
 * DOM keyboard provider.
 * Translates `keydown`/`keyup` events into `InputService.handleKey` calls and
 * optionally prevents default browser behavior. Auto‑repeat keydowns are
 * ignored to keep sequence/chord timing stable.
 * @internal
 */
export class DOMKeyboardProvider implements InputProvider {
    private target: EventTarget | null = null;
    private keydown?: (e: any) => void;
    private keyup?: (e: any) => void;

    /**
     * Create the DOM keyboard provider.
     * @param service Target `InputService` to forward key events to.
     * @param opts Optional `{ preventDefault }` to call `event.preventDefault()`.
     */
    constructor(
        private service: InputService,
        private opts: { preventDefault?: boolean } = {},
    ) {}

    /**
     * Start listening to keyboard events on the given target.
     * @param target An `EventTarget` (e.g., `window` or a specific element).
     */
    start(target: EventTarget): void {
        this.target = target;
        const kd = (e: any) => {
            const code: string | undefined = e?.code;
            if (!code) return;
            if (e?.repeat) return; // ignore auto-repeat for sequence/chord stability
            if (this.opts.preventDefault) e.preventDefault?.();
            this.service.handleKey(code, true);
        };
        const ku = (e: any) => {
            const code: string | undefined = e?.code;
            if (!code) return;
            if (this.opts.preventDefault) e.preventDefault?.();
            this.service.handleKey(code, false);
        };
        (target as any).addEventListener?.('keydown', kd, {
            passive: !this.opts.preventDefault,
        });
        (target as any).addEventListener?.('keyup', ku, {
            passive: !this.opts.preventDefault,
        });
        this.keydown = kd;
        this.keyup = ku;
    }

    /**
     * Remove installed listeners and release references.
     */
    stop(): void {
        if (!this.target) return;
        (this.target as any).removeEventListener?.('keydown', this.keydown!);
        (this.target as any).removeEventListener?.('keyup', this.keyup!);
        this.keydown = this.keyup = undefined;
        this.target = null;
    }
}
