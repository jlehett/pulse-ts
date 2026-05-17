import * as THREE from 'three';
import { useFrameUpdate } from '@pulse-ts/core';
import { useCustomMesh } from '@pulse-ts/three';
import type { MapConfig } from '../../config/maps';

const EDGE_VERTEX = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const EDGE_FRAGMENT = /* glsl */ `
    uniform float uBoundaryRadius;
    uniform float uCurrentRadius;
    uniform int uBoundaryShape;
    uniform float uTime;

    varying vec2 vUv;
    varying vec3 vWorldPos;

    float hexDistance(vec2 p) {
        p = abs(p);
        return max(p.x * 0.866025 + p.y * 0.5, p.y);
    }

    float getShapeDist(vec2 pos) {
        if (uBoundaryShape == 0) {
            return length(pos);
        } else if (uBoundaryShape == 1) {
            return max(abs(pos.x), abs(pos.y) / 0.7);
        } else {
            return hexDistance(pos);
        }
    }

    void main() {
        vec2 pos = vWorldPos.xz;
        float dist = getShapeDist(pos);

        // Edge ring effect
        float edgeDist = abs(dist - uCurrentRadius);
        float pulse = sin(uTime * 2.0 + dist * 0.5) * 0.3 + 0.7;
        float ring = smoothstep(1.5, 0.0, edgeDist) * pulse;

        // Warning zone (inner glow when boundary is close)
        float warnZone = smoothstep(uCurrentRadius - 3.0, uCurrentRadius, dist);
        float warn = warnZone * 0.15 * (sin(uTime * 3.0) * 0.5 + 0.5);

        // Outside = full darkness
        float outside = smoothstep(uCurrentRadius - 0.5, uCurrentRadius + 0.5, dist);

        vec3 edgeColor = vec3(0.2, 0.5, 1.0) * ring;
        vec3 warnColor = vec3(0.8, 0.2, 0.1) * warn;
        vec3 darkColor = vec3(0.0);

        vec3 color = edgeColor + warnColor;
        float alpha = max(ring * 0.8, max(warn, outside * 0.9));

        gl_FragColor = vec4(mix(color, darkColor, outside), alpha);
    }
`;

export interface DarknessEdgeProps {
    map: MapConfig;
}

/**
 * Visual boundary ring that pulses and can contract over time.
 */
export function DarknessEdgeNode(props: DarknessEdgeProps) {
    const { map } = props;

    const shapeInt =
        map.boundaryShape === 'circle' ? 0 :
        map.boundaryShape === 'rectangle' ? 1 : 2;

    const uniforms = {
        uBoundaryRadius: { value: map.boundaryRadius },
        uCurrentRadius: { value: map.boundaryRadius },
        uBoundaryShape: { value: shapeInt },
        uTime: { value: 0 },
    };

    const { root } = useCustomMesh({
        geometry: () => {
            const size = map.boundaryRadius * 3;
            return new THREE.PlaneGeometry(size, size, 1, 1);
        },
        material: () =>
            new THREE.ShaderMaterial({
                vertexShader: EDGE_VERTEX,
                fragmentShader: EDGE_FRAGMENT,
                uniforms,
                transparent: true,
                depthWrite: false,
            }),
    });

    root.rotation.x = -Math.PI / 2;
    root.position.y = 0.01;

    useFrameUpdate((dt) => {
        uniforms.uTime.value += dt;
    });

    return {
        setRadius(radius: number) {
            uniforms.uCurrentRadius.value = radius;
        },
    };
}
