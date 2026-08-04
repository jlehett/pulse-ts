import * as THREE from 'three';
import { glowTexture } from './textures';

/**
 * Lightweight VFX engine for battle effects: a pooled GPU point-sprite
 * particle system plus short-lived mesh effects (beams, bolts, rings,
 * pillars, projectiles), a delay scheduler and camera shake.
 *
 * All spawns are fire-and-forget; call {@link FxEngine.update} once per
 * frame and {@link FxEngine.dispose} on teardown.
 */

/** Options for {@link FxEngine.burst}. */
export interface BurstOptions {
    /** Particle count. */
    count?: number;
    /** Start color(s); one is picked per particle. */
    color?: number | number[];
    /** Color to fade toward over the particle's life. */
    endColor?: number;
    /** Speed range in world units/sec. */
    speed?: [number, number];
    /** Cone axis; omitted = uniform sphere. */
    dir?: THREE.Vector3;
    /** Cone half-angle in radians (with `dir`). */
    spread?: number;
    /** Downward acceleration (negative = floats up). */
    gravity?: number;
    /** Velocity damping per second (0..~6). */
    drag?: number;
    /** World-unit size over life [start, end]. */
    size?: [number, number];
    /** Lifetime range in seconds. */
    life?: [number, number];
    /** Spawn-position jitter radius. */
    origin?: number;
}

/** Options for {@link FxEngine.projectile}. */
export interface ProjectileOptions {
    /** Flight time in seconds. */
    dur?: number;
    /** Peak height of the parabolic arc (0 = straight). */
    arc?: number;
    color?: number;
    /** Sprite size in world units. */
    size?: number;
    /** Whether to emit a glow trail while flying. */
    trail?: boolean;
    /** Called when the projectile reaches its destination. */
    onArrive?: () => void;
}

/** Options for {@link FxEngine.bolt}. */
export interface BoltOptions {
    /** Lateral jitter amplitude. */
    jitter?: number;
    /** Tube radius of the outer glow. */
    thickness?: number;
    dur?: number;
}

/** Options for {@link FxEngine.slashArc}. */
export interface SlashOptions {
    /** Outer radius of the crescent. */
    radius?: number;
    /** Arc length in radians. */
    arc?: number;
    dur?: number;
    /** Tilt off the ground plane in radians. */
    tilt?: number;
    /** Height above the ground. */
    y?: number;
    /** Sweep direction: 1 or -1. */
    dir?: number;
}

/** Imperative VFX surface returned by {@link createFxEngine}. */
export interface FxEngine {
    /** Advances all live effects; call once per rendered frame. */
    update(dt: number): void;
    /** Removes every live effect and frees GPU resources. */
    dispose(): void;
    /** Radial glow-particle burst. */
    burst(pos: THREE.Vector3, opts?: BurstOptions): void;
    /** Single soft glow sprite that expands and fades. */
    flash(pos: THREE.Vector3, color: number, size?: number, dur?: number): void;
    /** Expanding ground ring. */
    ringWave(
        pos: THREE.Vector3,
        color: number,
        opts?: { r0?: number; r1?: number; dur?: number; y?: number },
    ): void;
    /** Straight two-layer beam (white core + colored glow). */
    beam(
        from: THREE.Vector3,
        to: THREE.Vector3,
        color: number,
        opts?: { width?: number; dur?: number },
    ): void;
    /** Jagged two-layer lightning bolt. */
    bolt(
        from: THREE.Vector3,
        to: THREE.Vector3,
        color: number,
        opts?: BoltOptions,
    ): void;
    /** Glowing sprite that travels from A to B, optionally arcing. */
    projectile(
        from: THREE.Vector3,
        to: THREE.Vector3,
        opts?: ProjectileOptions,
    ): void;
    /** Sweeping crescent slash centered on a point. */
    slashArc(
        pos: THREE.Vector3,
        yaw: number,
        color: number,
        opts?: SlashOptions,
    ): void;
    /** Vertical column of light. */
    pillar(
        pos: THREE.Vector3,
        color: number,
        opts?: { radius?: number; height?: number; dur?: number },
    ): void;
    /** Expanding translucent hemisphere. */
    dome(
        pos: THREE.Vector3,
        color: number,
        opts?: { radius?: number; dur?: number },
    ): void;
    /** Ring of particles swirling inward (or outward). */
    vortex(
        pos: THREE.Vector3,
        color: number,
        opts?: { radius?: number; count?: number; inward?: boolean },
    ): void;
    /** Slow-fading flat ground stain (scorch marks etc.). */
    decal(
        pos: THREE.Vector3,
        color: number,
        opts?: { radius?: number; dur?: number },
    ): void;
    /** Stream of particles flowing from A to B over a duration. */
    stream(
        from: THREE.Vector3,
        to: THREE.Vector3,
        color: number,
        opts?: { dur?: number; rate?: number },
    ): void;
    /** Runs a callback after a delay (cleared on dispose). */
    delay(seconds: number, fn: () => void): void;
    /** Kicks the camera; amplitude decays over the duration. */
    shake(amount: number, dur?: number): void;
}

const MAX_PARTICLES = 4096;

const VERT = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (1500.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
varying float vAlpha;
varying vec3 vColor;
void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor, vAlpha) * tex;
}`;

interface MeshEffect {
    obj: THREE.Object3D;
    t: number;
    dur: number;
    /** Per-frame animation; k is normalized age [0, 1]. */
    tick?: (k: number, dt: number) => void;
    /** Extra cleanup beyond removing + disposing the object tree. */
    onEnd?: () => void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Disposes every geometry/material below an object. */
function disposeTree(obj: THREE.Object3D): void {
    obj.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (o as THREE.Mesh | THREE.Sprite).material as
            | THREE.Material
            | undefined;
        if (mat) mat.dispose();
    });
}

/**
 * Creates a battle VFX engine parented under the given object.
 *
 * @param parent - Scene object all effects are added to.
 * @param camera - Optional camera used for {@link FxEngine.shake}.
 * @returns The imperative {@link FxEngine} surface.
 *
 * @example
 * const fx = createFxEngine(scene, camera);
 * fx.burst(new THREE.Vector3(0, 1, 0), { color: 0xffa14a });
 * // per frame:
 * fx.update(dt);
 */
export function createFxEngine(
    parent: THREE.Object3D,
    camera?: THREE.Camera | null,
): FxEngine {
    const group = new THREE.Group();
    parent.add(group);

    // ── Particle pool ───────────────────────────────────────────────────
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const alphas = new Float32Array(MAX_PARTICLES);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    const material = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: glowTexture() } },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    group.add(points);

    interface Particle {
        alive: boolean;
        px: number;
        py: number;
        pz: number;
        vx: number;
        vy: number;
        vz: number;
        drag: number;
        gravity: number;
        age: number;
        life: number;
        size0: number;
        size1: number;
        c0: THREE.Color;
        c1: THREE.Color;
    }
    const particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
        alive: false,
        px: 0,
        py: 0,
        pz: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        drag: 0,
        gravity: 0,
        age: 0,
        life: 1,
        size0: 0,
        size1: 0,
        c0: new THREE.Color(),
        c1: new THREE.Color(),
    }));
    let cursor = 0;

    const spawnParticle = (
        pos: THREE.Vector3,
        vel: THREE.Vector3,
        life: number,
        size0: number,
        size1: number,
        color: number,
        endColor: number,
        drag: number,
        gravity: number,
    ) => {
        const p = particles[cursor];
        cursor = (cursor + 1) % MAX_PARTICLES;
        p.alive = true;
        p.px = pos.x;
        p.py = pos.y;
        p.pz = pos.z;
        p.vx = vel.x;
        p.vy = vel.y;
        p.vz = vel.z;
        p.drag = drag;
        p.gravity = gravity;
        p.age = 0;
        p.life = life;
        p.size0 = size0;
        p.size1 = size1;
        p.c0.setHex(color);
        p.c1.setHex(endColor);
    };

    const tmpV = new THREE.Vector3();
    const tmpC = new THREE.Color();

    const updateParticles = (dt: number) => {
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (!p.alive) continue;
            p.age += dt;
            const k = p.age / p.life;
            if (k >= 1) {
                p.alive = false;
                alphas[i] = 0;
                sizes[i] = 0;
                continue;
            }
            const damp = Math.max(0, 1 - p.drag * dt);
            p.vx *= damp;
            p.vy *= damp;
            p.vz *= damp;
            p.vy -= p.gravity * dt;
            p.px += p.vx * dt;
            p.py += p.vy * dt;
            p.pz += p.vz * dt;
            positions[i * 3] = p.px;
            positions[i * 3 + 1] = p.py;
            positions[i * 3 + 2] = p.pz;
            sizes[i] = p.size0 + (p.size1 - p.size0) * k;
            // Quick fade-in, smooth fade-out.
            alphas[i] = Math.min(1, k * 8) * (1 - k);
            tmpC.copy(p.c0).lerp(p.c1, k);
            colors[i * 3] = tmpC.r;
            colors[i * 3 + 1] = tmpC.g;
            colors[i * 3 + 2] = tmpC.b;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.aColor.needsUpdate = true;
        geometry.attributes.aSize.needsUpdate = true;
        geometry.attributes.aAlpha.needsUpdate = true;
    };

    // ── Mesh effects / scheduling / shake ───────────────────────────────
    const effects: MeshEffect[] = [];
    const delayed: { t: number; fn: () => void }[] = [];
    const shakeState = { amp: 0, dur: 0, t: 0 };
    const shakeOffset = new THREE.Vector3();

    const addEffect = (e: MeshEffect) => {
        group.add(e.obj);
        effects.push(e);
    };

    const endEffect = (e: MeshEffect) => {
        e.obj.removeFromParent();
        disposeTree(e.obj);
        e.onEnd?.();
    };

    // toneMapped=false keeps additive glows vivid; the renderer's ACES
    // tone mapping would otherwise compress each layer before blending.
    const additiveMat = (color: number, opacity = 1) =>
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false,
        });

    const fadeMats = (obj: THREE.Object3D, opacity: number) => {
        obj.traverse((o) => {
            const mat = (o as THREE.Mesh).material as
                | THREE.MeshBasicMaterial
                | THREE.SpriteMaterial
                | undefined;
            if (mat) mat.opacity = Math.max(0, opacity);
        });
    };

    const engine: FxEngine = {
        update(dt) {
            updateParticles(dt);
            for (let i = effects.length - 1; i >= 0; i--) {
                const e = effects[i];
                e.t += dt;
                const k = Math.min(1, e.t / e.dur);
                e.tick?.(k, dt);
                if (k >= 1) {
                    endEffect(e);
                    effects.splice(i, 1);
                }
            }
            for (let i = delayed.length - 1; i >= 0; i--) {
                delayed[i].t -= dt;
                if (delayed[i].t <= 0) {
                    const fn = delayed[i].fn;
                    delayed.splice(i, 1);
                    fn();
                }
            }
            if (camera && shakeState.t < shakeState.dur) {
                shakeState.t += dt;
                const falloff = 1 - shakeState.t / shakeState.dur;
                camera.position.sub(shakeOffset);
                if (falloff > 0) {
                    shakeOffset.set(
                        rand(-1, 1) * shakeState.amp * falloff,
                        rand(-1, 1) * shakeState.amp * falloff * 0.6,
                        0,
                    );
                    camera.position.add(shakeOffset);
                } else {
                    shakeOffset.set(0, 0, 0);
                }
            }
        },

        dispose() {
            for (const e of effects) endEffect(e);
            effects.length = 0;
            delayed.length = 0;
            if (camera) camera.position.sub(shakeOffset);
            shakeOffset.set(0, 0, 0);
            geometry.dispose();
            material.dispose();
            group.removeFromParent();
        },

        burst(pos, opts = {}) {
            const {
                count = 16,
                color = 0xffffff,
                endColor,
                speed = [2, 5],
                dir,
                spread = 0.5,
                gravity = 3,
                drag = 1.5,
                size = [0.22, 0.05],
                life = [0.3, 0.6],
                origin = 0.05,
            } = opts;
            const palette = Array.isArray(color) ? color : [color];
            for (let i = 0; i < count; i++) {
                if (dir) {
                    // Random direction within a cone around `dir`.
                    tmpV.set(rand(-1, 1), rand(-1, 1), rand(-1, 1))
                        .normalize()
                        .multiplyScalar(Math.tan(spread))
                        .add(dir.clone().normalize())
                        .normalize();
                } else {
                    tmpV.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
                }
                tmpV.multiplyScalar(rand(speed[0], speed[1]));
                const c = palette[(Math.random() * palette.length) | 0];
                spawnParticle(
                    pos
                        .clone()
                        .add(
                            new THREE.Vector3(
                                rand(-origin, origin),
                                rand(-origin, origin),
                                rand(-origin, origin),
                            ),
                        ),
                    tmpV.clone(),
                    rand(life[0], life[1]),
                    size[0],
                    size[1],
                    c,
                    endColor ?? c,
                    drag,
                    gravity,
                );
            }
        },

        flash(pos, color, size = 1.6, dur = 0.22) {
            const mat = new THREE.SpriteMaterial({
                map: glowTexture(),
                color,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                toneMapped: false,
            });
            const sprite = new THREE.Sprite(mat);
            sprite.position.copy(pos);
            sprite.scale.setScalar(size * 0.4);
            addEffect({
                obj: sprite,
                t: 0,
                dur,
                tick: (k) => {
                    sprite.scale.setScalar(size * (0.4 + 0.6 * k));
                    mat.opacity = 1 - k;
                },
            });
        },

        ringWave(pos, color, opts = {}) {
            // y default clears the raised board tiles (tops at y=0.11).
            const { r0 = 0.25, r1 = 2.1, dur = 0.45, y = 0.14 } = opts;
            const mesh = new THREE.Mesh(
                new THREE.RingGeometry(0.78, 1, 48),
                additiveMat(color, 1),
            );
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(pos.x, y, pos.z);
            mesh.scale.setScalar(r0);
            addEffect({
                obj: mesh,
                t: 0,
                dur,
                tick: (k) => {
                    const e = 1 - (1 - k) * (1 - k); // ease-out
                    mesh.scale.setScalar(r0 + (r1 - r0) * e);
                    (mesh.material as THREE.MeshBasicMaterial).opacity = 1 - k;
                },
            });
        },

        beam(from, to, color, opts = {}) {
            const { width = 0.2, dur = 0.22 } = opts;
            const len = from.distanceTo(to);
            const holder = new THREE.Group();
            const outer = new THREE.Mesh(
                new THREE.BoxGeometry(width, width, 1),
                additiveMat(color, 0.85),
            );
            const inner = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.38, width * 0.38, 1),
                additiveMat(0xffffff, 1),
            );
            holder.add(outer, inner);
            holder.position.copy(from.clone().add(to).multiplyScalar(0.5));
            holder.lookAt(to);
            holder.scale.z = len;
            addEffect({
                obj: holder,
                t: 0,
                dur,
                tick: (k) => {
                    const w = 1 + 0.6 * k;
                    outer.scale.x = w;
                    outer.scale.y = w;
                    fadeMats(holder, 1 - k);
                },
            });
        },

        bolt(from, to, color, opts = {}) {
            const { jitter = 0.4, thickness = 0.13, dur = 0.16 } = opts;
            const dist = from.distanceTo(to);
            const segs = Math.max(4, Math.round(dist * 2.5));
            const dir = to.clone().sub(from).normalize();
            // Any perpendicular basis for lateral displacement.
            const side = new THREE.Vector3(0, 1, 0).cross(dir);
            if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
            side.normalize();
            const up = dir.clone().cross(side).normalize();
            const pts: THREE.Vector3[] = [];
            for (let i = 0; i <= segs; i++) {
                const k = i / segs;
                const p = from.clone().lerp(to, k);
                if (i > 0 && i < segs) {
                    const amp = jitter * Math.sin(Math.PI * k);
                    p.addScaledVector(side, rand(-amp, amp));
                    p.addScaledVector(up, rand(-amp, amp));
                }
                pts.push(p);
            }
            const curve = new THREE.CatmullRomCurve3(pts);
            const holder = new THREE.Group();
            holder.add(
                new THREE.Mesh(
                    new THREE.TubeGeometry(curve, segs * 2, thickness, 5),
                    additiveMat(color, 0.85),
                ),
                new THREE.Mesh(
                    new THREE.TubeGeometry(
                        curve,
                        segs * 2,
                        thickness * 0.45,
                        5,
                    ),
                    additiveMat(0xffffff, 1),
                ),
            );
            addEffect({
                obj: holder,
                t: 0,
                dur,
                tick: (k) => fadeMats(holder, 1 - k * k),
            });
        },

        projectile(from, to, opts = {}) {
            const {
                dur = 0.35,
                arc = 0,
                color = 0xffffff,
                size = 0.34,
                trail = true,
                onArrive,
            } = opts;
            const mat = new THREE.SpriteMaterial({
                map: glowTexture(),
                color,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                toneMapped: false,
            });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.setScalar(size);
            sprite.position.copy(from);
            let arrived = false;
            addEffect({
                obj: sprite,
                t: 0,
                dur,
                tick: (k) => {
                    sprite.position.lerpVectors(from, to, k);
                    sprite.position.y += arc * 4 * k * (1 - k);
                    if (trail && Math.random() < 0.85) {
                        spawnParticle(
                            sprite.position,
                            new THREE.Vector3(
                                rand(-0.3, 0.3),
                                rand(-0.3, 0.3),
                                rand(-0.3, 0.3),
                            ),
                            0.3,
                            size * 0.55,
                            0.02,
                            color,
                            color,
                            0,
                            -0.5,
                        );
                    }
                },
                onEnd: () => {
                    if (!arrived) {
                        arrived = true;
                        onArrive?.();
                    }
                },
            });
        },

        slashArc(pos, yaw, color, opts = {}) {
            const {
                radius = 1.0,
                arc = 2.4,
                dur = 0.24,
                tilt = 0.5,
                y = 0.85,
                dir = 1,
            } = opts;
            const holder = new THREE.Group();
            const mesh = new THREE.Mesh(
                new THREE.RingGeometry(radius * 0.55, radius, 26, 1, 0, arc),
                additiveMat(color, 0.95),
            );
            const edge = new THREE.Mesh(
                new THREE.RingGeometry(
                    radius * 0.92,
                    radius,
                    26,
                    1,
                    0,
                    arc * 0.8,
                ),
                additiveMat(0xffffff, 1),
            );
            holder.add(mesh, edge);
            holder.position.set(pos.x, y, pos.z);
            holder.rotation.y = yaw;
            holder.rotation.x = -Math.PI / 2 + tilt;
            addEffect({
                obj: holder,
                t: 0,
                dur,
                tick: (k) => {
                    holder.rotation.z = dir * (k * arc * 1.4 - arc * 0.7);
                    fadeMats(holder, 1 - k * k);
                },
            });
        },

        pillar(pos, color, opts = {}) {
            const { radius = 0.5, height = 3.2, dur = 0.45 } = opts;
            const holder = new THREE.Group();
            const outer = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    radius,
                    radius * 1.25,
                    1,
                    20,
                    1,
                    true,
                ),
                additiveMat(color, 0.7),
            );
            const inner = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    radius * 0.45,
                    radius * 0.55,
                    1,
                    14,
                    1,
                    true,
                ),
                additiveMat(0xffffff, 0.9),
            );
            holder.add(outer, inner);
            holder.position.set(pos.x, 0, pos.z);
            addEffect({
                obj: holder,
                t: 0,
                dur,
                tick: (k) => {
                    const grow = Math.min(1, k * 4);
                    holder.scale.set(1, grow * height, 1);
                    holder.position.y = (grow * height) / 2;
                    fadeMats(holder, 1 - k * k);
                },
            });
        },

        dome(pos, color, opts = {}) {
            const { radius = 1.6, dur = 0.4 } = opts;
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(
                    1,
                    24,
                    12,
                    0,
                    Math.PI * 2,
                    0,
                    Math.PI / 2,
                ),
                additiveMat(color, 0.4),
            );
            mesh.position.set(pos.x, 0.12, pos.z);
            mesh.scale.setScalar(0.2);
            addEffect({
                obj: mesh,
                t: 0,
                dur,
                tick: (k) => {
                    const e = 1 - (1 - k) * (1 - k);
                    mesh.scale.setScalar(0.2 + (radius - 0.2) * e);
                    (mesh.material as THREE.MeshBasicMaterial).opacity =
                        0.4 * (1 - k);
                },
            });
        },

        vortex(pos, color, opts = {}) {
            const { radius = 1.9, count = 42, inward = true } = opts;
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = radius * rand(0.75, 1.1);
                const px = pos.x + Math.cos(a) * r;
                const pz = pos.z + Math.sin(a) * r;
                const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
                const radial = new THREE.Vector3(
                    Math.cos(a),
                    0,
                    Math.sin(a),
                ).multiplyScalar(inward ? -1 : 1);
                const vel = tangent
                    .multiplyScalar(rand(2.2, 3.4))
                    .addScaledVector(radial, rand(2.4, 3.6));
                vel.y = rand(0.2, 1.1);
                spawnParticle(
                    new THREE.Vector3(px, pos.y + rand(0, 0.5), pz),
                    vel,
                    rand(0.35, 0.55),
                    0.2,
                    0.04,
                    color,
                    color,
                    0.4,
                    inward ? -1 : 2,
                );
            }
        },

        decal(pos, color, opts = {}) {
            const { radius = 0.9, dur = 2.2 } = opts;
            const mesh = new THREE.Mesh(
                new THREE.CircleGeometry(radius, 28),
                additiveMat(color, 0.35),
            );
            mesh.rotation.x = -Math.PI / 2;
            // Sits just above the raised board tiles (tops at y=0.11).
            mesh.position.set(pos.x, 0.13, pos.z);
            addEffect({
                obj: mesh,
                t: 0,
                dur,
                tick: (k) => {
                    (mesh.material as THREE.MeshBasicMaterial).opacity =
                        0.35 * (1 - k);
                },
            });
        },

        stream(from, to, color, opts = {}) {
            const { dur = 0.5, rate = 70 } = opts;
            const dist = from.distanceTo(to);
            const dir = to.clone().sub(from).normalize();
            const speed = Math.max(4, dist / 0.4);
            const holder = new THREE.Group(); // empty timer object
            addEffect({
                obj: holder,
                t: 0,
                dur,
                tick: (_k, dt) => {
                    const n = Math.max(1, Math.round(rate * dt));
                    for (let i = 0; i < n; i++) {
                        const vel = dir
                            .clone()
                            .multiplyScalar(speed * rand(0.85, 1.15));
                        vel.x += rand(-0.6, 0.6);
                        vel.y += rand(-0.3, 0.6);
                        vel.z += rand(-0.6, 0.6);
                        spawnParticle(
                            from
                                .clone()
                                .add(
                                    new THREE.Vector3(
                                        rand(-0.25, 0.25),
                                        rand(-0.15, 0.3),
                                        rand(-0.25, 0.25),
                                    ),
                                ),
                            vel,
                            dist / speed,
                            0.3,
                            0.1,
                            color,
                            color,
                            0,
                            0,
                        );
                    }
                },
            });
        },

        delay(seconds, fn) {
            delayed.push({ t: seconds, fn });
        },

        shake(amount, dur = 0.3) {
            if (amount > shakeState.amp * (1 - shakeState.t / shakeState.dur)) {
                shakeState.amp = amount;
                shakeState.dur = dur;
                shakeState.t = 0;
            }
        },
    };

    return engine;
}
