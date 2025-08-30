import type { System, World, StatsService } from '@pulse-ts/core';
import { STATS_SERVICE } from '@pulse-ts/core';
import type { ThreePlugin } from '../plugin';

export interface StatsOverlayOptions {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    background?: string;
    color?: string;
    font?: string;
    pad?: string;
    zIndex?: string | number;
    updateMs?: number; // default 300ms
}

export class StatsOverlaySystem implements System {
    private world!: World;
    private el: HTMLDivElement | null = null;
    private tick?: { dispose(): void };
    private acc = 0;
    private interval = 300;

    constructor(
        private plugin: ThreePlugin,
        private opts?: StatsOverlayOptions,
    ) {}

    attach(world: World): void {
        this.world = world;
        if (this.el) return;
        const container =
            this.plugin.renderer.domElement.parentElement ?? document.body;
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
        this.tick = this.world.registerSystemTick(
            'frame',
            'late',
            (dt) => this.update(dt),
            Number.MAX_SAFE_INTEGER - 1,
        );
    }

    detach(): void {
        this.tick?.dispose();
        this.tick = undefined;
        this.el?.remove();
        this.el = null;
        // @ts-expect-error cleanup
        this.world = undefined;
    }

    private update(dt: number): void {
        if (!this.world || !this.el) return;
        this.acc += dt * 1000;
        if (this.acc < this.interval) return;
        this.acc = 0;
        const svc = this.world.getService(STATS_SERVICE) as
            | StatsService
            | undefined;
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
