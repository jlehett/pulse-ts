/**
 * @packageDocumentation
 * Visual effects for Pulse TS — particle systems and animated values.
 *
 * Features:
 * - **`installParticles`** — world-level service for shared particle pools
 * - **`useParticleBurst`** — declarative one-shot burst from any node
 * - **`useParticleEmitter`** — declarative continuous emitter tied to node position
 * - **`useParticles`** — low-level callback-driven emitter (escape hatch)
 * - Per-particle position, velocity, color, opacity, size, and userData
 * - Three.js Points rendering with custom shader
 *
 * Quick start (convenience hooks)
 * ```ts
 * import { installParticles, useParticleBurst } from '@pulse-ts/effects';
 *
 * // Root node — install once
 * function RootNode() {
 *     installParticles();
 * }
 *
 * // Any descendant — self-contained burst
 * function CollectibleNode() {
 *     const burst = useParticleBurst({
 *         count: 24, lifetime: 0.5, color: 0xf4d03f,
 *         speed: [1.5, 4], gravity: 9.8,
 *     });
 *     // On pickup: burst([x, y, z]);
 * }
 * ```
 *
 * Quick start (low-level)
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
