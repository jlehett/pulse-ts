import * as THREE from 'three';
import {
    useFrameUpdate,
    useService,
    useContext,
    useCooldown,
    type CooldownHandle,
} from '@pulse-ts/core';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';
import { ThreeService } from '@pulse-ts/three';
import { useAxis2D, useAction, usePointer } from '@pulse-ts/input';
import { GameCtx, type RefractionState } from '../../contexts';
import type { ClassDef } from '../../config/classes';
import { REFRACTION_POOL } from '../../config/refractions';
import {
    moveSpherePosition,
    projectToTangent,
    raycastSphere,
    geodesicDirection,
} from '../../utils/sphereMovement';

export interface LocalPlayerProps {
    classDef: ClassDef;
    playerIndex: number;
    sphereRadius: number;
    startPosition: THREE.Vector3;
    playerState: PlayerState;
    refractions: RefractionState;
    getScreenAxes?: () => { right: THREE.Vector3; up: THREE.Vector3 };
    onShoot?: (origin: THREE.Vector3, direction: THREE.Vector3) => void;
    onChargedShot?: (
        origin: THREE.Vector3,
        direction: THREE.Vector3,
        charge: number,
    ) => void;
    onPulse?: (origin: THREE.Vector3) => void;
    onBeam?: (origin: THREE.Vector3, direction: THREE.Vector3) => void;
    onSanctuary?: (origin: THREE.Vector3) => void;
    onSlowField?: (origin: THREE.Vector3) => void;
    onPrismaticBurst?: (origin: THREE.Vector3, damage: number) => void;
    onDashTrail?: (position: THREE.Vector3) => void;
    onPositionUpdate?: (
        position: THREE.Vector3,
        forward: THREE.Vector3,
    ) => void;
}

export interface PlayerState {
    health: number;
    maxHealth: number;
    alive: boolean;
    position: THREE.Vector3;
    forward: THREE.Vector3;
    damageFlash: number;
    invulnerable: boolean;
    invulnerableTimer: number;
    barrierPosition: THREE.Vector3 | null;
    dashTimer: number;
    dashDirection: THREE.Vector3;
    ability1Cooldown: CooldownHandle | null;
    ability2Cooldown: CooldownHandle | null;
}

const MAX_CHARGE_TIME = 1.0;

/**
 * Local player node — handles input, sphere-surface movement,
 * directional aiming, and primary fire.
 */
function getRefVal(refractions: RefractionState, id: string): number {
    const tier = refractions.active.get(id);
    if (tier == null) return 0;
    const def = REFRACTION_POOL.find((r) => r.id === id);
    if (!def) return 0;
    return def.tiers[tier - 1].value;
}

export function LocalPlayerNode(props: LocalPlayerProps) {
    const { classDef, sphereRadius, startPosition, refractions } = props;
    const three = useService(ThreeService);
    useContext(GameCtx);
    const color = classDef.color;

    // Crystal mesh — custom shader for body + emissive edge lines
    const root = useThreeRoot();
    const threeColor = new THREE.Color(color);

    const geometry =
        classDef.shape === 'cube'
            ? new THREE.BoxGeometry(
                  classDef.radius * 1.6,
                  classDef.radius * 1.6,
                  classDef.radius * 1.6,
              )
            : classDef.shape === 'octahedron'
              ? new THREE.OctahedronGeometry(classDef.radius, 0)
              : new THREE.IcosahedronGeometry(classDef.radius, 0);

    // Stretch geometry vertically for a crystal/prism silhouette
    geometry.scale(1, 1.8, 1);

    // Volumetric crystal shader — glows from within, visible facets
    const crystalMat = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: threeColor.clone() },
            uIntensity: { value: 1.0 },
            uDamageFlash: { value: 0.0 },
        },
        vertexShader: /* glsl */ `
            varying vec3 vNormal;
            varying vec3 vViewDir;
            varying vec3 vWorldNormal;
            varying vec3 vLocalPos;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                vLocalPos = position;
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                vViewDir = normalize(-mvPos.xyz);
                gl_Position = projectionMatrix * mvPos;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uIntensity;
            uniform float uDamageFlash;

            varying vec3 vNormal;
            varying vec3 vViewDir;
            varying vec3 vWorldNormal;
            varying vec3 vLocalPos;

            void main() {
                // How much this fragment faces the camera
                float facing = abs(dot(vNormal, vViewDir));

                // Distance from center of geometry (0 at center, 1 at surface)
                float distFromCenter = length(vLocalPos) * 1.8;
                float centerGlow = 1.0 - clamp(distFromCenter, 0.0, 1.0);
                centerGlow = pow(centerGlow, 0.8);

                // Per-face variation from world normal
                vec3 light1 = normalize(vec3(1.0, 2.0, 0.5));
                vec3 light2 = normalize(vec3(-1.5, 0.5, 1.0));
                float facet = 0.5
                    + 0.3 * max(dot(vWorldNormal, light1), 0.0)
                    + 0.2 * max(dot(vWorldNormal, light2), 0.0);

                // Back faces are dimmer (creates depth)
                float sideFactor = gl_FrontFacing ? 1.0 : 0.4;

                // Volumetric glow: blue at center, tinted at surface
                vec3 coreColor = mix(uColor, vec3(0.4, 0.7, 1.0), 0.25) * 2.0;
                vec3 surfaceColor = uColor * 1.2;
                vec3 glowColor = mix(surfaceColor, coreColor, centerGlow);

                vec3 finalColor = glowColor * facet * sideFactor * uIntensity;

                // Edge glow (rim light)
                float rim = 1.0 - facing;
                rim = pow(rim, 2.0);
                finalColor += uColor * rim * 1.2 * uIntensity;

                // Damage flash — shift toward red/white
                finalColor = mix(finalColor, vec3(1.0, 0.2, 0.1) * 2.0, uDamageFlash);

                // Alpha: soft/blurry falloff, overall more opaque
                float alpha = (0.5 + centerGlow * 0.4) * facet * sideFactor;
                alpha *= 0.85 + facing * 0.15;
                alpha += rim * 0.3;
                alpha = max(alpha, uDamageFlash * 0.6);

                gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.9));
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
    });

    const mesh = new THREE.Mesh(geometry, crystalMat);
    useObject3D(mesh);

    // Directional barrier — thin glowing wall held in front of the player
    const barrierMat = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(classDef.color) },
            uOpacity: { value: 0.8 },
            uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
            varying vec3 vNormal;
            varying vec3 vViewDir;
            varying vec2 vUv;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                vViewDir = normalize(-mvPos.xyz);
                vUv = uv;
                gl_Position = projectionMatrix * mvPos;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uOpacity;
            uniform float uTime;
            varying vec3 vNormal;
            varying vec3 vViewDir;
            varying vec2 vUv;
            void main() {
                float rim = 1.0 - abs(dot(vNormal, vViewDir));
                rim = pow(rim, 1.5);
                float scanline = sin(vUv.y * 40.0 + uTime * 4.0) * 0.5 + 0.5;
                float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
                edgeFade *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
                float alpha = (0.3 + rim * 0.5 + scanline * 0.1) * edgeFade * uOpacity;
                vec3 col = uColor * (1.5 + rim * 1.0);
                gl_FragColor = vec4(col, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
    });
    const barrierGeo = new THREE.BoxGeometry(3.0, 2.0, 0.35);
    const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
    barrierMesh.visible = false;
    root.add(barrierMesh);

    // Position on sphere surface
    const position = startPosition.clone();
    const forward = new THREE.Vector3(0, 0, 1);
    const velocity = new THREE.Vector3();

    root.position.copy(position);

    // Input hooks
    const moveInput = useAxis2D('move');
    const fireAction = useAction('fire');
    const ability1Action = useAction('ability1');
    const ability2Action = useAction('ability2');
    const pointer = usePointer();

    const state = props.playerState;
    state.position = position;
    state.forward = forward;

    const fireCooldown = useCooldown(1 / classDef.primaryFireRate);
    const ability1Cooldown = useCooldown(classDef.ability1.cooldown);
    const ability2Cooldown = useCooldown(classDef.ability2.cooldown);
    state.ability1Cooldown = ability1Cooldown;
    state.ability2Cooldown = ability2Cooldown;

    // Lens charge state
    let chargeTime = 0;
    let isCharging = false;

    // Death ragdoll state
    let dead = false;
    let deathTimer = 0;
    const deathAngularVel = new THREE.Vector3();
    const deathVelocity = new THREE.Vector3();
    let deathBounceCount = 0;
    const DEATH_DIM_DURATION = 1.5;

    useFrameUpdate((dt) => {
        if (!state.alive && !dead) {
            dead = true;
            deathTimer = 0;
            barrierMesh.visible = false;
            deathAngularVel.set(
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
            );
            const normal = position.clone().normalize();
            const tangent = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5,
            );
            tangent
                .sub(normal.clone().multiplyScalar(tangent.dot(normal)))
                .normalize();
            deathVelocity.copy(
                normal.clone().multiplyScalar(3).add(tangent.multiplyScalar(2)),
            );
        }

        if (dead) {
            deathTimer += dt;

            // Dim intensity — desaturate toward pale white with gentle pulse
            const dimProgress = Math.min(1, deathTimer / DEATH_DIM_DURATION);
            const pulse = 0.5 + 0.5 * Math.sin(deathTimer * 2.5);
            const baseIntensity = Math.max(0.4, 1.0 - dimProgress * 0.6);
            crystalMat.uniforms.uIntensity.value =
                baseIntensity * (0.8 + pulse * 0.2);
            crystalMat.uniforms.uColor.value
                .copy(threeColor)
                .lerp(new THREE.Color(0.7, 0.75, 0.9), dimProgress * 0.7);
            state.damageFlash = pulse * 0.08;
            crystalMat.uniforms.uDamageFlash.value = Math.max(
                0,
                1.0 - deathTimer * 5,
            );

            // Gravity toward sphere center
            const gravDir = root.position.clone().normalize().negate();
            deathVelocity.addScaledVector(gravDir, 20 * dt);

            // Move
            root.position.addScaledVector(deathVelocity, dt);

            // Bounce off planetoid surface
            const dist = root.position.length();
            const surfaceHeight = sphereRadius + classDef.radius * 1.8;
            if (dist < surfaceHeight) {
                const surfNorm = root.position.clone().normalize();
                root.position.copy(
                    surfNorm.clone().multiplyScalar(surfaceHeight),
                );
                const velDotN = deathVelocity.dot(surfNorm);
                if (velDotN < 0) {
                    const bounce = deathBounceCount < 3 ? 0.3 : 0.0;
                    deathVelocity.addScaledVector(
                        surfNorm,
                        -velDotN * (1 + bounce),
                    );
                    deathVelocity.multiplyScalar(0.6);
                    deathAngularVel.multiplyScalar(0.5);
                    deathBounceCount++;
                }
            }

            // Tumble
            mesh.rotation.x += deathAngularVel.x * dt;
            mesh.rotation.y += deathAngularVel.y * dt;
            mesh.rotation.z += deathAngularVel.z * dt;

            // Keep reporting position for camera
            position.copy(
                root.position.clone().normalize().multiplyScalar(sphereRadius),
            );
            props.onPositionUpdate?.(position, forward);
            return;
        }

        // Damage flash decay
        crystalMat.uniforms.uDamageFlash.value = state.damageFlash;

        // Movement input → screen-relative velocity projected onto tangent plane
        const input = moveInput();
        velocity.set(0, 0, 0);
        if (input.x !== 0 || input.y !== 0) {
            const axes = props.getScreenAxes?.();
            if (axes) {
                const screenRight = axes.right.clone();
                projectToTangent(screenRight, position);
                const screenUp = axes.up.clone();
                projectToTangent(screenUp, position);

                if (screenRight.lengthSq() > 1e-6) screenRight.normalize();
                if (screenUp.lengthSq() > 1e-6) screenUp.normalize();

                velocity
                    .addScaledVector(screenRight, input.x)
                    .addScaledVector(screenUp, input.y);
            }
            if (velocity.lengthSq() > 0) {
                const speedBonus = getRefVal(refractions, 'swift_light');
                velocity
                    .normalize()
                    .multiplyScalar(classDef.moveSpeed * (1 + speedBonus));
            }
        }

        // Move along sphere surface
        if (velocity.lengthSq() > 0) {
            moveSpherePosition(position, velocity, dt, sphereRadius);
        }

        // Overcharge: cut off the tail end of ability cooldowns
        const cdr = getRefVal(refractions, 'overcharge');
        if (cdr > 0) {
            const threshold1 = classDef.ability1.cooldown * cdr;
            if (
                !ability1Cooldown.ready &&
                ability1Cooldown.remaining <= threshold1
            ) {
                ability1Cooldown.reset();
            }
            const threshold2 = classDef.ability2.cooldown * cdr;
            if (
                !ability2Cooldown.ready &&
                ability2Cooldown.remaining <= threshold2
            ) {
                ability2Cooldown.reset();
            }
        }

        // Resonance: cut off tail end of fire cooldown
        const fireRateBonus = getRefVal(refractions, 'resonance');
        if (fireRateBonus > 0) {
            const fireThreshold =
                (1 / classDef.primaryFireRate) * fireRateBonus;
            if (
                !fireCooldown.ready &&
                fireCooldown.remaining <= fireThreshold
            ) {
                fireCooldown.reset();
            }
        }

        // Aiming — raycast mouse onto planetoid sphere
        const ptr = pointer();
        const canvas = three.renderer.domElement;
        const ndcX = (ptr.x / canvas.clientWidth) * 2 - 1;
        const ndcY = -(ptr.y / canvas.clientHeight) * 2 + 1;

        const hit = raycastSphere(three.camera, ndcX, ndcY, sphereRadius);
        if (hit) {
            const aimDir = geodesicDirection(position, hit);
            if (aimDir.lengthSq() > 1e-6) {
                forward.copy(aimDir);
            }
        }

        // Orient crystal upright on sphere (surface normal = local Y)
        const normal = position.clone().normalize();
        const ref =
            Math.abs(normal.y) < 0.99
                ? new THREE.Vector3(0, 1, 0)
                : new THREE.Vector3(1, 0, 0);
        const tangentX = new THREE.Vector3()
            .crossVectors(normal, ref)
            .normalize();
        const tangentZ = new THREE.Vector3()
            .crossVectors(tangentX, normal)
            .normalize();
        const basis = new THREE.Matrix4().makeBasis(tangentX, normal, tangentZ);
        root.quaternion.setFromRotationMatrix(basis);

        root.position.copy(position);
        root.position.addScaledVector(normal, classDef.radius * 1.3);

        // Gentle upright spin with a slight wobble
        mesh.rotation.y += dt * 1.2;
        mesh.rotation.x = Math.sin(mesh.rotation.y * 0.7) * 0.15;
        mesh.rotation.z = Math.cos(mesh.rotation.y * 0.5) * 0.1;

        // Primary fire — class-specific behavior
        const fire = fireAction();

        if (classDef.id === 'shard') {
            if (fire.down && fireCooldown.ready) {
                fireCooldown.trigger();
                props.onShoot?.(position.clone(), forward.clone());
            }
        } else if (classDef.id === 'ward') {
            if (fire.down && fireCooldown.ready) {
                fireCooldown.trigger();
                props.onPulse?.(position.clone());
            }
        } else if (classDef.id === 'lens') {
            if (fire.down) {
                if (!isCharging && fireCooldown.ready) {
                    isCharging = true;
                    chargeTime = 0;
                }
                if (isCharging) {
                    chargeTime = Math.min(chargeTime + dt, MAX_CHARGE_TIME);
                }
            }
            if (fire.released && isCharging) {
                isCharging = false;
                const charge = chargeTime / MAX_CHARGE_TIME;
                fireCooldown.trigger();
                props.onChargedShot?.(
                    position.clone(),
                    forward.clone(),
                    charge,
                );
                chargeTime = 0;
            }
        }

        // Ability 1
        const ab1 = ability1Action();
        if (ab1.pressed && ability1Cooldown.ready) {
            ability1Cooldown.trigger();
            if (classDef.id === 'shard') {
                props.onBeam?.(position.clone(), forward.clone());
            } else if (classDef.id === 'lens') {
                // Prism Split — 3-way spread
                const spreadAngle = Math.PI / 8;
                const up = position.clone().normalize();
                const shootDir = forward.clone();
                for (let i = -1; i <= 1; i++) {
                    const dir = shootDir.clone();
                    if (i !== 0) {
                        dir.applyAxisAngle(up, spreadAngle * i);
                    }
                    props.onShoot?.(position.clone(), dir);
                }
            }
            if (classDef.id === 'ward') {
                state.invulnerable = true;
                state.invulnerableTimer = 3.0;
                barrierMesh.visible = true;
                barrierMat.uniforms.uOpacity.value = 0.8;
                barrierMat.uniforms.uTime.value = 0;
            }

            // Prismatic Burst: AoE on ability use
            const burstDmg = getRefVal(refractions, 'prismatic_burst');
            if (burstDmg > 0) {
                props.onPrismaticBurst?.(position.clone(), burstDmg);
            }

            // Cascade: chance to reset this ability's cooldown
            const cascadeChance = getRefVal(refractions, 'cascade');
            if (cascadeChance > 0 && Math.random() < cascadeChance) {
                ability1Cooldown.reset();
            }
        }

        // Ability 2
        const ab2 = ability2Action();
        if (ab2.pressed && ability2Cooldown.ready) {
            ability2Cooldown.trigger();
            if (classDef.id === 'shard') {
                // Photon Dash — burst forward
                state.dashTimer = 0.35;
                state.dashDirection = forward.clone();
            } else if (classDef.id === 'ward') {
                props.onSanctuary?.(position.clone());
            } else if (classDef.id === 'lens') {
                props.onSlowField?.(position.clone());
            }

            // Prismatic Burst: AoE on ability use
            const burstDmg = getRefVal(refractions, 'prismatic_burst');
            if (burstDmg > 0) {
                props.onPrismaticBurst?.(position.clone(), burstDmg);
            }

            // Cascade: chance to reset this ability's cooldown
            const cascadeChance = getRefVal(refractions, 'cascade');
            if (cascadeChance > 0 && Math.random() < cascadeChance) {
                ability2Cooldown.reset();
            }
        }

        // Process active ability states
        if (state.dashTimer > 0) {
            const dashSpeed = classDef.moveSpeed * 6;
            const dashVel = state.dashDirection
                .clone()
                .multiplyScalar(dashSpeed);
            // Emit trail points along the dash path
            const trailSteps = 4;
            const stepDt = dt / trailSteps;
            for (let s = 0; s < trailSteps; s++) {
                props.onDashTrail?.(position.clone());
                moveSpherePosition(position, dashVel, stepDt, sphereRadius);
            }
            state.dashTimer -= dt;
            const dashProgress = 1 - state.dashTimer / 0.35;
            const stretch = 1 + Math.sin(dashProgress * Math.PI) * 1.5;
            const squish = 1 / Math.sqrt(stretch);
            // Orient mesh so stretch axis aligns with dash direction
            const localDashX = state.dashDirection.dot(tangentX);
            const localDashZ = state.dashDirection.dot(tangentZ);
            const dashAngle = Math.atan2(localDashZ, localDashX);
            mesh.rotation.set(0, 0, 0);
            mesh.rotation.y = -dashAngle;
            mesh.rotation.z = Math.PI / 2;
            mesh.scale.set(squish, stretch, squish);
            crystalMat.uniforms.uIntensity.value = 4.0;
            crystalMat.uniforms.uColor.value
                .copy(threeColor)
                .lerp(new THREE.Color(1, 1, 1), 0.8);
        }
        if (state.invulnerable) {
            state.invulnerableTimer -= dt;
            barrierMat.uniforms.uTime.value += dt;
            // Position barrier in front of player in the aim direction
            const localFwdX = forward.dot(tangentX);
            const localFwdZ = forward.dot(tangentZ);
            const dist = 1.8;
            barrierMesh.position.set(localFwdX * dist, 0.6, localFwdZ * dist);
            barrierMesh.rotation.y =
                -Math.atan2(localFwdZ, localFwdX) + Math.PI / 2;

            // Expose barrier world position for collision
            const bNorm = position.clone().normalize();
            const bWorldFwd = forward
                .clone()
                .sub(bNorm.clone().multiplyScalar(forward.dot(bNorm)))
                .normalize();
            const angle = dist / sphereRadius;
            state.barrierPosition = bNorm
                .clone()
                .multiplyScalar(Math.cos(angle))
                .addScaledVector(bWorldFwd, Math.sin(angle))
                .multiplyScalar(sphereRadius);

            if (state.invulnerableTimer < 0.5) {
                barrierMat.uniforms.uOpacity.value =
                    (state.invulnerableTimer / 0.5) * 0.8;
            }
            if (state.invulnerableTimer <= 0) {
                state.invulnerable = false;
                state.barrierPosition = null;
                barrierMesh.visible = false;
            }
        }

        // Health-based glow intensity + charge/dash overrides
        const healthRatio = state.health / state.maxHealth;
        let intensity = 0.5 + healthRatio * 0.5;
        if (state.dashTimer > 0) {
            // Dash VFX handled above — don't reset
        } else if (isCharging) {
            const charge = chargeTime / MAX_CHARGE_TIME;
            const pulse = 1 + Math.sin(chargeTime * 12) * 0.15 * charge;
            intensity += charge * 3.0 * pulse;
            const scale = 1 + charge * 0.6;
            mesh.scale.set(scale, scale, scale);
            crystalMat.uniforms.uColor.value
                .copy(threeColor)
                .lerp(new THREE.Color(1, 1, 1), charge * 0.5);
        } else {
            mesh.scale.set(1, 1, 1);
            crystalMat.uniforms.uColor.value.copy(threeColor);
        }
        if (state.dashTimer <= 0) {
            crystalMat.uniforms.uIntensity.value = intensity;
        }

        // Report position for camera
        props.onPositionUpdate?.(position, forward);
    });

    return {
        state,
        takeDamage(amount: number) {
            if (state.invulnerable) return;
            state.health = Math.max(0, state.health - amount);
            if (state.health <= 0) {
                state.alive = false;
            }
        },
        heal(amount: number) {
            state.health = Math.min(state.maxHealth, state.health + amount);
        },
    };
}
