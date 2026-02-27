import { ParticlePool } from './ParticlePool';
import type { Particle, Point3 } from './ParticlePool';

// ---------------------------------------------------------------------------
// Burst & lifecycle
// ---------------------------------------------------------------------------

describe('ParticlePool — burst & lifecycle', () => {
    test('burst spawns the requested number of particles', () => {
        const pool = new ParticlePool({ maxCount: 50 });
        pool.burst(10);
        expect(pool.aliveCount).toBe(10);
    });

    test('burst clamps to maxCount when pool is full', () => {
        const pool = new ParticlePool({ maxCount: 5 });
        pool.burst(20);
        expect(pool.aliveCount).toBe(5);
    });

    test('burst sets particle position when provided', () => {
        const pool = new ParticlePool({ maxCount: 10 });
        const pos: Point3 = [3, 7, -2];
        pool.burst(1, pos);

        const p = pool.particles.find((p) => p.alive)!;
        expect(p.position.x).toBe(3);
        expect(p.position.y).toBe(7);
        expect(p.position.z).toBe(-2);
    });

    test('burst defaults position to origin when not provided', () => {
        const pool = new ParticlePool({ maxCount: 10 });
        pool.burst(1);

        const p = pool.particles.find((p) => p.alive)!;
        expect(p.position.x).toBe(0);
        expect(p.position.y).toBe(0);
        expect(p.position.z).toBe(0);
    });

    test('particles are recycled after dying', () => {
        const pool = new ParticlePool({
            maxCount: 5,
            init: (p) => {
                p.lifetime = 0.1;
            },
        });

        pool.burst(5);
        expect(pool.aliveCount).toBe(5);

        // Tick past lifetime
        pool.tick(0.2);
        expect(pool.aliveCount).toBe(0);

        // Can respawn into the same slots
        pool.burst(3);
        expect(pool.aliveCount).toBe(3);
    });

    test('particles despawn when age >= lifetime', () => {
        const pool = new ParticlePool({
            maxCount: 10,
            init: (p) => {
                p.lifetime = 0.5;
            },
        });

        pool.burst(5);
        pool.tick(0.3);
        expect(pool.aliveCount).toBe(5);

        pool.tick(0.25);
        expect(pool.aliveCount).toBe(0);
    });

    test('reset clears particle state between reuses', () => {
        const pool = new ParticlePool({
            maxCount: 1,
            init: (p) => {
                p.lifetime = 0.1;
                p.userData.tag = 'first';
            },
        });

        pool.burst(1);
        const p = pool.particles[0];
        expect(p.userData.tag).toBe('first');

        pool.tick(0.2); // dies

        pool.init = (p) => {
            p.lifetime = 1;
        };
        pool.burst(1);
        expect(p.userData).toEqual({}); // reset clears userData
        expect(p.opacity).toBe(1);
        expect(p.size).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Init callback
// ---------------------------------------------------------------------------

describe('ParticlePool — init callback', () => {
    test('init callback is invoked for each spawned particle', () => {
        const initFn = jest.fn<void, [Particle]>();
        const pool = new ParticlePool({ maxCount: 10, init: initFn });

        pool.burst(5);
        expect(initFn).toHaveBeenCalledTimes(5);
    });

    test('init callback can set velocity, color, lifetime, size', () => {
        const pool = new ParticlePool({
            maxCount: 5,
            init: (p) => {
                p.velocity.set(1, 2, 3);
                p.color.set(0xff0000);
                p.lifetime = 2.5;
                p.size = 0.5;
            },
        });

        pool.burst(1);
        const p = pool.particles.find((p) => p.alive)!;
        expect(p.velocity.x).toBe(1);
        expect(p.velocity.y).toBe(2);
        expect(p.velocity.z).toBe(3);
        expect(p.color.r).toBe(1);
        expect(p.color.g).toBe(0);
        expect(p.color.b).toBe(0);
        expect(p.lifetime).toBe(2.5);
        expect(p.size).toBe(0.5);
    });

    test('per-burst initOverride takes precedence over pool init', () => {
        const poolInit = jest.fn<void, [Particle]>();
        const burstInit = jest.fn<void, [Particle]>();

        const pool = new ParticlePool({ maxCount: 10, init: poolInit });
        pool.burst(3, undefined, burstInit);

        expect(poolInit).not.toHaveBeenCalled();
        expect(burstInit).toHaveBeenCalledTimes(3);
    });
});

// ---------------------------------------------------------------------------
// Update callback & velocity integration
// ---------------------------------------------------------------------------

describe('ParticlePool — update & integration', () => {
    test('velocity is auto-integrated into position each tick', () => {
        const pool = new ParticlePool({
            maxCount: 1,
            init: (p) => {
                p.velocity.set(10, 0, 0);
                p.lifetime = 5;
            },
        });

        pool.burst(1);
        pool.tick(0.1);

        const p = pool.particles[0];
        expect(p.position.x).toBeCloseTo(1.0);
        expect(p.position.y).toBe(0);
        expect(p.position.z).toBe(0);
    });

    test('update callback is called after velocity integration', () => {
        const positions: number[] = [];
        const pool = new ParticlePool({
            maxCount: 1,
            init: (p) => {
                p.velocity.set(10, 0, 0);
                p.lifetime = 5;
            },
            update: (p) => {
                // By the time update runs, position should already reflect velocity
                positions.push(p.position.x);
            },
        });

        pool.burst(1);
        pool.tick(0.1);

        // Should be ~1.0 (10 * 0.1), NOT 0
        expect(positions[0]).toBeCloseTo(1.0);
    });

    test('update callback receives dt', () => {
        const dts: number[] = [];
        const pool = new ParticlePool({
            maxCount: 1,
            init: (p) => {
                p.lifetime = 5;
            },
            update: (_p, dt) => {
                dts.push(dt);
            },
        });

        pool.burst(1);
        pool.tick(0.016);
        pool.tick(0.033);

        expect(dts).toEqual([0.016, 0.033]);
    });

    test('update callback can apply gravity', () => {
        const pool = new ParticlePool({
            maxCount: 1,
            init: (p) => {
                p.velocity.set(0, 10, 0);
                p.lifetime = 5;
            },
            update: (p, dt) => {
                p.velocity.y -= 9.8 * dt;
            },
        });

        pool.burst(1);
        // 100 steps of 0.01s = 1 second
        for (let i = 0; i < 100; i++) pool.tick(0.01);

        const p = pool.particles[0];
        // After 1s: vy ≈ 10 - 9.8 = 0.2, y ≈ 10*1 - 0.5*9.8*1 = 5.1
        expect(p.position.y).toBeGreaterThan(4);
        expect(p.position.y).toBeLessThan(6);
    });

    test('dead particles are not updated', () => {
        const updateFn = jest.fn<void, [Particle, number]>();
        const pool = new ParticlePool({
            maxCount: 5,
            init: (p) => {
                p.lifetime = 0.05;
            },
            update: updateFn,
        });

        pool.burst(2);
        pool.tick(0.1); // all die
        updateFn.mockClear();

        pool.tick(0.1);
        expect(updateFn).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Continuous emission
// ---------------------------------------------------------------------------

describe('ParticlePool — continuous emission', () => {
    test('emitting at a rate spawns particles over time', () => {
        const pool = new ParticlePool({
            maxCount: 100,
            init: (p) => {
                p.lifetime = 10;
            },
        });

        pool.rate = 50; // 50 particles/second
        pool.emitting = true;

        pool.tick(0.1); // 50 * 0.1 = 5 particles
        expect(pool.aliveCount).toBe(5);

        pool.tick(0.1);
        expect(pool.aliveCount).toBe(10);
    });

    test('fractional accumulation prevents particle loss', () => {
        const pool = new ParticlePool({
            maxCount: 100,
            init: (p) => {
                p.lifetime = 10;
            },
        });

        pool.rate = 3; // 3 particles/second
        pool.emitting = true;

        // 10 ticks of 0.1s = 1.0s total → expect 3 particles
        for (let i = 0; i < 10; i++) pool.tick(0.1);
        expect(pool.aliveCount).toBe(3);
    });

    test('setting emitting=false stops emission', () => {
        const pool = new ParticlePool({
            maxCount: 100,
            init: (p) => {
                p.lifetime = 10;
            },
        });

        pool.rate = 50;
        pool.emitting = true;
        pool.tick(0.1);
        expect(pool.aliveCount).toBe(5);

        pool.emitting = false;
        pool.tick(0.1);
        expect(pool.aliveCount).toBe(5); // no new particles
    });

    test('rate=0 with emitting=true spawns nothing', () => {
        const pool = new ParticlePool({
            maxCount: 100,
            init: (p) => {
                p.lifetime = 10;
            },
        });

        pool.rate = 0;
        pool.emitting = true;
        pool.tick(1.0);
        expect(pool.aliveCount).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// Vec3Mut & ColorMut helpers
// ---------------------------------------------------------------------------

describe('ParticlePool — Vec3Mut helpers', () => {
    test('randomDirection produces unit vectors', () => {
        const pool = new ParticlePool({ maxCount: 1 });
        pool.burst(1);
        const p = pool.particles[0];

        p.velocity.randomDirection();
        const len = Math.sqrt(
            p.velocity.x ** 2 + p.velocity.y ** 2 + p.velocity.z ** 2,
        );
        expect(len).toBeCloseTo(1.0, 5);
    });

    test('scale multiplies all components', () => {
        const pool = new ParticlePool({ maxCount: 1 });
        pool.burst(1);
        const p = pool.particles[0];

        p.velocity.set(1, 2, 3).scale(2);
        expect(p.velocity.x).toBe(2);
        expect(p.velocity.y).toBe(4);
        expect(p.velocity.z).toBe(6);
    });

    test('set/randomDirection/scale are chainable', () => {
        const pool = new ParticlePool({ maxCount: 1 });
        pool.burst(1);
        const p = pool.particles[0];

        const result = p.velocity.randomDirection().scale(5);
        expect(result).toBe(p.velocity);

        const len = Math.sqrt(
            p.velocity.x ** 2 + p.velocity.y ** 2 + p.velocity.z ** 2,
        );
        expect(len).toBeCloseTo(5.0, 5);
    });
});

describe('ParticlePool — ColorMut', () => {
    test('set(hex) decodes RGB channels correctly', () => {
        const pool = new ParticlePool({ maxCount: 1 });
        pool.burst(1);
        const p = pool.particles[0];

        p.color.set(0x336699);
        expect(p.color.r).toBeCloseTo(0x33 / 255);
        expect(p.color.g).toBeCloseTo(0x66 / 255);
        expect(p.color.b).toBeCloseTo(0x99 / 255);
    });

    test('set(0xff0000) produces pure red', () => {
        const pool = new ParticlePool({ maxCount: 1 });
        pool.burst(1);
        const p = pool.particles[0];

        p.color.set(0xff0000);
        expect(p.color.r).toBe(1);
        expect(p.color.g).toBe(0);
        expect(p.color.b).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// userData
// ---------------------------------------------------------------------------

describe('ParticlePool — userData', () => {
    test('userData is available for arbitrary per-particle storage', () => {
        const pool = new ParticlePool({
            maxCount: 1,
            init: (p) => {
                p.lifetime = 5;
                p.userData.phase = Math.random();
                p.userData.trail = [];
            },
            update: (p) => {
                (p.userData.trail as number[]).push(p.position.x);
            },
        });

        pool.burst(1);
        pool.tick(0.1);
        pool.tick(0.1);

        const p = pool.particles[0];
        expect(typeof p.userData.phase).toBe('number');
        expect((p.userData.trail as number[]).length).toBe(2);
    });
});
