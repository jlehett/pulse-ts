import type { World, UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { StatsService, System } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';

/**
 * Options for the on-screen performance stats overlay.
 */
export interface StatsOverlayOptions {
    /** Corner to anchor the overlay. Default: `top-left`. */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /** Background CSS color. Default: `rgba(0,0,0,0.4)`. */
    background?: string;
    /** Text color. Default: `#0f0`. */
    color?: string;
    /** CSS font. Default: `12px monospace`. */
    font?: string;
    /** CSS padding. Default: `2px 6px`. */
    pad?: string;
    /** CSS z-index. Default: `1000`. */
    zIndex?: string | number;
    /** Update interval in milliseconds. Default: `300`. */
    updateMs?: number;
}

/**
 * Displays a stats overlay (FPS, fixed SPS) inside Three's container element.
 *
 * - Appends a positioned `<div>` overlay next to the Three canvas.
 * - Reads values from `StatsService` every `updateMs`.
 *
 * @example
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { StatsOverlaySystem, ThreeService } from '@pulse-ts/three';
 * const world = new World();
 * world.provideService(new ThreeService({ canvas: document.createElement('canvas') }));
 * world.addSystem(new StatsOverlaySystem({ position: 'top-right' }));
 * ```
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
