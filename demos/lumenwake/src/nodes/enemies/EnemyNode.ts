import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useCustomMesh } from '@pulse-ts/three';
import { useParticleBurst } from '@pulse-ts/effects';
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
    /** World position of the shield center (null if no shield or broken). */
    shieldPosition: THREE.Vector3 | null;
    /** Half-width of the shield for collision (arc distance). */
    shieldRadius: number;
    shieldHealth: number;
    shieldMaxHealth: number;
}

export interface EnemyHandle {
    state: EnemyState;
    takeDamage: (amount: number, fromDirection?: THREE.Vector3) => void;
    damageShield: (amount: number) => void;
    applyKnockback: (direction: THREE.Vector3, strength: number) => void;
}

export interface EnemyNodeProps {
    enemyDef: EnemyDef;
    sphereRadius: number;
    startPosition: THREE.Vector3;
    glowTexture: THREE.Texture;
    sunDir: THREE.Vector3;
    sunColor: THREE.Color;
    getSunStrength: () => number;
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
        uBaseLumenwake: { value: 1.0 },
        uSpawnProgress: { value: 0.0 },
        uSunDir: { value: props.sunDir },
        uSunColor: { value: props.sunColor },
        uSunStrength: { value: 1.0 },
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
                    uniform float uBaseLumenwake;
                    uniform float uSpawnProgress;
                    uniform vec3 uSunDir;
                    uniform vec3 uSunColor;
                    uniform float uSunStrength;

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
                        float illumination = min(texture2D(uGlowMap, glowUV).a, 1.0);

                        // Sun hemisphere lighting (matches planetoid soft terminator)
                        float sunDot = dot(sphereNormal, uSunDir);
                        float sunWrap = smoothstep(-0.3, 0.6, sunDot);
                        float sunAmbient = 0.06 * uSunStrength;
                        float sunLight = sunAmbient + sunWrap * 0.94 * uSunStrength;

                        // Lumenwake glow — additive on top of sun
                        float glowAmount = illumination * 1.4;

                        float lightAmount = min(sunLight + glowAmount, 1.5);
                        vec3 keyDir = uSunDir;

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

                        // Face shading from sun direction
                        float NdotL = max(0.0, dot(vNormal, keyDir));

                        // Edge highlight — subtle, tinted by sun
                        float edgeGlow = fresnel * 0.3 * lightAmount;

                        // Per-face shading
                        float faceShade = NdotL * 0.25 * sunLight;

                        // Sun-colored specular
                        vec3 halfVec = normalize(viewDir + keyDir);
                        float spec = pow(max(0.0, dot(vNormal, halfVec)), 24.0) * 0.5 * sunWrap;

                        float glassAlpha = (0.04 + edgeGlow + faceShade) * lightAmount;
                        vec3 glassColor = uGlowColor * (0.08 + faceShade * 0.5) + uSunColor * spec * 0.6 + uGlowColor * edgeGlow * 0.3;

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
        uBaseLumenwake: uniforms.uBaseLumenwake,
        uSunDir: uniforms.uSunDir,
        uSunColor: uniforms.uSunColor,
        uSunStrength: uniforms.uSunStrength,
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
            uniform float uBaseLumenwake;
            uniform vec3 uSunDir;
            uniform vec3 uSunColor;
            uniform float uSunStrength;

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

                // Sun hemisphere + lumenwake lighting
                vec3 sphNorm = normalize(vWorldPos);
                float aTheta = atan(sphNorm.x, sphNorm.z);
                float aPhi = asin(clamp(sphNorm.y, -1.0, 1.0));
                vec2 aGlowUV = vec2(aTheta / (2.0 * 3.14159) + 0.5, aPhi / 3.14159 + 0.5);
                float aIllum = min(texture2D(uGlowMap, aGlowUV).a, 1.0);

                float aSunDot = dot(sphNorm, uSunDir);
                float aSunWrap = smoothstep(-0.3, 0.6, aSunDot);
                float aSunLight = 0.06 * uSunStrength + aSunWrap * 0.94 * uSunStrength;
                float aGlow = aIllum * 1.4;
                float auraLight = min(aSunLight + aGlow, 1.5);

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

    // Nullcube shield — translucent hex-grid energy barrier
    let shieldMesh: THREE.Mesh | null = null;
    const SHIELD_BREAK_DURATION = 0.6;
    let shieldBreaking = false;
    let shieldBreakTimer = 0;
    const shieldBreakBurst = useParticleBurst({
        count: 32,
        lifetime: 0.7,
        color: enemyDef.glowColor,
        speed: [4, 10],
        gravity: 2,
        size: 0.3,
        shrink: true,
        opacity: 0.9,
        blending: 'additive',
    });
    if (enemyDef.type === 'nullcube') {
        const shieldWidth = enemyDef.radius * 3.5;
        const shieldHeight = enemyDef.radius * 3.0;
        const shieldDepth = enemyDef.radius * 0.15;
        const shieldGeo = new THREE.BoxGeometry(
            shieldWidth,
            shieldHeight,
            shieldDepth,
        );
        const shieldMat = new THREE.ShaderMaterial({
            uniforms: {
                uGlowColor: uniforms.uGlowColor,
                uTime: uniforms.uTime,
                uSpawnProgress: uniforms.uSpawnProgress,
                uShieldFlash: { value: 0.0 },
                uShieldHealth: { value: 1.0 },
                uBreakProgress: { value: 0.0 },
                uSphereRadius: uniforms.uSphereRadius,
                uGlowMap: uniforms.uGlowMap,
                uBaseLumenwake: uniforms.uBaseLumenwake,
                uSunDir: uniforms.uSunDir,
                uSunColor: uniforms.uSunColor,
                uSunStrength: uniforms.uSunStrength,
            },
            vertexShader: /* glsl */ `
                varying vec2 vUv;
                varying vec3 vLocalPos;
                varying vec3 vWorldPos;
                varying vec3 vNormal;
                void main() {
                    vUv = uv;
                    vLocalPos = position;
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPos = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fragmentShader: /* glsl */ `
                uniform vec3 uGlowColor;
                uniform float uTime;
                uniform float uSpawnProgress;
                uniform float uShieldFlash;
                uniform float uShieldHealth;
                uniform float uBreakProgress;
                uniform float uSphereRadius;
                uniform sampler2D uGlowMap;
                uniform float uBaseLumenwake;
                uniform vec3 uSunDir;
                uniform vec3 uSunColor;
                uniform float uSunStrength;

                varying vec2 vUv;
                varying vec3 vLocalPos;
                varying vec3 vWorldPos;
                varying vec3 vNormal;

                // Hex grid — returns (cell center distance, edge distance)
                vec2 hexGrid(vec2 p, float scale) {
                    p *= scale;
                    vec2 h = vec2(1.0, sqrt(3.0));
                    vec2 a = mod(p, h) - h * 0.5;
                    vec2 b = mod(p - h * 0.5, h) - h * 0.5;
                    vec2 g = dot(a, a) < dot(b, b) ? a : b;
                    float cellDist = length(g);
                    float edgeDist = 0.5 * min(
                        dot(abs(g), normalize(h)),
                        g.y > 0.0 ? g.y : -g.y
                    );
                    return vec2(cellDist, edgeDist);
                }

                float shHash(vec2 p) {
                    p = fract(p * vec2(443.897, 441.423));
                    p += dot(p, p.yx + 19.19);
                    return fract(p.x * p.y);
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

                    // Sun hemisphere + lumenwake lighting
                    vec3 sn = normalize(vWorldPos);
                    float theta = atan(sn.x, sn.z);
                    float phi = asin(clamp(sn.y, -1.0, 1.0));
                    vec2 guv = vec2(theta / (2.0 * 3.14159) + 0.5, phi / 3.14159 + 0.5);
                    float illum = min(texture2D(uGlowMap, guv).a, 1.0);
                    float sSunDot = dot(sn, uSunDir);
                    float sSunWrap = smoothstep(-0.3, 0.6, sSunDot);
                    float sSunLight = 0.06 * uSunStrength + sSunWrap * 0.94 * uSunStrength;
                    float sGlow = illum * 1.4;
                    float light = min(sSunLight + sGlow, 1.5);
                    float selfLight = max(light, 0.25);

                    // Edge fade — soft falloff near rectangle edges
                    vec2 centered = abs(vUv - 0.5) * 2.0;
                    float edgeX = 1.0 - smoothstep(0.6, 1.0, centered.x);
                    float edgeY = 1.0 - smoothstep(0.6, 1.0, centered.y);
                    float edgeFade = edgeX * edgeY;

                    // Hex grid pattern
                    vec2 hexUV = (vUv - 0.5) * vec2(4.0, 3.5);
                    vec2 hex = hexGrid(hexUV, 3.0);
                    float hexEdge = smoothstep(0.02, 0.05, hex.y);
                    float hexLine = 1.0 - hexEdge;

                    // Animated energy flow — scan lines sweeping upward
                    float scanY = fract(vUv.y * 2.0 - uTime * 0.4);
                    float scanLine = smoothstep(0.0, 0.05, scanY) * (1.0 - smoothstep(0.05, 0.12, scanY));

                    // Slow horizontal pulse wave from center
                    float waveDist = length(vUv - 0.5);
                    float wave = sin(waveDist * 20.0 - uTime * 2.5) * 0.5 + 0.5;
                    wave *= smoothstep(0.5, 0.2, waveDist);

                    // Per-hex shimmer using cell position as seed
                    vec2 hexCell = floor(hexUV * 3.0);
                    float cellShimmer = shHash(hexCell) * 0.5 + 0.5;
                    float shimmer = sin(uTime * 1.5 + cellShimmer * 6.28) * 0.5 + 0.5;

                    // Fresnel glow
                    vec3 viewDir = normalize(cameraPosition - vWorldPos);
                    float fresnel = pow(1.0 - max(0.0, abs(dot(vNormal, viewDir))), 2.0);

                    // Damage cracks — appear as health drops
                    float damage = 1.0 - uShieldHealth;
                    float crackNoise = shHash(hexCell * 7.13 + vec2(3.7, 1.2));
                    float crackThreshold = damage * 1.5;
                    float cracks = step(crackNoise, crackThreshold) * damage;

                    // Compose
                    float pattern = hexLine * 0.6 + scanLine * 0.25 + wave * 0.15 + shimmer * hexLine * 0.15;
                    float baseAlpha = (0.06 + pattern * 0.2 + fresnel * 0.35) * edgeFade * selfLight * uSpawnProgress;
                    vec3 baseColor = uGlowColor * (0.3 + pattern * 0.4 + fresnel * 0.5) * selfLight;

                    // Damage crack glow
                    baseColor += vec3(1.0, 0.5, 0.2) * cracks * 0.4;
                    baseAlpha += cracks * 0.3 * edgeFade;

                    // Flash on hit
                    baseAlpha += uShieldFlash * 0.6 * edgeFade;
                    baseColor = mix(baseColor, vec3(1.0), uShieldFlash * 0.7);

                    // Break dissolve — expand from center, hexes dissolve outward
                    if (uBreakProgress > 0.0) {
                        float breakWave = uBreakProgress * 1.2;
                        float distFromCenter = length(vUv - 0.5) * 2.0;
                        float dissolve = smoothstep(breakWave - 0.3, breakWave, distFromCenter);
                        float breakGlow = (1.0 - dissolve) * (1.0 - uBreakProgress);
                        baseColor += vec3(1.0, 0.7, 0.3) * breakGlow * 2.0;
                        baseAlpha *= dissolve;
                        baseAlpha += breakGlow * 0.5 * edgeFade;
                    }

                    if (baseAlpha < 0.01) discard;
                    gl_FragColor = vec4(baseColor, baseAlpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: false,
            toneMapped: false,
        });
        shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.position.z = enemyDef.radius * 2.0;
        root.add(shieldMesh);
    }

    const position = startPosition.clone();
    const forward = new THREE.Vector3(0, 0, 1);
    let hitFlashTimer = 0;
    let shieldFlashTimer = 0;
    const SHIELD_FLASH_DURATION = 0.2;
    const knockbackVelocity = new THREE.Vector3();
    const KNOCKBACK_FRICTION = 5.0;
    let wanderTimer = Math.random() * 2;
    const wanderDir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
    ).normalize();
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

    const shieldOffset = enemyDef.radius * 2.0;
    const state: EnemyState = {
        health: enemyDef.health,
        maxHealth: enemyDef.health,
        alive: true,
        spawning: true,
        position,
        forward,
        enemyDef,
        shieldDirection: new THREE.Vector3(0, 0, 1),
        shieldPosition:
            enemyDef.type === 'nullcube' ? new THREE.Vector3() : null,
        shieldRadius: enemyDef.type === 'nullcube' ? enemyDef.radius * 1.75 : 0,
        shieldHealth: enemyDef.type === 'nullcube' ? 250 : 0,
        shieldMaxHealth: enemyDef.type === 'nullcube' ? 250 : 0,
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
            uBaseLumenwake: uniforms.uBaseLumenwake,
            uSunDir: uniforms.uSunDir,
            uSunColor: uniforms.uSunColor,
            uSunStrength: uniforms.uSunStrength,
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
            uniform float uBaseLumenwake;
            uniform vec3 uSunDir;
            uniform vec3 uSunColor;
            uniform float uSunStrength;

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

                // Sun hemisphere + lumenwake lighting
                vec3 sn = normalize(vWorldPos);
                float theta = atan(sn.x, sn.z);
                float phi = asin(clamp(sn.y, -1.0, 1.0));
                vec2 guv = vec2(theta / (2.0 * 3.14159) + 0.5, phi / 3.14159 + 0.5);
                float illum = min(texture2D(uGlowMap, guv).a, 1.0);
                float spSunDot = dot(sn, uSunDir);
                float spSunWrap = smoothstep(-0.3, 0.6, spSunDot);
                float spSunLight = 0.06 * uSunStrength + spSunWrap * 0.94 * uSunStrength;
                float spGlow = illum * 1.4;
                float light = min(spSunLight + spGlow, 1.5);

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

            const fadeProgress =
                shatterTimer > SHATTER_FADE_START
                    ? (shatterTimer - SHATTER_FADE_START) /
                      (SHATTER_DURATION - SHATTER_FADE_START)
                    : 0;
            const opacity = 1 - fadeProgress;
            const gravity = 15;
            const bounce = 0.4;
            const friction = 0.8;

            for (const frag of fragments) {
                // World position of fragment
                const worldPos = frag.mesh.position.clone().add(root.position);

                // Gravity toward sphere center
                const gravDir = worldPos.clone().normalize().negate();
                frag.velocity.addScaledVector(gravDir, gravity * dt);

                // Move
                frag.mesh.position.addScaledVector(frag.velocity, dt);
                frag.mesh.rotation.x += frag.angularVel.x * dt;
                frag.mesh.rotation.y += frag.angularVel.y * dt;
                frag.mesh.rotation.z += frag.angularVel.z * dt;

                // Bounce off planetoid surface
                const newWorldPos = frag.mesh.position
                    .clone()
                    .add(root.position);
                const newDist = newWorldPos.length();
                if (newDist < sphereRadius + 0.05) {
                    const surfaceNormal = newWorldPos.clone().normalize();
                    // Push back to surface
                    const correction = sphereRadius + 0.05 - newDist;
                    frag.mesh.position.addScaledVector(
                        surfaceNormal,
                        correction,
                    );

                    // Reflect velocity across surface normal
                    const velDotN = frag.velocity.dot(surfaceNormal);
                    if (velDotN < 0) {
                        frag.velocity.addScaledVector(
                            surfaceNormal,
                            -velDotN * (1 + bounce),
                        );
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
        uniforms.uBaseLumenwake.value = 1.0 - props.getDarknessLevel();
        uniforms.uSunStrength.value = props.getSunStrength();

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

        // Steer toward nearest player, or wander idly
        if (nearestDir) {
            forward.lerp(nearestDir, Math.min(1, dt * 5));
            forward.normalize();

            // Shield tracks player independently and much slower
            state.shieldDirection.lerp(nearestDir, Math.min(1, dt * 0.8));
            state.shieldDirection.normalize();

            const velocity = forward.clone().multiplyScalar(enemyDef.moveSpeed);
            velocity.add(knockbackVelocity);
            moveSpherePosition(position, velocity, dt, sphereRadius);
        } else {
            // Idle wander — gentle random drift
            wanderTimer -= dt;
            if (wanderTimer <= 0) {
                wanderTimer = 2 + Math.random() * 3;
                const normal = position.clone().normalize();
                const randDir = new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                );
                randDir
                    .sub(normal.clone().multiplyScalar(randDir.dot(normal)))
                    .normalize();
                wanderDir.copy(randDir);
            }
            forward.lerp(wanderDir, Math.min(1, dt * 1.5));
            forward.normalize();

            const velocity = forward
                .clone()
                .multiplyScalar(enemyDef.moveSpeed * 0.3);
            velocity.add(knockbackVelocity);
            moveSpherePosition(position, velocity, dt, sphereRadius);
        }

        // Decay knockback
        if (knockbackVelocity.lengthSq() > 0.01) {
            knockbackVelocity.multiplyScalar(
                Math.max(0, 1 - KNOCKBACK_FRICTION * dt),
            );
        } else {
            knockbackVelocity.set(0, 0, 0);
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
        }

        // Shield break animation
        if (shieldMesh && shieldBreaking) {
            shieldBreakTimer += dt;
            const mat = shieldMesh.material as THREE.ShaderMaterial;
            const progress = Math.min(
                1,
                shieldBreakTimer / SHIELD_BREAK_DURATION,
            );
            mat.uniforms.uBreakProgress.value = progress;
            if (progress >= 1) {
                shieldBreaking = false;
                shieldMesh.visible = false;
            }
        }

        // Orient shield to face toward the player (uses slow-tracking shieldDirection)
        if (shieldMesh && state.shieldPosition) {
            const normal = position.clone().normalize();
            const shieldFwd = state.shieldDirection.clone();
            const shieldUp = normal;
            const shieldRight = new THREE.Vector3()
                .crossVectors(shieldUp, shieldFwd)
                .normalize();
            const correctedFwd = new THREE.Vector3()
                .crossVectors(shieldRight, shieldUp)
                .normalize();
            const shieldMatrix = new THREE.Matrix4().makeBasis(
                shieldRight,
                shieldUp,
                correctedFwd,
            );
            shieldMesh.quaternion.setFromRotationMatrix(shieldMatrix);
            shieldMesh.position.copy(correctedFwd.multiplyScalar(shieldOffset));

            // Update shield world position for collision detection
            state.shieldPosition.copy(root.position).add(shieldMesh.position);

            // Shield flash decay
            if (shieldFlashTimer > 0) {
                shieldFlashTimer -= dt;
                const mat = shieldMesh.material as THREE.ShaderMaterial;
                mat.uniforms.uShieldFlash.value = Math.max(
                    0,
                    shieldFlashTimer / SHIELD_FLASH_DURATION,
                );
            }
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

    function damageShield(amount: number) {
        if (state.shieldHealth <= 0 || shieldBreaking) return;
        shieldFlashTimer = SHIELD_FLASH_DURATION;
        state.shieldHealth -= amount;

        if (shieldMesh) {
            const mat = shieldMesh.material as THREE.ShaderMaterial;
            mat.uniforms.uShieldHealth.value =
                state.shieldHealth / state.shieldMaxHealth;
        }

        if (state.shieldHealth <= 0) {
            state.shieldHealth = 0;
            state.shieldPosition = null;
            shieldBreaking = true;
            shieldBreakTimer = 0;

            if (shieldMesh) {
                const worldPos = new THREE.Vector3();
                shieldMesh.getWorldPosition(worldPos);
                shieldBreakBurst([worldPos.x, worldPos.y, worldPos.z]);
            }
        }
    }

    function takeDamage(amount: number) {
        if (!state.alive || destroyed || spawning) return;

        state.health -= amount;
        hitFlashTimer = HIT_FLASH_DURATION;

        if (state.health <= 0) {
            state.health = 0;
            state.alive = false;
            props.onDeath?.(position.clone(), enemyDef);

            // Start shatter: hide main mesh + aura + shield, spawn fragments
            mesh.visible = false;
            auraMesh.visible = false;
            if (shieldMesh) shieldMesh.visible = false;
            shattering = true;

            const geo = mesh.geometry;
            const posAttr = geo.getAttribute('position');
            const index = geo.getIndex();
            const triCount = index ? index.count / 3 : posAttr.count / 3;

            const glowColor = new THREE.Color(enemyDef.glowColor);
            const thickness = enemyDef.radius * 0.15;

            // Volumetric smoke wisps rising from death position
            const surfaceNormal = position.clone().normalize();
            const smokeHeight = enemyDef.radius * 10.0;
            const smokeWidth = enemyDef.radius * 3.0;
            const smokeGeo = new THREE.IcosahedronGeometry(
                smokeHeight * 0.55,
                3,
            );
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
                    uBaseLumenwake: uniforms.uBaseLumenwake,
                    uSunDir: uniforms.uSunDir,
                    uSunColor: uniforms.uSunColor,
                    uSunStrength: uniforms.uSunStrength,
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
                    uniform float uBaseLumenwake;
                    uniform vec3 uSunDir;
                    uniform vec3 uSunColor;
                    uniform float uSunStrength;

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

                        // Sun hemisphere + lumenwake lighting
                        vec3 sn = normalize(vWorldPos);
                        float theta = atan(sn.x, sn.z);
                        float phi = asin(clamp(sn.y, -1.0, 1.0));
                        vec2 guv = vec2(theta / (2.0 * 3.14159) + 0.5, phi / 3.14159 + 0.5);
                        float illum = min(texture2D(uGlowMap, guv).a, 1.0);
                        float dSunDot = dot(sn, uSunDir);
                        float dSunWrap = smoothstep(-0.3, 0.6, dSunDot);
                        float dSunLight = 0.06 * uSunStrength + dSunWrap * 0.94 * uSunStrength;
                        float dGlow = illum * 1.4;
                        float light = min(dSunLight + dGlow, 1.5);

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
            const smokeOffset = surfaceNormal
                .clone()
                .multiplyScalar(-hoverHeight + smokeHeight * 0.1);
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
                const halfThick = faceNormal
                    .clone()
                    .multiplyScalar(thickness * 0.5);

                // Build extruded prism: 2 caps + 3 side quads = 8 triangles = 24 verts
                const p = new Float32Array(24 * 3);
                const frontVerts = verts.map((v) =>
                    v.clone().sub(centroid).add(halfThick),
                );
                const backVerts = verts.map((v) =>
                    v.clone().sub(centroid).sub(halfThick),
                );

                let vi = 0;
                function pushVert(v: THREE.Vector3) {
                    p[vi++] = v.x;
                    p[vi++] = v.y;
                    p[vi++] = v.z;
                }

                // Front cap
                pushVert(frontVerts[0]);
                pushVert(frontVerts[1]);
                pushVert(frontVerts[2]);
                // Back cap
                pushVert(backVerts[2]);
                pushVert(backVerts[1]);
                pushVert(backVerts[0]);
                // Side quads (3 sides, 2 triangles each)
                for (let s = 0; s < 3; s++) {
                    const s2 = (s + 1) % 3;
                    pushVert(frontVerts[s]);
                    pushVert(backVerts[s]);
                    pushVert(frontVerts[s2]);
                    pushVert(frontVerts[s2]);
                    pushVert(backVerts[s]);
                    pushVert(backVerts[s2]);
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
                        uBaseLumenwake: uniforms.uBaseLumenwake,
                        uSunDir: uniforms.uSunDir,
                        uSunColor: uniforms.uSunColor,
                        uSunStrength: uniforms.uSunStrength,
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
                        uniform float uBaseLumenwake;
                        uniform vec3 uSunDir;
                        uniform vec3 uSunColor;
                        uniform float uSunStrength;
                        varying vec3 vWorldPos;
                        varying vec3 vNormal;
                        void main() {
                            vec3 sn = normalize(vWorldPos);
                            float theta = atan(sn.x, sn.z);
                            float phi = asin(clamp(sn.y, -1.0, 1.0));
                            vec2 guv = vec2(theta / (2.0 * 3.14159) + 0.5, phi / 3.14159 + 0.5);
                            float illum = min(texture2D(uGlowMap, guv).a, 1.0);
                            float fSunDot = dot(sn, uSunDir);
                            float fSunWrap = smoothstep(-0.3, 0.6, fSunDot);
                            float fSunLight = 0.06 * uSunStrength + fSunWrap * 0.94 * uSunStrength;
                            float fGlow = illum * 1.4;
                            float light = min(fSunLight + fGlow, 1.5);

                            vec3 viewDir = normalize(cameraPosition - vWorldPos);
                            float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.0);

                            vec3 halfVec = normalize(viewDir + uSunDir);
                            float spec = pow(max(0.0, dot(vNormal, halfVec)), 24.0) * 0.4 * fSunWrap;

                            vec3 col = uColor * 0.12 * light + uSunColor * spec * 0.4 + uColor * fresnel * 0.25 * light;
                            float a = (0.06 + fresnel * 0.2 + spec * 0.3) * uOpacity;
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

    function applyKnockback(direction: THREE.Vector3, strength: number) {
        knockbackVelocity.copy(direction).multiplyScalar(strength);
    }

    props.onReady?.({ state, takeDamage, damageShield, applyKnockback });

    return { state, takeDamage, damageShield, applyKnockback };
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
    }
}

function createAuraGeometry(def: EnemyDef): THREE.BufferGeometry {
    return new THREE.IcosahedronGeometry(def.radius * 1.8, 3);
}
