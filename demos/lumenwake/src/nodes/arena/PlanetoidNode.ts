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

    // Hex grid on sphere surface using world-space normals
    float hexGrid(vec3 pos, float scale) {
        // Project to 2D using equirectangular-ish mapping
        float theta = acos(clamp(normalize(pos).y, -1.0, 1.0));
        float phi = atan(pos.z, pos.x);
        vec2 uv = vec2(phi / 6.2832, theta / 3.14159) * scale;

        vec2 h = vec2(1.0, 1.732);
        vec2 a = mod(uv, h) - h * 0.5;
        vec2 b = mod(uv - h * 0.5, h) - h * 0.5;
        vec2 g = length(a) < length(b) ? a : b;
        float d = length(g);
        return smoothstep(0.02, 0.05, abs(d - 0.4));
    }

    void main() {
        vec3 pos = vWorldPos;
        vec3 normal = normalize(pos);

        // Hex grid pattern
        float grid = 1.0 - hexGrid(pos, 12.0);

        // Player proximity glow
        float playerGlow = 0.0;
        for (int i = 0; i < 4; i++) {
            if (i >= uPlayerCount) break;
            vec3 pPos = uPlayerPositions[i];
            // Great-circle distance on sphere surface
            float cosAngle = dot(normalize(pos), normalize(pPos));
            float arcDist = acos(clamp(cosAngle, -1.0, 1.0)) * uSphereRadius;
            playerGlow += 0.4 / (1.0 + arcDist * arcDist * 0.08);
        }
        playerGlow = min(playerGlow, 1.0);

        // Darkness consumes from south pole upward
        // normal.y ranges from -1 (south) to +1 (north)
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
