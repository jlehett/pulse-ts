import type { World, UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { StatsService, System } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';

export interface StatsOverlayOptions {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    background?: string;
    color?: string;
    font?: string;
    pad?: string;
    zIndex?: string | number;
    updateMs?: number; // default 300ms
}

/**
 * Displays stats overlay on the screen (FPS, fixed sps) using Three's DOM element.
 */
export class StatsOverlaySystem extends System {
    static updateKind: UpdateKind = 'frame';
    static updatePhase: UpdatePhase = 'late';
    static order: number = Number.MAX_SAFE_INTEGER - 1;

    private el: HTMLDivElement | null = null;
    private acc = 0;
    private interval = 300;

    constructor(private opts?: StatsOverlayOptions) {
        super();
    }

    attach(world: World): void {
        super.attach(world);

        if (!this.world) return;

        const plugin = this.world.getService(ThreeService);
        if (!plugin) return;

        if (this.el) return;
        const container =
            plugin.renderer.domElement.parentElement ?? document.body;
        if (getComputedStyle(container).position === 'static') {
            (container as HTMLElement).style.position = 'relative';
        }
        const el = document.createElement('div');
        const pos = this.opts?.position ?? 'top-left';
        const bg = this.opts?.background ?? 'rgba(0,0,0,0.4)';
        const color = this.opts?.color ?? '#0f0';
        const font = this.opts?.font ?? '12px monospace';
        const pad = this.opts?.pad ?? '2px 6px';
        const z = String(this.opts?.zIndex ?? 1000);
        Object.assign(el.style, {
            position: 'absolute',
            left: pos.endsWith('left') ? '4px' : '',
            right: pos.endsWith('right') ? '4px' : '',
            top: pos.startsWith('top') ? '4px' : '',
            bottom: pos.startsWith('bottom') ? '4px' : '',
            background: bg,
            color,
            font,
            padding: pad,
            zIndex: z,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
        } as Partial<CSSStyleDeclaration>);
        container.appendChild(el);
        this.el = el as HTMLDivElement;
        this.interval = Math.max(50, this.opts?.updateMs ?? 300);
        this.acc = 0;
    }

    detach(): void {
        super.detach();
        this.el?.remove();
        this.el = null;
    }

    update(dt: number): void {
        if (!this.world || !this.el) return;

        this.acc += dt * 1000;
        if (this.acc < this.interval) return;
        this.acc = 0;
        const svc = this.world.getService(StatsService);
        let fps = 0,
            fixedSps = 0;
        if (svc) {
            const snap = svc.get();
            fps = snap.fps;
            fixedSps = snap.fixedSps;
        }
        this.el.textContent = `fps ${fps.toFixed(0)}  fixed ${fixedSps.toFixed(0)}`;
    }
}
