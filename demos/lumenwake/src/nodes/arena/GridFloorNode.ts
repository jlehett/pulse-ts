import * as THREE from 'three';
import { useFrameUpdate, useService } from '@pulse-ts/core';
import { useCustomMesh } from '@pulse-ts/three';
import { ThreeService } from '@pulse-ts/three';
import type { MapConfig } from '../../config/maps';

const GRID_VERTEX = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const GRID_FRAGMENT = /* glsl */ `
    uniform float uTime;
    uniform float uBoundaryRadius;
    uniform int uBoundaryShape; // 0=circle, 1=rect, 2=hex
    uniform vec3 uPlayerPositions[4];
    uniform int uPlayerCount;

    varying vec2 vUv;
    varying vec3 vWorldPos;

    float hexDistance(vec2 p) {
        p = abs(p);
        return max(p.x * 0.866025 + p.y * 0.5, p.y);
    }

    float hexGrid(vec2 p, float scale) {
        p *= scale;
        vec2 h = vec2(1.0, 1.732);
        vec2 a = mod(p, h) - h * 0.5;
        vec2 b = mod(p - h * 0.5, h) - h * 0.5;
        vec2 g = length(a) < length(b) ? a : b;
        float d = length(g);
        return smoothstep(0.02, 0.04, abs(d - 0.4));
    }

    float getBoundaryDist(vec2 pos) {
        if (uBoundaryShape == 0) {
            return length(pos) / uBoundaryRadius;
        } else if (uBoundaryShape == 1) {
            vec2 d = abs(pos) / vec2(uBoundaryRadius, uBoundaryRadius * 0.7);
            return max(d.x, d.y);
        } else {
            return hexDistance(pos) / uBoundaryRadius;
        }
    }

    void main() {
        vec2 pos = vWorldPos.xz;
        float boundaryDist = getBoundaryDist(pos);

        // Base grid pattern
        float grid = 1.0 - hexGrid(pos, 0.8);

        // Fade at boundary
        float edgeFade = 1.0 - smoothstep(0.7, 1.0, boundaryDist);

        // Player proximity glow
        float playerGlow = 0.0;
        for (int i = 0; i < 4; i++) {
            if (i >= uPlayerCount) break;
            vec2 pPos = uPlayerPositions[i].xz;
            float dist = length(pos - pPos);
            playerGlow += 0.3 / (1.0 + dist * dist * 0.1);
        }
        playerGlow = min(playerGlow, 1.0);

        // Combine
        float pulse = sin(uTime * 0.5) * 0.05 + 0.95;
        vec3 gridColor = vec3(0.05, 0.12, 0.2) * grid * edgeFade * pulse;
        vec3 glowColor = vec3(0.1, 0.4, 0.6) * playerGlow * edgeFade;
        vec3 baseColor = vec3(0.01, 0.01, 0.02);

        // Outside boundary = pure darkness
        float outside = step(1.0, boundaryDist);
        vec3 finalColor = mix(baseColor + gridColor + glowColor, vec3(0.0), outside);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export interface GridFloorProps {
    map: MapConfig;
}

/**
 * Hex-grid arena floor with boundary visualization and player-reactive glow.
 */
export function GridFloorNode(props: GridFloorProps) {
    const { map } = props;

    const shapeInt =
        map.boundaryShape === 'circle' ? 0 :
        map.boundaryShape === 'rectangle' ? 1 : 2;

    const uniforms = {
        uTime: { value: 0 },
        uBoundaryRadius: { value: map.boundaryRadius },
        uBoundaryShape: { value: shapeInt },
        uPlayerPositions: {
            value: [
                new THREE.Vector3(),
                new THREE.Vector3(),
                new THREE.Vector3(),
                new THREE.Vector3(),
            ],
        },
        uPlayerCount: { value: 0 },
    };

    const { root } = useCustomMesh({
        geometry: () => {
            const size = map.boundaryRadius * 2.5;
            return new THREE.PlaneGeometry(size, size, 1, 1);
        },
        material: () =>
            new THREE.ShaderMaterial({
                vertexShader: GRID_VERTEX,
                fragmentShader: GRID_FRAGMENT,
                uniforms,
            }),
    });

    root.rotation.x = -Math.PI / 2;
    root.position.y = -0.01;

    useFrameUpdate((dt) => {
        uniforms.uTime.value += dt;
    });

    return { uniforms };
}
