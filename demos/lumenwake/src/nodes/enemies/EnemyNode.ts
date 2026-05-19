import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useCustomMesh } from '@pulse-ts/three';
import type { EnemyDef } from '../../config/enemies';
import {
    moveSpherePosition,
    geodesicDirection,
} from '../../utils/sphereMovement';

const HIT_FLASH_DURATION = 0.12;

export interface EnemyState {
    health: number;
    maxHealth: number;
    alive: boolean;
    spawning: boolean;
    position: THREE.Vector3;
    forward: THREE.Vector3;
    enemyDef: EnemyDef;
    /** Nullcube shield facing direction (unit tangent vector on sphere). */
    shieldDirection: THREE.Vector3;
}

export interface EnemyHandle {
    state: EnemyState;
    takeDamage: (amount: number, fromDirection?: THREE.Vector3) => void;
}

export interface EnemyNodeProps {
    enemyDef: EnemyDef;
    sphereRadius: number;
    startPosition: THREE.Vector3;
    glowTexture: THREE.Texture;
    getDarknessLevel: () => number;
    getPlayerPositions: () => THREE.Vector3[];
    onReady?: (handle: EnemyHandle) => void;
    onDeath?: (position: THREE.Vector3, enemyDef: EnemyDef) => void;
}

/**
 * A single enemy (voidform) entity. Handles mesh rendering, sphere-surface
 * AI steering toward the nearest player, health, hit-flash, and death.
 */
export function EnemyNode(props: EnemyNodeProps) {
    const { enemyDef, sphereRadius, startPosition } = props;

    const world = useWorld();
    const node = useNode();

    const SPAWN_DURATION = 1.2;

    const uniforms = {
        uGlowColor: { value: new THREE.Color(enemyDef.glowColor) },
        uTime: { value: Math.random() * 100 },
        uRadius: { value: enemyDef.radius },
        uPulse: { value: 1.0 },
        uFlash: { value: 0.0 },
        uSphereRadius: { value: sphereRadius },
        uGlowMap: { value: props.glowTexture },
        uDarknessLevel: { value: 0.0 },
        uSpawnProgress: { value: 0.0 },
    };

    const { root, object } = useCustomMesh({
        geometry: () => createGeometry(enemyDef),
        material: () =>
            new THREE.ShaderMaterial({
                uniforms,
                vertexShader: /* glsl */ `
                    varying vec3 vNormal;
                    varying vec3 vLocalPos;
                    varying vec3 vRayDir;
                    varying vec3 vWorldPos;

                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vLocalPos = position;
                        vec4 worldPos = modelMatrix * vec4(position, 1.0);
                        vWorldPos = worldPos.xyz;

                        vec3 worldRayDir = normalize(worldPos.xyz - cameraPosition);
                        vRayDir = normalize(transpose(mat3(modelMatrix)) * worldRayDir);

                        gl_Position = projectionMatrix * viewMatrix * worldPos;
                    }
                `,
                fragmentShader: /* glsl */ `
                    uniform vec3 uGlowColor;
                    uniform float uTime;
                    uniform float uRadius;
                    uniform float uPulse;
                    uniform float uFlash;
                    uniform float uSphereRadius;
                    uniform sampler2D uGlowMap;
                    uniform float uDarknessLevel;
                    uniform float uSpawnProgress;

                    varying vec3 vNormal;
                    varying vec3 vLocalPos;
                    varying vec3 vRayDir;
                    varying vec3 vWorldPos;

                    float hash(vec3 p) {
                        p = fract(p * vec3(443.897, 441.423, 437.195));
                        p += dot(p, p.yzx + 19.19);
                        return fract((p.x + p.y) * p.z);
                    }

                    float noise3d(vec3 p) {
                        vec3 i = floor(p);
                        vec3 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);

                        return mix(
                            mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
                            f.z
                        );
                    }

                    float smoke(vec3 p, float t) {
                        float n = 0.0;
                        n += noise3d(p * 3.0 + t * 0.8) * 0.5;
                        n += noise3d(p * 6.0 - t * 1.2) * 0.3;
                        n += noise3d(p * 12.0 + t * 1.8) * 0.2;
                        return n;
                    }

                    void main() {
                        // Discard fragments occluded by the planetoid
                        vec3 camToFrag = vWorldPos - cameraPosition;
                        float fragDist = length(camToFrag);
                        vec3 rd = camToFrag / fragDist;
                        float b = dot(cameraPosition, rd);
                        float c = dot(cameraPosition, cameraPosition) - uSphereRadius * uSphereRadius;
                        float disc = b * b - c;
                        if (disc > 0.0) {
                            float t = -b - sqrt(disc);
                            if (t > 0.0 && t < fragDist) discard;
                        }

                        // Sample glow map at enemy's sphere position
                        vec3 sphereNormal = normalize(vWorldPos);
                        float theta = atan(sphereNormal.x, sphereNormal.z);
                        float phi = asin(clamp(sphereNormal.y, -1.0, 1.0));
                        vec2 glowUV = vec2(theta / (2.0 * 3.14159) + 0.5, phi / 3.14159 + 0.5);
                        float illumination = min(texture2D(uGlowMap, glowUV).a, 2.5);

                        // Darkness level (consumes from south pole upward)
                        float darknessThreshold = mix(-1.0, 1.0, uDarknessLevel);
                        float darkness = smoothstep(darknessThreshold + 0.1, darknessThreshold - 0.1, sphereNormal.y);

                        float lightAmount = max(0.05, illumination * 0.85) * (1.0 - darkness * 0.95);
                        vec3 keyDir = normalize(vec3(0.0, uSphereRadius * 2.0, 0.0) - vWorldPos);

                        vec3 rayDir = normalize(vRayDir);
                        float stepSize = uRadius * 0.12;

                        vec3 accum = vec3(0.0);
                        float alpha = 0.0;
                        vec3 p = vLocalPos;
                        vec3 drift = vec3(uTime * 0.25, uTime * -0.18, uTime * 0.12);

                        for (int i = 0; i < 16; i++) {
                            p += rayDir * stepSize;
                            float dist = length(p);
                            if (dist > uRadius * 1.2) continue;

                            float density = smoke(p * 0.6 + drift, uTime * 0.35);
                            float coreDensity = smoothstep(0.48, 0.58, density);
                            coreDensity = coreDensity * coreDensity;

                            vec3 sampleColor = mix(uGlowColor * 0.2, uGlowColor * 0.9, coreDensity) * uPulse * lightAmount;
                            float sampleAlpha = coreDensity * 0.2;

                            accum += sampleColor * sampleAlpha * (1.0 - alpha);
                            alpha += sampleAlpha * (1.0 - alpha);
                        }

                        // Frosted glass surface
                        vec3 viewDir = normalize(cameraPosition - vWorldPos);

                        float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
                        fresnel = pow(fresnel, 1.8);

                        // Face shading from glow direction
                        float NdotL = max(0.0, dot(vNormal, keyDir));

                        // Edge highlight to define faces
                        float edgeGlow = fresnel * 0.5 * lightAmount;

                        // Per-face shading variation
                        float faceShade = NdotL * 0.3 * lightAmount;

                        // Specular reflections colored by glow light
                        vec3 halfVec = normalize(viewDir + keyDir);
                        float spec = pow(max(0.0, dot(vNormal, halfVec)), 20.0) * 0.8 * lightAmount;
                        vec3 reflectDir = reflect(-viewDir, vNormal);
                        float envReflect = pow(max(0.0, dot(reflectDir, keyDir)), 8.0) * 0.4 * lightAmount;

                        float glassAlpha = (0.05 + edgeGlow + faceShade) * lightAmount;
                        vec3 glassColor = uGlowColor * (0.1 + faceShade) + vec3(spec + envReflect) + uGlowColor * edgeGlow * 0.4;

                        accum = accum + glassColor * glassAlpha * (1.0 - alpha);
                        alpha = alpha + glassAlpha * (1.0 - alpha);

                        accum = mix(accum, vec3(1.0), uFlash * alpha);

                        alpha *= uSpawnProgress;
                        if (alpha < 0.01) discard;
                        gl_FragColor = vec4(accum, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: false,
                toneMapped: false,
            }),
    });

    const mesh = object as THREE.Mesh;

    // Volumetric aura — raymarched wisps emanating from the surface
    const auraUniforms = {
        uGlowColor: uniforms.uGlowColor,
        uTime: uniforms.uTime,
        uPulse: uniforms.uPulse,
        uSpawnProgress: uniforms.uSpawnProgress,
        uInnerRadius: { value: enemyDef.radius },
        uSphereRadius: uniforms.uSphereRadius,
        uGlowMap: uniforms.uGlowMap,
        uDarknessLevel: uniforms.uDarknessLevel,
    };
    const auraGeo = createAuraGeometry(enemyDef);
    const auraMat = new THREE.ShaderMaterial({
        uniforms: auraUniforms,
        vertexShader: /* glsl */ `
            varying vec3 vLocalPos;
            varying vec3 vRayDir;
            varying vec3 vWorldPos;

            void main() {
                vLocalPos = position;
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;

                vec3 worldRayDir = normalize(worldPos.xyz - cameraPosition);
                vRayDir = normalize(transpose(mat3(modelMatrix)) * worldRayDir);

                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uGlowColor;
            uniform float uTime;
            uniform float uPulse;
            uniform float uSpawnProgress;
            uniform float uInnerRadius;
            uniform float uSphereRadius;
            uniform sampler2D uGlowMap;
            uniform float uDarknessLevel;

            varying vec3 vLocalPos;
            varying vec3 vRayDir;
            varying vec3 vWorldPos;

            float aHash(vec3 p) {
                p = fract(p * vec3(443.897, 441.423, 437.195));
                p += dot(p, p.yzx + 19.19);
                return fract((p.x + p.y) * p.z);
            }

            float aNoise(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(mix(aHash(i), aHash(i + vec3(1,0,0)), f.x),
                        mix(aHash(i + vec3(0,1,0)), aHash(i + vec3(1,1,0)), f.x), f.y),
                    mix(mix(aHash(i + vec3(0,0,1)), aHash(i + vec3(1,0,1)), f.x),
                        mix(aHash(i + vec3(0,1,1)), aHash(i + vec3(1,1,1)), f.x), f.y),
                    f.z
                );
            }

            float wispNoise(vec3 p, float t) {
                float n = 0.0;
                n += aNoise(p * 3.0 + t * 0.6) * 0.5;
                n += aNoise(p * 6.0 - t * 0.9) * 0.3;
                n += aNoise(p * 11.0 + t * 1.4) * 0.2;
                return n;
            }

            void main() {
                // Discard fragments occluded by the planetoid
                vec3 camToFrag = vWorldPos - cameraPosition;
                float fragDist = length(camToFrag);
                vec3 rd = camToFrag / fragDist;
                float b = dot(cameraPosition, rd);
                float c = dot(cameraPosition, cameraPosition) - uSphereRadius * uSphereRadius;
                float disc = b * b - c;
                if (disc > 0.0) {
                    float t = -b - sqrt(disc);
                    if (t > 0.0 && t < fragDist) discard;
                }

                // Glow map + darkness lighting
                vec3 sphNorm = normalize(vWorldPos);
                float aTheta = atan(sphNorm.x, sphNorm.z);
                float aPhi = asin(clamp(sphNorm.y, -1.0, 1.0));
                vec2 aGlowUV = vec2(aTheta / (2.0 * 3.14159) + 0.5, aPhi / 3.14159 + 0.5);
                float aIllum = min(texture2D(uGlowMap, aGlowUV).a, 2.5);

                float aDarkThresh = mix(-1.0, 1.0, uDarknessLevel);
                float aDarkness = smoothstep(aDarkThresh + 0.1, aDarkThresh - 0.1, sphNorm.y);

                float auraLight = max(0.05, aIllum * 0.85) * (1.0 - aDarkness * 0.95);

                vec3 rayDir = normalize(vRayDir);
                float outerR = length(vLocalPos);
                float innerR = uInnerRadius * 0.9;
                float thickness = outerR - innerR;
                float stepSize = thickness / 5.0;

                vec3 accum = vec3(0.0);
                float alpha = 0.0;
                vec3 p = vLocalPos;

                for (int i = 0; i < 5; i++) {
                    p += rayDir * stepSize;
                    float dist = length(p);
                    if (dist < innerR) break;

                    float n = wispNoise(p, uTime);
                    float density = smoothstep(0.15, 0.55, n);

                    float depthNorm = (dist - innerR) / thickness;
                    float edgeFade = 1.0 - depthNorm;
                    edgeFade = edgeFade * edgeFade * edgeFade;

                    vec3 darkSmoke = mix(uGlowColor * 0.3, uGlowColor, density);
                    vec3 sampleColor = darkSmoke * 0.8 * edgeFade * uPulse * auraLight;
                    float sampleAlpha = density * 0.45 * edgeFade;

                    accum += sampleColor * sampleAlpha * (1.0 - alpha);
                    alpha += sampleAlpha * (1.0 - alpha);
                }

                alpha *= uSpawnProgress;
                if (alpha < 0.01) discard;
                gl_FragColor = vec4(accum, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    mesh.add(auraMesh);

    const position = startPosition.clone();
    const forward = new THREE.Vector3(0, 0, 1);
    let hitFlashTimer = 0;
    let destroyed = false;
    let spawning = true;
    let spawnTimer = 0;
    let shattering = false;
    let shatterTimer = 0;
    const SHATTER_DURATION = 2.0;
    const SHATTER_FADE_START = 0.8;
    let elapsed = Math.random() * 6.28;
    let smokeMesh: THREE.Mesh | null = null;

    interface ShatterFragment {
        mesh: THREE.Mesh;
        velocity: THREE.Vector3;
        angularVel: THREE.Vector3;
    }
    const fragments: ShatterFragment[] = [];

    const state: EnemyState = {
        health: enemyDef.health,
        maxHealth: enemyDef.health,
        alive: true,
        spawning: true,
        position,
        forward,
        enemyDef,
        shieldDirection: new THREE.Vector3(0, 0, 1),
    };

    const hoverHeight = enemyDef.radius + 0.3;
    root.position.copy(position);
    const initNormal = position.clone().normalize();
    root.position.addScaledVector(initNormal, hoverHeight);

    // Spawn smoke — swirling fog that contracts into the enemy shape
    const spawnSmokeRadius = enemyDef.radius * 4.0;
    const spawnSmokeGeo = new THREE.IcosahedronGeometry(spawnSmokeRadius, 3);
    const spawnSmokeMat = new THREE.ShaderMaterial({
        uniforms: {
            uGlowColor: uniforms.uGlowColor,
            uTime: uniforms.uTime,
            uSpawnProgress: uniforms.uSpawnProgress,
            uSmokeRadius: { value: spawnSmokeRadius },
            uEnemyRadius: uniforms.uRadius,
            uSphereRadius: uniforms.uSphereRadius,
            uGlowMap: uniforms.uGlowMap,
            uDarknessLevel: uniforms.uDarknessLevel,
        },
        vertexShader: /* glsl */ `
            varying vec3 vLocalPos;
            varying vec3 vRayDir;
            varying vec3 vWorldPos;
            void main() {
                vLocalPos = position;
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                vec3 wd = normalize(worldPos.xyz - cameraPosition);
                vRayDir = normalize(transpose(mat3(modelMatrix)) * wd);
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uGlowColor;
            uniform float uTime;
            uniform float uSpawnProgress;
            uniform float uSmokeRadius;
            uniform float uEnemyRadius;
            uniform float uSphereRadius;
            uniform sampler2D uGlowMap;
            uniform float uDarknessLevel;

            varying vec3 vLocalPos;
            varying vec3 vRayDir;
            varying vec3 vWorldPos;

            float spHash(vec3 p) {
                p = fract(p * vec3(443.897, 441.423, 437.195));
                p += dot(p, p.yzx + 19.19);
                return fract((p.x + p.y) * p.z);
            }

            float spNoise(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(mix(spHash(i), spHash(i+vec3(1,0,0)), f.x),
                        mix(spHash(i+vec3(0,1,0)), spHash(i+vec3(1,1,0)), f.x), f.y),
                    mix(mix(spHash(i+vec3(0,0,1)), spHash(i+vec3(1,0,1)), f.x),
                        mix(spHash(i+vec3(0,1,1)), spHash(i+vec3(1,1,1)), f.x), f.y),
                    f.z
                );
            }

            void main() {
                // Planetoid occlusion
                vec3 camToFrag = vWorldPos - cameraPosition;
                float fragDist = length(camToFrag);
                vec3 rd = camToFrag / fragDist;
                float bVal = dot(cameraPosition, rd);
                float cVal = dot(cameraPosition, cameraPosition) - uSphereRadius * uSphereRadius;
                float disc = bVal * bVal - cVal;
                if (disc > 0.0) {
                    float tHit = -bVal - sqrt(disc);
                    if (tHit > 0.0 && tHit < fragDist) discard;
                }

                // Lighting
                vec3 sn = normalize(vWorldPos);
                float theta = atan(sn.x, sn.z);
                float phi = asin(clamp(sn.y, -1.0, 1.0));
                vec2 guv = vec2(theta / (2.0 * 3.14159) + 0.5, phi / 3.14159 + 0.5);
                float illum = min(texture2D(uGlowMap, guv).a, 2.5);
                float dThresh = mix(-1.0, 1.0, uDarknessLevel);
                float dark = smoothstep(dThresh + 0.1, dThresh - 0.1, sn.y);
                float light = max(0.05, illum * 0.85) * (1.0 - dark * 0.95);

                // Smoke contracts from outer radius to enemy radius
                float outerR = mix(uSmokeRadius, uEnemyRadius * 0.5, uSpawnProgress);
                float innerR = uEnemyRadius * 0.3 * uSpawnProgress;
                float fadeOut = 1.0 - uSpawnProgress;

                vec3 rayDir = normalize(vRayDir);
                float stepSize = uSmokeRadius * 2.0 / 16.0;
                vec3 accum = vec3(0.0);
                float alpha = 0.0;
                vec3 p = vLocalPos;

                // Swirl offset rotates around center over time
                float angle = uTime * 2.5;
                vec3 swirl = vec3(cos(angle), 0.0, sin(angle)) * 0.5;

                for (int i = 0; i < 16; i++) {
                    p += rayDir * stepSize;

                    float dist = length(p);
                    if (dist > outerR) continue;
                    if (dist < innerR) continue;

                    // Low-frequency swirling noise — big thick blobs
                    vec3 noiseP = p * 0.25 + swirl;
                    float n1 = spNoise(noiseP + uTime * 0.2);
                    float n2 = spNoise(noiseP * 0.5 - uTime * 0.3);
                    float n = n1 * 0.65 + n2 * 0.35;

                    float density = smoothstep(0.3, 0.45, n);

                    // Denser toward the contracting shell
                    float shellDist = abs(dist - outerR * 0.7) / (outerR * 0.5);
                    float shellDensity = 1.0 - clamp(shellDist, 0.0, 1.0);

                    float sampleDensity = density * shellDensity * fadeOut;

                    vec3 col = mix(uGlowColor * 0.1, uGlowColor * 0.6, density) * light;
                    float sampleAlpha = sampleDensity * 0.5;

                    accum += col * sampleAlpha * (1.0 - alpha);
                    alpha += sampleAlpha * (1.0 - alpha);
                }

                if (alpha < 0.01) discard;
                gl_FragColor = vec4(accum, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
    });
    const spawnSmokeMesh = new THREE.Mesh(spawnSmokeGeo, spawnSmokeMat);
    root.add(spawnSmokeMesh);

    useFrameUpdate((dt) => {
        if (destroyed) return;

        // Spawn animation
        if (spawning) {
            spawnTimer += dt;
            const progress = Math.min(spawnTimer / SPAWN_DURATION, 1.0);
            const eased = progress * progress * (3 - 2 * progress);
            uniforms.uSpawnProgress.value = eased;

            if (progress >= 1.0) {
                spawning = false;
                state.spawning = false;
                uniforms.uSpawnProgress.value = 1.0;
                root.remove(spawnSmokeMesh);
                spawnSmokeGeo.dispose();
                spawnSmokeMat.dispose();
            }
        }

        if (shattering) {
            shatterTimer += dt;
            if (shatterTimer >= SHATTER_DURATION) {
                destroyed = true;
                world.remove(node);
                return;
            }

            const fadeProgress = shatterTimer > SHATTER_FADE_START
                ? (shatterTimer - SHATTER_FADE_START) / (SHATTER_DURATION - SHATTER_FADE_START)
                : 0;
            const opacity = 1 - fadeProgress;
            const gravity = 15;
            const bounce = 0.4;
            const friction = 0.8;

            for (const frag of fragments) {
                // World position of fragment
                const worldPos = frag.mesh.position.clone().add(root.position);
                const dist = worldPos.length();

                // Gravity toward sphere center
                const gravDir = worldPos.clone().normalize().negate();
                frag.velocity.addScaledVector(gravDir, gravity * dt);

                // Move
                frag.mesh.position.addScaledVector(frag.velocity, dt);
                frag.mesh.rotation.x += frag.angularVel.x * dt;
                frag.mesh.rotation.y += frag.angularVel.y * dt;
                frag.mesh.rotation.z += frag.angularVel.z * dt;

                // Bounce off planetoid surface
                const newWorldPos = frag.mesh.position.clone().add(root.position);
                const newDist = newWorldPos.length();
                if (newDist < sphereRadius + 0.05) {
                    const surfaceNormal = newWorldPos.clone().normalize();
                    // Push back to surface
                    const correction = sphereRadius + 0.05 - newDist;
                    frag.mesh.position.addScaledVector(surfaceNormal, correction);

                    // Reflect velocity across surface normal
                    const velDotN = frag.velocity.dot(surfaceNormal);
                    if (velDotN < 0) {
                        frag.velocity.addScaledVector(surfaceNormal, -velDotN * (1 + bounce));
                        frag.velocity.multiplyScalar(friction);
                        frag.angularVel.multiplyScalar(0.7);
                    }
                }

                const mat = frag.mesh.material as THREE.ShaderMaterial;
                mat.uniforms.uOpacity.value = opacity * opacity;
            }

            if (smokeMesh) {
                const sMat = smokeMesh.material as THREE.ShaderMaterial;
                sMat.uniforms.uElapsed.value = shatterTimer;
            }
            return;
        }

        if (!state.alive) return;

        elapsed += dt;
        uniforms.uTime.value += dt;
        uniforms.uDarknessLevel.value = props.getDarknessLevel();

        if (spawning) return;

        // Find nearest player
        const players = props.getPlayerPositions();
        let nearestDist = Infinity;
        let nearestDir: THREE.Vector3 | null = null;

        for (const playerPos of players) {
            const dir = geodesicDirection(position, playerPos);
            if (dir.lengthSq() < 1e-6) continue;
            const cosAngle = position
                .clone()
                .normalize()
                .dot(playerPos.clone().normalize());
            const arcDist =
                Math.acos(Math.min(1, Math.max(-1, cosAngle))) * sphereRadius;
            if (arcDist < nearestDist) {
                nearestDist = arcDist;
                nearestDir = dir;
            }
        }

        // Steer toward nearest player
        if (nearestDir) {
            forward.lerp(nearestDir, Math.min(1, dt * 5));
            forward.normalize();
            state.shieldDirection.copy(forward);

            const velocity = forward.clone().multiplyScalar(enemyDef.moveSpeed);
            moveSpherePosition(position, velocity, dt, sphereRadius);
        }

        const normal = position.clone().normalize();
        root.position.copy(position);
        root.position.addScaledVector(normal, hoverHeight);

        // Type-specific rotation
        if (enemyDef.type === 'shard') {
            mesh.rotation.y += dt * 3.0;
            mesh.rotation.x += dt * 1.5;
        } else if (enemyDef.type === 'nullcube') {
            mesh.rotation.y += dt * 0.6;
            mesh.rotation.x += dt * 0.3;
        } else if (enemyDef.type === 'eclipser') {
            mesh.rotation.y += dt * 0.4;
            mesh.rotation.x += dt * 0.2;
        }

        // Pulsing glow
        const pulse =
            1.0 -
            enemyDef.pulseAmount +
            enemyDef.pulseAmount *
                (0.5 + 0.5 * Math.sin(elapsed * enemyDef.pulseSpeed));
        uniforms.uPulse.value = pulse;

        // Hit flash decay
        if (hitFlashTimer > 0) {
            hitFlashTimer -= dt;
            uniforms.uFlash.value = (hitFlashTimer / HIT_FLASH_DURATION) * 0.7;
        } else {
            uniforms.uFlash.value = 0;
        }
    });

    function takeDamage(amount: number, fromDirection?: THREE.Vector3) {
        if (!state.alive || destroyed || spawning) return;

        // Nullcube shield check: absorb damage from the front face
        if (enemyDef.type === 'nullcube' && fromDirection) {
            const dot = fromDirection.dot(state.shieldDirection);
            // If the projectile is coming from the front (dot < 0 means
            // projectile direction opposes shield facing), absorb it
            if (dot < -0.3) {
                hitFlashTimer = HIT_FLASH_DURATION * 0.5;
                return;
            }
        }

        state.health -= amount;
        hitFlashTimer = HIT_FLASH_DURATION;

        if (state.health <= 0) {
            state.health = 0;
            state.alive = false;
            props.onDeath?.(position.clone(), enemyDef);

            // Start shatter: hide main mesh + aura, spawn fragments
            mesh.visible = false;
            auraMesh.visible = false;
            shattering = true;

            const geo = mesh.geometry;
            const posAttr = geo.getAttribute('position');
            const index = geo.getIndex();
            const triCount = index
                ? index.count / 3
                : posAttr.count / 3;

            const glowColor = new THREE.Color(enemyDef.glowColor);
            const thickness = enemyDef.radius * 0.15;

            // Volumetric smoke wisps rising from death position
            const surfaceNormal = position.clone().normalize();
            const smokeHeight = enemyDef.radius * 10.0;
            const smokeWidth = enemyDef.radius * 3.0;
            const smokeGeo = new THREE.IcosahedronGeometry(smokeHeight * 0.55, 3);
            const smokeMat = new THREE.ShaderMaterial({
                uniforms: {
                    uGlowColor: uniforms.uGlowColor,
                    uUpDir: { value: surfaceNormal },
                    uElapsed: { value: 0.0 },
                    uDuration: { value: SHATTER_DURATION },
                    uSmokeWidth: { value: smokeWidth },
                    uSmokeHeight: { value: smokeHeight },
                    uSphereRadius: uniforms.uSphereRadius,
                    uGlowMap: uniforms.uGlowMap,
                    uDarknessLevel: uniforms.uDarknessLevel,
                },
                vertexShader: /* glsl */ `
                    uniform vec3 uUpDir;
                    varying vec3 vLocalPos;
                    varying vec3 vRayDir;
                    varying vec3 vWorldPos;
                    varying vec3 vLocalUp;
                    void main() {
                        vLocalPos = position;
                        vec4 worldPos = modelMatrix * vec4(position, 1.0);
                        vWorldPos = worldPos.xyz;
                        vec3 wd = normalize(worldPos.xyz - cameraPosition);
                        vRayDir = normalize(transpose(mat3(modelMatrix)) * wd);
                        vLocalUp = normalize(transpose(mat3(modelMatrix)) * uUpDir);
                        gl_Position = projectionMatrix * viewMatrix * worldPos;
                    }
                `,
                fragmentShader: /* glsl */ `
                    uniform vec3 uGlowColor;
                    uniform float uElapsed;
                    uniform float uDuration;
                    uniform float uSmokeWidth;
                    uniform float uSmokeHeight;
                    uniform float uSphereRadius;
                    uniform sampler2D uGlowMap;
                    uniform float uDarknessLevel;

                    varying vec3 vLocalPos;
                    varying vec3 vRayDir;
                    varying vec3 vWorldPos;
                    varying vec3 vLocalUp;

                    float sHash(vec3 p) {
                        p = fract(p * vec3(443.897, 441.423, 437.195));
                        p += dot(p, p.yzx + 19.19);
                        return fract((p.x + p.y) * p.z);
                    }

                    float sNoise(vec3 p) {
                        vec3 i = floor(p);
                        vec3 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        return mix(
                            mix(mix(sHash(i), sHash(i+vec3(1,0,0)), f.x),
                                mix(sHash(i+vec3(0,1,0)), sHash(i+vec3(1,1,0)), f.x), f.y),
                            mix(mix(sHash(i+vec3(0,0,1)), sHash(i+vec3(1,0,1)), f.x),
                                mix(sHash(i+vec3(0,1,1)), sHash(i+vec3(1,1,1)), f.x), f.y),
                            f.z
                        );
                    }

                    void main() {
                        // Planetoid occlusion
                        vec3 camToFrag = vWorldPos - cameraPosition;
                        float fragDist = length(camToFrag);
                        vec3 rd = camToFrag / fragDist;
                        float bVal = dot(cameraPosition, rd);
                        float cVal = dot(cameraPosition, cameraPosition) - uSphereRadius * uSphereRadius;
                        float disc = bVal * bVal - cVal;
                        if (disc > 0.0) {
                            float tHit = -bVal - sqrt(disc);
                            if (tHit > 0.0 && tHit < fragDist) discard;
                        }

                        // Lighting
                        vec3 sn = normalize(vWorldPos);
                        float theta = atan(sn.x, sn.z);
                        float phi = asin(clamp(sn.y, -1.0, 1.0));
                        vec2 guv = vec2(theta / (2.0 * 3.14159) + 0.5, phi / 3.14159 + 0.5);
                        float illum = min(texture2D(uGlowMap, guv).a, 2.5);
                        float dThresh = mix(-1.0, 1.0, uDarknessLevel);
                        float dark = smoothstep(dThresh + 0.1, dThresh - 0.1, sn.y);
                        float light = max(0.05, illum * 0.85) * (1.0 - dark * 0.95);

                        vec3 localUp = normalize(vLocalUp);

                        float progress = uElapsed / uDuration;
                        float intensity = (1.0 - progress) * (1.0 - progress);

                        // The rising front — wisps appear up to this height
                        float riseFront = uElapsed * 8.0;

                        vec3 rayDir = normalize(vRayDir);
                        float meshRadius = uSmokeHeight * 0.55;
                        float stepSize = meshRadius * 2.0 / 16.0;
                        vec3 accum = vec3(0.0);
                        float alpha = 0.0;
                        vec3 p = vLocalPos;

                        for (int i = 0; i < 16; i++) {
                            p += rayDir * stepSize;

                            if (length(p) > meshRadius) continue;

                            // Height along the plume axis (localUp direction)
                            float height = dot(p, localUp);
                            if (height < -meshRadius * 0.1) continue;
                            if (height > uSmokeHeight) continue;

                            // Only render up to the rising front
                            if (height > riseFront) continue;

                            // Radial distance from axis
                            vec3 onAxis = localUp * height;
                            float radialDist = length(p - onAxis);

                            // Taper width: wide at base, narrow at top
                            float heightFrac = clamp(height / uSmokeHeight, 0.0, 1.0);
                            float maxWidth = uSmokeWidth * (1.0 - heightFrac * 0.7);
                            if (radialDist > maxWidth) continue;

                            // Very low-frequency noise — big thick blobs
                            float n1 = sNoise(p * 0.25 + vec3(0.0, uElapsed * 0.12, 0.0));
                            float n2 = sNoise(p * 0.5 - vec3(uElapsed * 0.08, 0.0, uElapsed * 0.06));
                            float n = n1 * 0.65 + n2 * 0.35;

                            // Thick blobs with gaps between
                            float baseness = 1.0 - heightFrac;
                            float density = smoothstep(0.2 + heightFrac * 0.2, 0.35 + heightFrac * 0.15, n);
                            density = mix(density, 1.0, baseness * baseness * 0.4);

                            // Radial fade
                            float radialFade = 1.0 - pow(radialDist / maxWidth, 2.0);

                            // Only fade at the rising front edge, not at the bottom
                            float frontFade = 1.0 - smoothstep(riseFront * 0.7, riseFront, height);

                            float sampleDensity = density * radialFade * frontFade * intensity;

                            vec3 col = mix(uGlowColor * 0.2, uGlowColor * 0.8, density) * light;
                            float sampleAlpha = sampleDensity * 0.8;

                            accum += col * sampleAlpha * (1.0 - alpha);
                            alpha += sampleAlpha * (1.0 - alpha);
                        }

                        if (alpha < 0.01) discard;
                        gl_FragColor = vec4(accum, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: false,
                toneMapped: false,
            });
            smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
            // Offset so the sphere's bottom is near the planetoid surface
            const smokeOffset = surfaceNormal.clone().multiplyScalar(
                -hoverHeight + smokeHeight * 0.1,
            );
            smokeMesh.position.copy(smokeOffset);
            root.add(smokeMesh);

            for (let t = 0; t < triCount; t++) {
                const verts: THREE.Vector3[] = [];
                const centroid = new THREE.Vector3();
                for (let v = 0; v < 3; v++) {
                    const i = index ? index.getX(t * 3 + v) : t * 3 + v;
                    const vert = new THREE.Vector3(
                        posAttr.getX(i),
                        posAttr.getY(i),
                        posAttr.getZ(i),
                    );
                    verts.push(vert);
                    centroid.add(vert);
                }
                centroid.divideScalar(3);

                // Compute face normal for extrusion
                const edge1 = verts[1].clone().sub(verts[0]);
                const edge2 = verts[2].clone().sub(verts[0]);
                const faceNormal = edge1.cross(edge2).normalize();
                const halfThick = faceNormal.clone().multiplyScalar(thickness * 0.5);

                // Build extruded prism: 2 caps + 3 side quads = 8 triangles = 24 verts
                const p = new Float32Array(24 * 3);
                const frontVerts = verts.map((v) => v.clone().sub(centroid).add(halfThick));
                const backVerts = verts.map((v) => v.clone().sub(centroid).sub(halfThick));

                let vi = 0;
                function pushVert(v: THREE.Vector3) {
                    p[vi++] = v.x; p[vi++] = v.y; p[vi++] = v.z;
                }

                // Front cap
                pushVert(frontVerts[0]); pushVert(frontVerts[1]); pushVert(frontVerts[2]);
                // Back cap
                pushVert(backVerts[2]); pushVert(backVerts[1]); pushVert(backVerts[0]);
                // Side quads (3 sides, 2 triangles each)
                for (let s = 0; s < 3; s++) {
                    const s2 = (s + 1) % 3;
                    pushVert(frontVerts[s]); pushVert(backVerts[s]); pushVert(frontVerts[s2]);
                    pushVert(frontVerts[s2]); pushVert(backVerts[s]); pushVert(backVerts[s2]);
                }

                const fragGeo = new THREE.BufferGeometry();
                fragGeo.setAttribute(
                    'position',
                    new THREE.BufferAttribute(p, 3),
                );
                fragGeo.computeVertexNormals();

                const fragMat = new THREE.ShaderMaterial({
                    uniforms: {
                        uColor: { value: glowColor },
                        uOpacity: { value: 1.0 },
                        uSphereRadius: uniforms.uSphereRadius,
                        uGlowMap: uniforms.uGlowMap,
                        uDarknessLevel: uniforms.uDarknessLevel,
                    },
                    vertexShader: /* glsl */ `
                        varying vec3 vWorldPos;
                        varying vec3 vNormal;
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                            vec4 worldPos = modelMatrix * vec4(position, 1.0);
                            vWorldPos = worldPos.xyz;
                            gl_Position = projectionMatrix * viewMatrix * worldPos;
                        }
                    `,
                    fragmentShader: /* glsl */ `
                        uniform vec3 uColor;
                        uniform float uOpacity;
                        uniform float uSphereRadius;
                        uniform sampler2D uGlowMap;
                        uniform float uDarknessLevel;
                        varying vec3 vWorldPos;
                        varying vec3 vNormal;
                        void main() {
                            vec3 sn = normalize(vWorldPos);
                            float theta = atan(sn.x, sn.z);
                            float phi = asin(clamp(sn.y, -1.0, 1.0));
                            vec2 guv = vec2(theta / (2.0 * 3.14159) + 0.5, phi / 3.14159 + 0.5);
                            float illum = min(texture2D(uGlowMap, guv).a, 2.5);
                            float dThresh = mix(-1.0, 1.0, uDarknessLevel);
                            float dark = smoothstep(dThresh + 0.1, dThresh - 0.1, sn.y);
                            float light = max(0.05, illum * 0.85) * (1.0 - dark * 0.95);

                            vec3 viewDir = normalize(cameraPosition - vWorldPos);
                            float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.0);

                            vec3 keyDir = normalize(vec3(0.0, uSphereRadius * 2.0, 0.0) - vWorldPos);
                            vec3 halfVec = normalize(viewDir + keyDir);
                            float spec = pow(max(0.0, dot(vNormal, halfVec)), 24.0) * 0.6 * light;

                            vec3 col = uColor * 0.15 * light + vec3(spec) + uColor * fresnel * 0.3 * light;
                            float a = (0.08 + fresnel * 0.25 + spec * 0.5) * uOpacity;
                            gl_FragColor = vec4(col, a);
                        }
                    `,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthTest: false,
                    toneMapped: false,
                });
                const fragMesh = new THREE.Mesh(fragGeo, fragMat);

                // Position relative to the root (in root's local space)
                fragMesh.position.copy(centroid);
                // Apply the core mesh's current rotation
                fragMesh.position.applyEuler(mesh.rotation);
                root.add(fragMesh);

                // Velocity: outward from center + random
                const dir = centroid.clone().normalize();
                const velocity = dir.multiplyScalar(3 + Math.random() * 5);
                velocity.x += (Math.random() - 0.5) * 3;
                velocity.y += (Math.random() - 0.5) * 3;
                velocity.z += (Math.random() - 0.5) * 3;

                const angularVel = new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15,
                );

                fragments.push({ mesh: fragMesh, velocity, angularVel });
            }
        }
    }

    props.onReady?.({ state, takeDamage });

    return { state, takeDamage };
}

function createGeometry(def: EnemyDef): THREE.BufferGeometry {
    switch (def.type) {
        case 'shard':
            return new THREE.TetrahedronGeometry(def.radius, 0);
        case 'nullcube':
            return new THREE.BoxGeometry(
                def.radius * 1.4,
                def.radius * 1.4,
                def.radius * 1.4,
            );
        case 'eclipser':
            return new THREE.DodecahedronGeometry(def.radius, 0);
    }
}

function createAuraGeometry(def: EnemyDef): THREE.BufferGeometry {
    return new THREE.IcosahedronGeometry(def.radius * 1.8, 3);
}
