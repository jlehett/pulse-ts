import * as THREE from 'three';
import type { AbilityKind } from '../../config/types';
import type { FxEngine } from './engine';

/**
 * Per-ability VFX choreography. Every {@link AbilityKind} gets a bespoke
 * composition built from {@link FxEngine} primitives so each ability reads
 * distinctly on the battlefield, plus shared combat effects (attacks, hits,
 * deaths, heals, shields).
 */

/** Positional context for one ability cast. */
export interface AbilityFxContext {
    /** Caster anchor (chest height). */
    caster: THREE.Vector3;
    /** Anchors of units hit/affected in the same event batch. */
    targets: THREE.Vector3[];
    /** Ground positions of the raked board column (sweep only). */
    column?: THREE.Vector3[];
}

const UP = new THREE.Vector3(0, 1, 0);

/** Yaw (Y rotation) pointing from `a` toward `b`. */
const yawTo = (a: THREE.Vector3, b: THREE.Vector3) =>
    Math.atan2(b.x - a.x, b.z - a.z);

/** Horizontal unit vector from `a` toward `b`. */
const dirTo = (a: THREE.Vector3, b: THREE.Vector3) => {
    const d = new THREE.Vector3(b.x - a.x, 0, b.z - a.z);
    return d.lengthSq() < 1e-6 ? new THREE.Vector3(0, 0, 1) : d.normalize();
};

/** First hit position, or a point just in front of the caster. */
const primary = (ctx: AbilityFxContext) =>
    ctx.targets[0] ??
    ctx.caster.clone().add(new THREE.Vector3(0, 0, ctx.caster.z > 0 ? -1 : 1));

type Choreo = (fx: FxEngine, ctx: AbilityFxContext) => void;

// ── Reusable compositions ───────────────────────────────────────────────

const explosion = (
    fx: FxEngine,
    p: THREE.Vector3,
    colors: number[],
    scale = 1,
) => {
    fx.flash(p, colors[0], 2.2 * scale, 0.28);
    fx.burst(p, {
        count: Math.round(26 * scale),
        color: colors,
        endColor: 0x3a1c08,
        speed: [3 * scale, 7 * scale],
        gravity: 4,
        drag: 1.2,
        size: [0.3 * scale, 0.05],
        life: [0.35, 0.7],
    });
    fx.ringWave(p, colors[0], { r1: 1.9 * scale, dur: 0.4 });
};

const bladeHit = (
    fx: FxEngine,
    from: THREE.Vector3,
    at: THREE.Vector3,
    color: number,
    scale = 1,
) => {
    fx.slashArc(at, yawTo(from, at), color, {
        radius: 1.05 * scale,
        dur: 0.2,
    });
    fx.flash(at, color, 1.3 * scale, 0.16);
    fx.burst(at, {
        count: 12,
        color: [color, 0xffffff],
        dir: dirTo(from, at),
        spread: 0.7,
        speed: [3, 6.5],
        size: [0.18, 0.03],
        life: [0.2, 0.4],
    });
};

const risingSparkles = (
    fx: FxEngine,
    p: THREE.Vector3,
    color: number,
    count = 20,
) => {
    fx.burst(new THREE.Vector3(p.x, 0.2, p.z), {
        count,
        color: [color, 0xffffff],
        dir: UP,
        spread: 0.55,
        speed: [1.2, 2.6],
        gravity: -1.6,
        drag: 0.6,
        size: [0.16, 0.03],
        life: [0.6, 1.0],
        origin: 0.45,
    });
};

const crackle = (fx: FxEngine, p: THREE.Vector3, color: number, n = 4) => {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const tip = p
            .clone()
            .add(
                new THREE.Vector3(
                    Math.cos(a) * 0.9,
                    (Math.random() - 0.3) * 1.2,
                    Math.sin(a) * 0.9,
                ),
            );
        fx.delay(i * 0.05, () =>
            fx.bolt(p, tip, color, {
                jitter: 0.25,
                thickness: 0.07,
                dur: 0.12,
            }),
        );
    }
};

// ── Per-kind choreography table ─────────────────────────────────────────

const CHOREO: Record<AbilityKind, Choreo> = {
    strike(fx, ctx) {
        const t = primary(ctx);
        bladeHit(fx, ctx.caster, t, 0xffa14a, 1.25);
        fx.ringWave(t, 0xffa14a, { r1: 1.3, dur: 0.3 });
        fx.shake(0.07, 0.2);
    },

    nova(fx, ctx) {
        const c = ctx.caster;
        fx.flash(c, 0x59e3ff, 2.4, 0.25);
        fx.dome(c, 0x59e3ff, { radius: 2.1, dur: 0.45 });
        fx.ringWave(c, 0x59e3ff, { r1: 2.6, dur: 0.5 });
        fx.delay(0.12, () => fx.ringWave(c, 0xd2f6ff, { r1: 2.6, dur: 0.45 }));
        fx.burst(c, {
            count: 34,
            color: [0x59e3ff, 0xd2f6ff],
            speed: [4, 7],
            gravity: 1,
            size: [0.24, 0.04],
        });
        fx.shake(0.08, 0.25);
    },

    blast(fx, ctx) {
        const t = primary(ctx);
        fx.flash(ctx.caster, 0xff6a3d, 1.2, 0.15);
        fx.projectile(ctx.caster, t, {
            dur: 0.28,
            arc: 0.5,
            color: 0xff6a3d,
            size: 0.42,
            onArrive: () => {
                explosion(fx, t, [0xffc16b, 0xff6a3d, 0xff3d2e], 1.15);
                fx.shake(0.12, 0.3);
            },
        });
    },

    bounce(fx, ctx) {
        const hops = ctx.targets.length ? ctx.targets : [primary(ctx)];
        let from = ctx.caster;
        hops.forEach((t, i) => {
            const start = from;
            fx.delay(i * 0.26, () =>
                fx.projectile(start, t, {
                    dur: 0.24,
                    arc: 0.9,
                    color: 0xffd23f,
                    size: 0.5,
                    onArrive: () =>
                        explosion(fx, t, [0xffe082, 0xffd23f, 0xff9d2e], 1.0),
                }),
            );
            from = t;
        });
    },

    triage(fx, ctx) {
        for (const t of ctx.targets.length ? ctx.targets : [ctx.caster]) {
            fx.pillar(t, 0x69f0ae, { radius: 0.3, height: 2.6, dur: 0.5 });
            risingSparkles(fx, t, 0x69f0ae);
            fx.flash(t, 0xbaffd9, 1.1, 0.3);
        }
    },

    echo(fx, ctx) {
        const [t0, t1] = [primary(ctx), ctx.targets[1]];
        fx.bolt(ctx.caster, t0, 0xb45cff, { thickness: 0.12, dur: 0.22 });
        fx.flash(t0, 0xb45cff, 1.8, 0.25);
        fx.ringWave(t0, 0xb45cff, { r1: 1.2, dur: 0.3 });
        const second = t1 ?? t0;
        fx.delay(0.35, () => {
            fx.bolt(t0, second, 0xd9a6ff, { thickness: 0.1, dur: 0.22 });
            fx.flash(second, 0xd9a6ff, 1.8, 0.25);
            fx.ringWave(second, 0xd9a6ff, { r1: 1.2, dur: 0.3 });
        });
    },

    summon(fx, ctx) {
        const p = primary(ctx);
        fx.pillar(p, 0x64ffda, { radius: 0.38, height: 2.4, dur: 0.5 });
        fx.vortex(p, 0x64ffda, { radius: 1.1, count: 26, inward: true });
        fx.delay(0.25, () => fx.flash(p, 0xd9fff4, 1.6, 0.25));
        fx.ringWave(p, 0x64ffda, { r1: 1.4, dur: 0.45 });
    },

    flicker(fx, ctx) {
        for (const t of ctx.targets.length ? ctx.targets : [primary(ctx)]) {
            fx.beam(ctx.caster, t, 0xff4de1, { width: 0.15, dur: 0.14 });
            fx.flash(ctx.caster, 0xff4de1, 1.0, 0.12);
            const yaw = yawTo(ctx.caster, t);
            fx.slashArc(t, yaw, 0xff4de1, { dur: 0.18, tilt: 0.9 });
            fx.slashArc(t, yaw, 0xffc4f2, { dur: 0.18, tilt: -0.9, dir: -1 });
        }
    },

    phantom(fx, ctx) {
        const t = primary(ctx);
        fx.dome(ctx.caster, 0x9fb8ff, { radius: 1.1, dur: 0.3 });
        fx.burst(ctx.caster, {
            count: 16,
            color: 0x9fb8ff,
            dir: UP,
            spread: 0.9,
            speed: [0.8, 1.8],
            gravity: -1,
            size: [0.22, 0.04],
            life: [0.5, 0.9],
            origin: 0.4,
        });
        fx.beam(ctx.caster, t, 0x9fb8ff, { width: 0.14, dur: 0.14 });
        bladeHit(fx, ctx.caster, t, 0xc4d3ff);
    },

    drain(fx, ctx) {
        const t = primary(ctx);
        fx.burst(t, {
            count: 14,
            color: 0x7a1f2b,
            endColor: 0x8bc34a,
            speed: [1, 2.5],
            size: [0.22, 0.05],
        });
        fx.flash(t, 0x8bc34a, 1.5, 0.25);
        fx.stream(t, ctx.caster, 0x8bc34a, { dur: 0.55, rate: 110 });
        fx.delay(0.5, () => {
            fx.flash(ctx.caster, 0xc9f29b, 1.4, 0.25);
            risingSparkles(fx, ctx.caster, 0x8bc34a, 10);
        });
    },

    concussive(fx, ctx) {
        const hits = ctx.targets.length ? ctx.targets : [primary(ctx)];
        hits.forEach((t, i) => {
            fx.delay(i * 0.12, () =>
                fx.projectile(ctx.caster, t, {
                    dur: 0.42,
                    arc: 1.5,
                    color: 0x7fd8ff,
                    size: 0.34,
                    onArrive: () => {
                        fx.flash(t, 0xbfeaff, 1.8, 0.22);
                        fx.ringWave(t, 0x7fd8ff, { r1: 1.5, dur: 0.4 });
                        // Hanging concussion mist.
                        fx.burst(t, {
                            count: 14,
                            color: 0x7fd8ff,
                            speed: [0.4, 1.2],
                            gravity: -0.2,
                            drag: 2,
                            size: [0.3, 0.4],
                            life: [0.6, 1.1],
                            origin: 0.4,
                        });
                        fx.shake(0.05, 0.15);
                    },
                }),
            );
        });
    },

    barrage(fx, ctx) {
        const hits = ctx.targets.length ? ctx.targets : [primary(ctx)];
        hits.forEach((t, i) => {
            const last = i === hits.length - 1;
            fx.delay(i * 0.09, () =>
                fx.projectile(ctx.caster, t, {
                    dur: 0.2,
                    color: 0xffb74d,
                    size: last ? 0.5 : 0.3,
                    onArrive: () => {
                        explosion(
                            fx,
                            t,
                            [0xffd54f, 0xffb74d, 0xff7043],
                            last ? 1.2 : 0.65,
                        );
                        if (last) fx.shake(0.12, 0.3);
                    },
                }),
            );
        });
    },

    sweep(fx, ctx) {
        const cells = ctx.column ?? [primary(ctx)];
        cells.forEach((p, i) => {
            fx.delay(i * 0.045, () => {
                fx.pillar(p, 0xffe082, { radius: 0.34, height: 3, dur: 0.4 });
                fx.decal(p, 0xffe082, { radius: 0.7, dur: 1.2 });
            });
        });
        fx.shake(0.06, 0.25);
    },

    snipe(fx, ctx) {
        const hits = ctx.targets.length ? ctx.targets : [primary(ctx)];
        const far = hits.reduce((a, b) =>
            ctx.caster.distanceToSquared(a) > ctx.caster.distanceToSquared(b)
                ? a
                : b,
        );
        fx.flash(ctx.caster, 0xffd2d2, 1.4, 0.14);
        fx.beam(ctx.caster, far, 0xff5252, { width: 0.24, dur: 0.2 });
        fx.beam(ctx.caster, far, 0xffffff, { width: 0.08, dur: 0.45 });
        for (const t of hits) {
            fx.burst(t, {
                count: 12,
                color: [0xff5252, 0xffffff],
                dir: dirTo(ctx.caster, t),
                spread: 0.5,
                speed: [4, 8],
                size: [0.16, 0.02],
                life: [0.15, 0.35],
            });
        }
        fx.shake(0.09, 0.2);
    },

    aura(fx, ctx) {
        const c = ctx.caster;
        fx.ringWave(c, 0xfff59d, { r1: 2.4, dur: 0.6 });
        fx.delay(0.2, () => fx.ringWave(c, 0xfff59d, { r1: 2.4, dur: 0.6 }));
        fx.vortex(c, 0xfff59d, { radius: 1.6, count: 30, inward: false });
        fx.decal(c, 0xfff59d, { radius: 1.6, dur: 1.6 });
    },

    hook(fx, ctx) {
        const t = primary(ctx);
        fx.projectile(ctx.caster, t, {
            dur: 0.18,
            color: 0xff8a65,
            size: 0.3,
            onArrive: () => {
                fx.flash(t, 0xff8a65, 1.4, 0.2);
                fx.burst(t, { count: 10, color: 0xff8a65, speed: [2, 4] });
                fx.beam(t, ctx.caster, 0xff8a65, { width: 0.2, dur: 0.35 });
                fx.stream(t, ctx.caster, 0xff8a65, { dur: 0.3, rate: 60 });
            },
        });
    },

    cleanse(fx, ctx) {
        for (const t of ctx.targets.length ? ctx.targets : [ctx.caster]) {
            fx.dome(t, 0xffffff, { radius: 1.1, dur: 0.4 });
            risingSparkles(fx, t, 0xffffff, 16);
            fx.flash(t, 0xffffff, 1.4, 0.3);
        }
    },

    overcharge(fx, ctx) {
        const c = ctx.caster;
        fx.pillar(c, 0xffee58, { radius: 0.4, height: 2.8, dur: 0.45 });
        crackle(fx, c, 0xffee58, 6);
        fx.flash(c, 0xfff9c4, 1.8, 0.3);
        fx.ringWave(c, 0xffee58, { r1: 1.3, dur: 0.35 });
    },

    bastion(fx, ctx) {
        const t = primary(ctx);
        bladeHit(fx, ctx.caster, t, 0x90caf9);
        fx.dome(ctx.caster, 0x90caf9, { radius: 1.3, dur: 0.5 });
        fx.ringWave(ctx.caster, 0x90caf9, { r1: 1.5, dur: 0.4 });
    },

    ram(fx, ctx) {
        const hits = ctx.targets.length ? ctx.targets : [primary(ctx)];
        const far = hits[hits.length - 1];
        fx.beam(ctx.caster, far, 0xff7043, { width: 0.32, dur: 0.28 });
        for (const t of hits) {
            fx.burst(t, {
                count: 14,
                color: [0xff7043, 0xffc16b],
                dir: dirTo(ctx.caster, t),
                spread: 0.6,
                speed: [4, 8],
                size: [0.22, 0.04],
            });
            fx.flash(t, 0xff7043, 1.4, 0.18);
        }
        fx.ringWave(far, 0xff7043, { r1: 1.6, dur: 0.4 });
        fx.shake(0.14, 0.3);
    },

    scorch(fx, ctx) {
        const hits = ctx.targets.length ? ctx.targets : [ctx.caster];
        fx.flash(ctx.caster, 0xff5722, 1.8, 0.25);
        fx.ringWave(ctx.caster, 0xff5722, { r1: 2.2, dur: 0.45 });
        for (const t of hits) {
            fx.burst(t, {
                count: 18,
                color: [0xffab40, 0xff5722, 0xd84315],
                endColor: 0x4e1500,
                dir: UP,
                spread: 1.0,
                speed: [1, 3],
                gravity: -0.8,
                size: [0.28, 0.06],
                life: [0.4, 0.9],
                origin: 0.35,
            });
            fx.decal(t, 0xff5722, { radius: 0.8, dur: 2.4 });
            fx.delay(0.15, () => fx.flash(t, 0xffab40, 0.9, 0.2));
        }
    },

    reap(fx, ctx) {
        const c = ctx.caster;
        fx.slashArc(c, 0, 0xd50000, {
            radius: 1.7,
            arc: Math.PI * 2,
            dur: 0.32,
            tilt: 0.12,
            y: 0.7,
        });
        fx.ringWave(c, 0xd50000, { r1: 2.0, dur: 0.4 });
        fx.burst(c, {
            count: 22,
            color: [0xd50000, 0x4a0000],
            speed: [3, 5.5],
            gravity: 2,
            size: [0.22, 0.04],
        });
        fx.shake(0.09, 0.25);
    },

    rally(fx, ctx) {
        fx.pillar(ctx.caster, 0xffd740, { radius: 0.42, height: 3, dur: 0.5 });
        fx.ringWave(ctx.caster, 0xffd740, { r1: 2.2, dur: 0.5 });
        for (const t of ctx.targets)
            fx.delay(0.15, () => risingSparkles(fx, t, 0xffd740, 14));
    },

    empower(fx, ctx) {
        const t = primary(ctx);
        fx.pillar(t, 0xff1744, { radius: 0.34, height: 2.8, dur: 0.5 });
        fx.burst(new THREE.Vector3(t.x, 0.3, t.z), {
            count: 20,
            color: [0xff1744, 0xff8a80],
            dir: UP,
            spread: 0.4,
            speed: [1.6, 3],
            gravity: -2,
            size: [0.18, 0.03],
            life: [0.5, 0.9],
            origin: 0.4,
        });
        fx.flash(t, 0xff8a80, 1.4, 0.3);
    },

    well(fx, ctx) {
        const c = ctx.caster;
        fx.flash(c, 0x9575ff, 1.8, 0.4);
        fx.vortex(c, 0xb39dff, { radius: 2.4, count: 70, inward: true });
        fx.ringWave(c, 0x9575ff, { r0: 2.6, r1: 0.2, dur: 0.4 });
        fx.delay(0.2, () =>
            fx.ringWave(c, 0xb39dff, { r0: 2.2, r1: 0.2, dur: 0.3 }),
        );
        fx.delay(0.35, () => {
            fx.flash(c, 0xd1c4ff, 2.6, 0.3);
            fx.dome(c, 0x9575ff, { radius: 1.4, dur: 0.35 });
            fx.shake(0.1, 0.25);
        });
    },

    chain(fx, ctx) {
        const hops = ctx.targets.length ? ctx.targets : [primary(ctx)];
        let from = ctx.caster;
        hops.forEach((t, i) => {
            const start = from;
            fx.delay(i * 0.14, () => {
                fx.bolt(start, t, 0x40c4ff, { thickness: 0.12 });
                fx.flash(t, 0xb3e8ff, 1.5, 0.18);
                fx.burst(t, {
                    count: 8,
                    color: [0x40c4ff, 0xffffff],
                    speed: [2, 4],
                    size: [0.14, 0.02],
                    life: [0.15, 0.3],
                });
            });
            from = t;
        });
    },

    feast(fx, ctx) {
        const t = primary(ctx);
        const yaw = yawTo(ctx.caster, t);
        // Closing jaws: mirrored crescents biting together.
        fx.slashArc(t, yaw, 0xc62828, { dur: 0.2, tilt: 1.1, dir: 1 });
        fx.slashArc(t, yaw, 0xc62828, { dur: 0.2, tilt: -1.1, dir: -1 });
        fx.flash(t, 0xc62828, 1.3, 0.18);
        fx.stream(t, ctx.caster, 0xc62828, { dur: 0.4, rate: 45 });
    },

    fortify(fx, ctx) {
        const c = ctx.caster;
        fx.dome(c, 0xb0bec5, { radius: 1.3, dur: 0.5 });
        fx.ringWave(c, 0xb0bec5, { r1: 1.8, dur: 0.4 });
        fx.flash(c, 0xeceff1, 1.6, 0.25);
        fx.burst(c, {
            count: 14,
            color: 0xb0bec5,
            dir: UP,
            spread: 1.2,
            speed: [1, 2.5],
            gravity: 3,
            size: [0.2, 0.05],
        });
    },

    shockwave(fx, ctx) {
        const c = ctx.caster;
        fx.flash(new THREE.Vector3(c.x, 0.5, c.z), 0xffb74d, 2.6, 0.2);
        fx.ringWave(c, 0xffb74d, { r1: 3.0, dur: 0.5 });
        fx.delay(0.1, () => fx.ringWave(c, 0xffe0b2, { r1: 3.0, dur: 0.45 }));
        fx.decal(c, 0xffb74d, { radius: 1.4, dur: 1.4 });
        fx.burst(new THREE.Vector3(c.x, 0.2, c.z), {
            count: 34,
            color: [0xffb74d, 0x8d6e63],
            dir: UP,
            spread: 1.1,
            speed: [2, 4.5],
            gravity: 2.5,
            size: [0.34, 0.08],
            origin: 0.6,
        });
        fx.shake(0.18, 0.35);
    },

    mark(fx, ctx) {
        const t = primary(ctx);
        // Contracting targeting reticle.
        fx.ringWave(t, 0xff3b57, { r0: 1.8, r1: 0.45, dur: 0.35 });
        fx.delay(0.18, () =>
            fx.ringWave(t, 0xff3b57, { r0: 1.2, r1: 0.4, dur: 0.25 }),
        );
        fx.delay(0.3, () => {
            fx.flash(t, 0xff6b7f, 2.2, 0.25);
            fx.bolt(ctx.caster, t, 0xff3b57, {
                jitter: 0.15,
                thickness: 0.12,
                dur: 0.22,
            });
        });
    },

    phalanx(fx, ctx) {
        for (const t of ctx.targets.length ? ctx.targets : [ctx.caster]) {
            fx.dome(t, 0xffb300, { radius: 1.0, dur: 0.5 });
            fx.flash(t, 0xffe082, 1.2, 0.25);
        }
        fx.ringWave(ctx.caster, 0xffb300, { r1: 1.8, dur: 0.45 });
    },

    devour(fx, ctx) {
        const t = primary(ctx);
        const yaw = yawTo(ctx.caster, t);
        fx.slashArc(t, yaw, 0x6a1b9a, {
            radius: 1.2,
            dur: 0.22,
            tilt: 1.1,
            dir: 1,
        });
        fx.slashArc(t, yaw, 0x9c4dcc, {
            radius: 1.2,
            dur: 0.22,
            tilt: -1.1,
            dir: -1,
        });
        fx.vortex(t, 0x6a1b9a, { radius: 1.0, count: 22, inward: true });
        fx.delay(0.2, () =>
            fx.stream(t, ctx.caster, 0x9c4dcc, { dur: 0.35, rate: 50 }),
        );
    },

    gauntlet(fx, ctx) {
        const c = ctx.caster;
        crackle(fx, c, 0xffea00, 5);
        fx.flash(c, 0xffff8d, 1.6, 0.25);
        fx.ringWave(c, 0xffea00, { r1: 1.4, dur: 0.35 });
    },

    guillotine(fx, ctx) {
        const t = primary(ctx);
        const sky = new THREE.Vector3(t.x, t.y + 6, t.z);
        fx.beam(sky, t, 0xff1744, { width: 0.4, dur: 0.2 });
        fx.delay(0.08, () => {
            fx.flash(t, 0xff1744, 2.0, 0.25);
            fx.slashArc(t, 0, 0xff1744, { radius: 1.2, dur: 0.2, tilt: 0.1 });
            fx.burst(t, {
                count: 18,
                color: [0xff1744, 0xffffff],
                speed: [3, 6],
                gravity: 4,
                size: [0.2, 0.03],
            });
            fx.shake(0.14, 0.3);
        });
    },

    rush(fx, ctx) {
        const hits = ctx.targets.length ? ctx.targets : [primary(ctx)];
        const far = hits[hits.length - 1];
        fx.beam(ctx.caster, far, 0x80d8ff, { width: 0.22, dur: 0.3 });
        // Afterimages along the dash path.
        for (let i = 1; i <= 3; i++) {
            const p = ctx.caster.clone().lerp(far, i / 4);
            fx.delay(i * 0.05, () => fx.flash(p, 0x80d8ff, 1.1, 0.2));
        }
        hits.forEach((t, i) =>
            fx.delay(i * 0.06, () =>
                bladeHit(fx, ctx.caster, t, 0x80d8ff, 0.9),
            ),
        );
        fx.shake(0.08, 0.2);
    },

    valkyrie(fx, ctx) {
        fx.pillar(ctx.caster, 0xffe57f, { radius: 0.5, height: 3.6, dur: 0.6 });
        fx.dome(ctx.caster, 0xffe57f, { radius: 2.2, dur: 0.55 });
        for (const t of ctx.targets)
            fx.delay(0.2, () => risingSparkles(fx, t, 0xffe57f, 12));
        fx.ringWave(ctx.caster, 0xffe57f, { r1: 2.6, dur: 0.55 });
    },

    transcend(fx, ctx) {
        const c = ctx.caster;
        fx.pillar(c, 0xffffff, { radius: 0.4, height: 4.5, dur: 0.65 });
        // Ascending halos climbing the pillar set it apart from valkyrie.
        for (let i = 0; i < 4; i++) {
            fx.delay(0.1 + i * 0.12, () =>
                fx.ringWave(c, 0xfff8e1, {
                    r0: 1.6,
                    r1: 0.5,
                    dur: 0.35,
                    y: 0.4 + i * 0.75,
                }),
            );
        }
        fx.flash(new THREE.Vector3(c.x, 2.2, c.z), 0xffffff, 3, 0.5);
        risingSparkles(fx, c, 0xffecb3, 26);
    },

    emp(fx, ctx) {
        const c = ctx.caster;
        fx.flash(new THREE.Vector3(c.x, c.y + 2, c.z), 0x448aff, 5, 0.3);
        fx.ringWave(c, 0x448aff, { r1: 4.2, dur: 0.55 });
        ctx.targets.forEach((t, i) =>
            fx.delay(i * 0.05, () => {
                fx.bolt(c, t, 0x448aff, { thickness: 0.1 });
                fx.flash(t, 0x82b1ff, 1.2, 0.2);
            }),
        );
        fx.shake(0.12, 0.35);
    },

    mimic(fx, ctx) {
        const c = ctx.caster;
        fx.flash(c, 0xe040fb, 1.6, 0.2);
        fx.delay(0.12, () => fx.flash(c, 0x80d8ff, 1.6, 0.2));
        fx.burst(c, {
            count: 24,
            color: [0xe040fb, 0x80d8ff, 0xffe57f],
            speed: [1.5, 3.5],
            gravity: -0.5,
            size: [0.2, 0.04],
            life: [0.4, 0.8],
        });
        fx.dome(c, 0xe040fb, { radius: 1.2, dur: 0.35 });
    },
};

/** Every ability kind with a bespoke choreography (dev FX-lab cycling). */
export const ABILITY_FX_KINDS = Object.keys(CHOREO) as AbilityKind[];

/**
 * Plays the bespoke VFX composition for one ability cast.
 *
 * @param fx - Engine to draw with.
 * @param kind - The ability kind being cast (unknown kinds are ignored).
 * @param ctx - Caster/target positions for this cast.
 *
 * @example
 * playAbilityFx(fx, 'nova', { caster: pos, targets: hitPositions });
 */
export function playAbilityFx(
    fx: FxEngine,
    kind: string,
    ctx: AbilityFxContext,
): void {
    (CHOREO as Partial<Record<string, Choreo>>)[kind]?.(fx, ctx);
}

// ── Shared combat effects ───────────────────────────────────────────────

/**
 * Basic-attack effect: a glowing projectile for ranged attacks, a quick
 * arc slash for melee.
 *
 * @param fx - Engine to draw with.
 * @param from - Attacker anchor.
 * @param to - Target anchor.
 * @param ranged - Whether the attack is ranged.
 * @param color - Team accent color.
 */
export function attackFx(
    fx: FxEngine,
    from: THREE.Vector3,
    to: THREE.Vector3,
    ranged: boolean,
    color: number,
): void {
    if (ranged) {
        const dist = from.distanceTo(to);
        fx.projectile(from, to, {
            dur: Math.min(0.3, 0.05 + dist * 0.03),
            color,
            size: 0.22,
        });
    } else {
        fx.slashArc(to, yawTo(from, to), color, {
            radius: 0.7,
            dur: 0.15,
            tilt: 0.6,
        });
    }
}

/**
 * Damage-taken effect: directional sparks away from the attacker; crits
 * and big hits get a hot white flash.
 *
 * @param fx - Engine to draw with.
 * @param pos - Victim anchor.
 * @param from - Attacker anchor (spark direction), or null for untyped hits.
 * @param heavy - Whether this was a crit or unusually large hit.
 */
export function hitFx(
    fx: FxEngine,
    pos: THREE.Vector3,
    from: THREE.Vector3 | null,
    heavy: boolean,
): void {
    fx.burst(pos, {
        count: heavy ? 14 : 7,
        color: heavy ? [0xffffff, 0xffd23f] : 0xffc16b,
        dir: from ? dirTo(from, pos) : undefined,
        spread: 0.8,
        speed: heavy ? [3, 7] : [2, 4.5],
        size: [heavy ? 0.2 : 0.14, 0.03],
        life: [0.15, 0.35],
    });
    if (heavy) fx.flash(pos, 0xffffff, 1.2, 0.14);
}

/**
 * Unit-death effect: layered explosion with lingering smoke and a shake.
 *
 * @param fx - Engine to draw with.
 * @param pos - Dying unit's anchor.
 * @param color - Team accent color.
 */
export function deathFx(fx: FxEngine, pos: THREE.Vector3, color: number): void {
    explosion(fx, pos, [0xffffff, color], 1.0);
    fx.burst(pos, {
        count: 12,
        color: 0x555555,
        endColor: 0x111111,
        speed: [0.5, 1.5],
        gravity: -0.6,
        drag: 1.5,
        size: [0.35, 0.5],
        life: [0.7, 1.2],
        origin: 0.3,
    });
    fx.shake(0.07, 0.25);
}

/**
 * Heal-received effect: soft green sparkle rise.
 *
 * @param fx - Engine to draw with.
 * @param pos - Healed unit's anchor.
 */
export function healFx(fx: FxEngine, pos: THREE.Vector3): void {
    risingSparkles(fx, pos, 0x69f0ae, 10);
}

/**
 * Shield-gained effect: brief protective dome.
 *
 * @param fx - Engine to draw with.
 * @param pos - Shielded unit's anchor.
 */
export function shieldFx(fx: FxEngine, pos: THREE.Vector3): void {
    fx.dome(pos, 0x7fd8ff, { radius: 0.95, dur: 0.4 });
    fx.flash(pos, 0xbfeaff, 1.1, 0.25);
}

/**
 * Revive effect: golden pillar and ring.
 *
 * @param fx - Engine to draw with.
 * @param pos - Revived unit's anchor.
 */
export function reviveFx(fx: FxEngine, pos: THREE.Vector3): void {
    fx.pillar(pos, 0xffd740, { radius: 0.4, height: 3.2, dur: 0.6 });
    fx.ringWave(pos, 0xffd740, { r1: 1.8, dur: 0.5 });
    risingSparkles(fx, pos, 0xffd740, 18);
}

/**
 * Token-spawn effect: teal materialization swirl.
 *
 * @param fx - Engine to draw with.
 * @param pos - Spawned unit's anchor.
 */
export function summonSpawnFx(fx: FxEngine, pos: THREE.Vector3): void {
    fx.vortex(pos, 0x64ffda, { radius: 0.9, count: 20, inward: true });
    fx.delay(0.2, () => fx.flash(pos, 0xd9fff4, 1.3, 0.2));
}
