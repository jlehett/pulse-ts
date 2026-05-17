import * as THREE from 'three';
import { useFrameUpdate } from '@pulse-ts/core';
import { useCustomMesh } from '@pulse-ts/three';
import type { MapConfig } from '../../config/maps';

const SURFACE_VERTEX = /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec2 vUv;

    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const SURFACE_FRAGMENT = /* glsl */ `
    uniform float uTime;
    uniform float uDarknessLevel;
    uniform vec3 uSurfaceColor;
    uniform vec3 uEmissiveColor;
    uniform vec3 uPlayerPositions[4];
    uniform int uPlayerCount;
    uniform float uSphereRadius;

    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec2 vUv;

    // Hex distance for a single 2D coordinate
    float hexDist(vec2 uv) {
        vec2 h = vec2(1.0, 1.732);
        vec2 a = mod(uv, h) - h * 0.5;
        vec2 b = mod(uv - h * 0.5, h) - h * 0.5;
        vec2 g = length(a) < length(b) ? a : b;
        return length(g);
    }

    float hexLine(vec2 uv) {
        float d = hexDist(uv);
        return smoothstep(0.02, 0.05, abs(d - 0.4));
    }

    // Tri-planar hex grid — projects from 3 planes, blends by normal weight
    float hexGridTriplanar(vec3 pos, float scale) {
        vec3 n = abs(normalize(pos));
        // Sharpen blending weights
        vec3 w = pow(n, vec3(4.0));
        w /= (w.x + w.y + w.z);

        // Project onto each plane
        float hXY = hexLine(pos.xy * scale);
        float hXZ = hexLine(pos.xz * scale);
        float hYZ = hexLine(pos.yz * scale);

        return hXY * w.z + hXZ * w.y + hYZ * w.x;
    }

    void main() {
        vec3 pos = vWorldPos;
        vec3 normal = normalize(pos);

        // Hex grid pattern via tri-planar projection (no pole stretching)
        float grid = 1.0 - hexGridTriplanar(pos, 1.0);

        // Player proximity glow
        float playerGlow = 0.0;
        for (int i = 0; i < 4; i++) {
            if (i >= uPlayerCount) break;
            vec3 pPos = uPlayerPositions[i];
            float cosAngle = dot(normalize(pos), normalize(pPos));
            float arcDist = acos(clamp(cosAngle, -1.0, 1.0)) * uSphereRadius;
            playerGlow += 0.4 / (1.0 + arcDist * arcDist * 0.08);
        }
        playerGlow = min(playerGlow, 1.0);

        // Darkness consumes from south pole upward
        float darknessThreshold = mix(-1.0, 1.0, uDarknessLevel);
        float darkness = smoothstep(darknessThreshold + 0.1, darknessThreshold - 0.1, normal.y);

        // Combine
        float pulse = sin(uTime * 0.4) * 0.05 + 0.95;
        vec3 gridColor = uEmissiveColor * grid * 0.6 * pulse;
        vec3 glowColor = vec3(0.2, 0.6, 0.9) * playerGlow;
        vec3 baseColor = uSurfaceColor;

        vec3 litColor = baseColor + gridColor + glowColor;
        vec3 darkColor = vec3(0.0, 0.0, 0.005);

        vec3 finalColor = mix(litColor, darkColor, darkness);
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export interface PlanetoidProps {
    map: MapConfig;
}

/**
 * The main spherical arena surface with hex-grid shader,
 * player-reactive glow, and darkness consumption effect.
 */
export function PlanetoidNode(props: PlanetoidProps) {
    const { map } = props;

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
        uPlayerCount: { value: 0 },
        uSphereRadius: { value: map.sphereRadius },
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

    useFrameUpdate((dt) => {
        uniforms.uTime.value += dt;
    });

    return {
        uniforms,
        setDarknessLevel(level: number) {
            uniforms.uDarknessLevel.value = Math.max(0, Math.min(1, level));
        },
        setPlayerPosition(index: number, x: number, y: number, z: number) {
            uniforms.uPlayerPositions.value[index].set(x, y, z);
        },
        setPlayerCount(count: number) {
            uniforms.uPlayerCount.value = count;
        },
    };
}
