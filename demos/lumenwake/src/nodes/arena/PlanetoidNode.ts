import * as THREE from 'three';
import { useFrameUpdate } from '@pulse-ts/core';
import { useCustomMesh } from '@pulse-ts/three';
import type { MapConfig } from '../../config/maps';

const TRAIL_LENGTH = 48;

const SURFACE_VERTEX = /* glsl */ `
    varying vec3 vWorldPos;

    void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const SURFACE_FRAGMENT = /* glsl */ `
    uniform float uTime;
    uniform float uDarknessLevel;
    uniform vec3 uSurfaceColor;
    uniform vec3 uEmissiveColor;
    uniform vec3 uPlayerPositions[4];
    uniform vec3 uPlayerColors[4];
    uniform int uPlayerCount;
    uniform float uSphereRadius;
    uniform vec3 uTrailPositions[${TRAIL_LENGTH}];
    uniform float uTrailAges[${TRAIL_LENGTH}];
    uniform vec3 uTrailColors[${TRAIL_LENGTH}];
    uniform int uTrailCount;

    varying vec3 vWorldPos;

    // 3D hash for cell seed positions
    vec3 hash3(vec3 p) {
        p = vec3(
            dot(p, vec3(127.1, 311.7, 74.7)),
            dot(p, vec3(269.5, 183.3, 246.1)),
            dot(p, vec3(113.5, 271.9, 124.6))
        );
        return fract(sin(p) * 43758.5453) - 0.5;
    }

    // 3D Worley noise — returns distance to nearest cell edge (seamless on sphere)
    float worleyEdge(vec3 pos, float scale) {
        vec3 p = pos * scale;
        vec3 cell = floor(p);
        vec3 local = fract(p);

        float dist1 = 10.0;
        float dist2 = 10.0;

        for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
                for (int z = -1; z <= 1; z++) {
                    vec3 offset = vec3(float(x), float(y), float(z));
                    vec3 neighbor = cell + offset;
                    vec3 seed = offset + hash3(neighbor) * 0.8;
                    float d = length(local - seed);
                    if (d < dist1) {
                        dist2 = dist1;
                        dist1 = d;
                    } else if (d < dist2) {
                        dist2 = d;
                    }
                }
            }
        }

        return dist2 - dist1;
    }

    void main() {
        vec3 pos = vWorldPos;
        vec3 normal = normalize(pos);

        // Cellular grid pattern
        float edge = worleyEdge(pos, 0.8);
        float grid = 1.0 - smoothstep(0.03, 0.08, edge);

        // Player proximity glow (soft radial light around player)
        float playerRadius = 4.0;
        float playerGlow = 0.0;
        vec3 playerGlowColor = vec3(0.2, 0.6, 0.9);
        for (int i = 0; i < 4; i++) {
            if (i >= uPlayerCount) break;
            vec3 pPos = uPlayerPositions[i];
            float cosAngle = dot(normalize(pos), normalize(pPos));
            float arcDist = acos(clamp(cosAngle, -1.0, 1.0)) * uSphereRadius;
            float glow = exp(-arcDist * arcDist / (playerRadius * playerRadius));
            if (glow > playerGlow) {
                playerGlow = glow;
                playerGlowColor = uPlayerColors[i];
            }
        }

        // Wake trail — additive ribbon that builds brightness along the path center
        // Each point contributes a tight glow; overlapping points along the path
        // create a bright core that fades at the edges (like a boat wake)
        float wakeGlow = 0.0;
        vec3 wakeColor = vec3(0.0);
        float wakeWeight = 0.0;
        for (int i = 0; i < ${TRAIL_LENGTH}; i++) {
            if (i >= uTrailCount) break;
            vec3 tPos = uTrailPositions[i];
            float age = uTrailAges[i];
            float cosAngle = dot(normalize(pos), normalize(tPos));
            float arcDist = acos(clamp(cosAngle, -1.0, 1.0)) * uSphereRadius;

            // Tight per-point radius that grows slightly with age
            float pointRadius = 1.2 + age * 1.5;
            float falloff = exp(-arcDist * arcDist / (pointRadius * pointRadius));
            // Fade intensity with age
            float fade = 1.0 - age;
            float intensity = falloff * fade;

            // Additive — overlapping points along path build up brightness
            wakeGlow += intensity * 0.15;
            wakeColor += uTrailColors[i] * intensity;
            wakeWeight += intensity;
        }
        if (wakeWeight > 0.0) {
            wakeColor /= wakeWeight;
        }
        wakeGlow = min(wakeGlow, 1.0);

        // Total illumination from player + wake
        float illumination = max(playerGlow, wakeGlow);

        // Darkness consumes from south pole upward
        float darknessThreshold = mix(-1.0, 1.0, uDarknessLevel);
        float darkness = smoothstep(darknessThreshold + 0.1, darknessThreshold - 0.1, normal.y);

        // Combine — illumination reveals the surface texture, not a colored overlay
        float pulse = sin(uTime * 0.4) * 0.05 + 0.95;
        vec3 gridColor = uEmissiveColor * grid * 0.5 * pulse;

        // The surface texture at full brightness
        vec3 fullSurface = uSurfaceColor * 0.8 + gridColor;
        // Dark unlit surface
        vec3 darkSurface = uSurfaceColor * 0.03;
        // Illuminate by revealing the actual texture
        vec3 surfaceColor = mix(darkSurface, fullSurface, illumination);

        // Subtle player color tint (just a hint, not an overlay)
        vec3 tintColor = mix(playerGlowColor, wakeColor, step(playerGlow, wakeGlow));
        surfaceColor += tintColor * illumination * 0.08;

        // Faint grid glow even in darkness for spatial reference
        surfaceColor += uEmissiveColor * grid * 0.03;

        vec3 voidColor = vec3(0.0, 0.0, 0.003);
        vec3 finalColor = mix(surfaceColor, voidColor, darkness);
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export interface PlanetoidProps {
    map: MapConfig;
}

/**
 * The main spherical arena surface with cellular grid shader,
 * player-reactive glow, wake trail, and darkness consumption.
 */
export function PlanetoidNode(props: PlanetoidProps) {
    const { map } = props;

    const trailPositions = Array.from(
        { length: TRAIL_LENGTH },
        () => new THREE.Vector3(),
    );
    const trailAges = new Float32Array(TRAIL_LENGTH);
    const trailColors = Array.from(
        { length: TRAIL_LENGTH },
        () => new THREE.Vector3(),
    );

    const uniforms = {
        uTime: { value: 0 },
        uDarknessLevel: { value: 0 },
        uSurfaceColor: { value: new THREE.Color(map.surfaceColor) },
        uEmissiveColor: { value: new THREE.Color(map.emissiveColor) },
        uPlayerPositions: {
            value: [
                new THREE.Vector3(),
                new THREE.Vector3(),
                new THREE.Vector3(),
                new THREE.Vector3(),
            ],
        },
        uPlayerColors: {
            value: [
                new THREE.Vector3(),
                new THREE.Vector3(),
                new THREE.Vector3(),
                new THREE.Vector3(),
            ],
        },
        uPlayerCount: { value: 0 },
        uSphereRadius: { value: map.sphereRadius },
        uTrailPositions: { value: trailPositions },
        uTrailAges: { value: trailAges },
        uTrailColors: { value: trailColors },
        uTrailCount: { value: 0 },
    };

    useCustomMesh({
        geometry: () => new THREE.SphereGeometry(map.sphereRadius, 64, 48),
        material: () =>
            new THREE.ShaderMaterial({
                vertexShader: SURFACE_VERTEX,
                fragmentShader: SURFACE_FRAGMENT,
                uniforms,
            }),
    });

    // Trail management
    let trailCount = 0;
    const TRAIL_SPACING = 0.25; // min distance between trail points
    const TRAIL_LIFETIME = 2.5; // seconds before trail fully fades
    const lastTrailPos = new THREE.Vector3();
    let hasLastPos = false;

    useFrameUpdate((dt) => {
        uniforms.uTime.value += dt;

        // Age existing trail points
        for (let i = 0; i < trailCount; i++) {
            trailAges[i] += dt / TRAIL_LIFETIME;
        }

        // Remove fully faded points from the end
        while (trailCount > 0 && trailAges[trailCount - 1] >= 1.0) {
            trailCount--;
        }

        uniforms.uTrailCount.value = trailCount;
    });

    return {
        uniforms,
        setDarknessLevel(level: number) {
            uniforms.uDarknessLevel.value = Math.max(0, Math.min(1, level));
        },
        setPlayerPosition(index: number, x: number, y: number, z: number) {
            uniforms.uPlayerPositions.value[index].set(x, y, z);
        },
        setPlayerColor(index: number, color: THREE.Color) {
            uniforms.uPlayerColors.value[index].set(color.r, color.g, color.b);
        },
        setPlayerCount(count: number) {
            uniforms.uPlayerCount.value = count;
        },
        addTrailPoint(x: number, y: number, z: number, color: THREE.Color) {
            if (hasLastPos) {
                const dx = x - lastTrailPos.x;
                const dy = y - lastTrailPos.y;
                const dz = z - lastTrailPos.z;
                if (
                    dx * dx + dy * dy + dz * dz <
                    TRAIL_SPACING * TRAIL_SPACING
                ) {
                    return;
                }
            }
            lastTrailPos.set(x, y, z);
            hasLastPos = true;

            // Shift existing points back (oldest fall off the end)
            for (let i = Math.min(trailCount, TRAIL_LENGTH - 1); i > 0; i--) {
                trailPositions[i].copy(trailPositions[i - 1]);
                trailAges[i] = trailAges[i - 1];
                trailColors[i].copy(trailColors[i - 1]);
            }

            // Insert new point at front
            trailPositions[0].set(x, y, z);
            trailAges[0] = 0;
            trailColors[0].set(color.r, color.g, color.b);
            trailCount = Math.min(trailCount + 1, TRAIL_LENGTH);
            uniforms.uTrailCount.value = trailCount;
        },
    };
}
