import type { InputProvider } from '../bindings/types';
import { InputService } from '../services/Input';

/**
 * A provider for the DOM keyboard.
 */
export class DOMKeyboardProvider implements InputProvider {
    private target: EventTarget | null = null;
    private keydown?: (e: any) => void;
    private keyup?: (e: any) => void;

    constructor(
        private service: InputService,
        private opts: { preventDefault?: boolean } = {},
    ) {}

    /**
     * Start the provider.
     * @param target The target to listen for events on.
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
     * Stop the provider.
     */
    stop(): void {
        if (!this.target) return;
        (this.target as any).removeEventListener?.('keydown', this.keydown!);
        (this.target as any).removeEventListener?.('keyup', this.keyup!);
        this.keydown = this.keyup = undefined;
        this.target = null;
    }
}
