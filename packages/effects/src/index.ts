/**
 * @packageDocumentation
 * Visual effects for Pulse TS — particle systems and animated values.
 *
 * Features:
 * - Callback-driven particle emitter with per-particle init/update
 * - One-shot burst and continuous emission modes
 * - Per-particle position, velocity, color, opacity, size, and userData
 * - Three.js Points rendering with custom shader
 *
 * Quick start
 * ```ts
 * import { useParticles } from '@pulse-ts/effects';
 *
 * function SparkEmitter() {
 *     const emitter = useParticles({
 *         maxCount: 100,
 *         size: 0.08,
 *         blending: 'additive',
 *         init: (p) => {
 *             p.lifetime = 0.6;
 *             p.velocity.randomDirection().scale(4);
 *             p.color.set(0xf4d03f);
 *         },
 *         update: (p, dt) => {
 *             p.velocity.y -= 9.8 * dt;
 *             p.opacity = 1 - p.age / p.lifetime;
 *         },
 *     });
 *
 *     emitter.burst(20, [1, 2, 0]);
 * }
 * ```
 */
export * from './public';
