import * as THREE from 'three';
import { useFrameUpdate } from '@pulse-ts/core';
import { usePointLight, useCustomMesh } from '@pulse-ts/three';
import type { MapConfig } from '../../config/maps';
import { PlanetoidNode } from './PlanetoidNode';
import { StarfieldNode } from './StarfieldNode';

export interface ArenaNodeProps {
    map: MapConfig;
}

const SUN_DISTANCE = 160;

/**
 * Top-level arena node. Composes the planetoid sphere,
 * starfield, sun, and ambient lighting.
 */
export function ArenaNode(props: ArenaNodeProps) {
    const { map } = props;

    const planetoid = PlanetoidNode({ map });
    StarfieldNode();
    SunNode({
        direction: planetoid.sunDir,
        sphereRadius: map.sphereRadius,
        getSunStrength: () => planetoid.getSunStrength(),
    });

    // Key light from above
    usePointLight({
        color: 0x6688ff,
        intensity: 3.0,
        distance: map.sphereRadius * 4,
        position: [0, map.sphereRadius * 2, 0],
    });

    // Fill light from below
    usePointLight({
        color: 0x223344,
        intensity: 1.0,
        distance: map.sphereRadius * 3,
        position: [0, -map.sphereRadius * 1.5, 0],
    });

    return { planetoid };
}

interface SunNodeProps {
    direction: THREE.Vector3;
    sphereRadius: number;
    getSunStrength: () => number;
}

function SunNode(props: SunNodeProps) {
    const sunUniforms = {
        uSunScale: { value: 1.0 },
    };

    const BILLBOARD_SIZE = 14;

    const { object } = useCustomMesh({
        geometry: () => new THREE.PlaneGeometry(BILLBOARD_SIZE, BILLBOARD_SIZE),
        material: () =>
            new THREE.ShaderMaterial({
                uniforms: sunUniforms,
                vertexShader: /* glsl */ `
                    uniform float uSunScale;
                    varying vec2 vUV;
                    void main() {
                        vUV = uv;
                        vec4 mvPos = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                        mvPos.xy += position.xy * ${BILLBOARD_SIZE.toFixed(1)} * uSunScale;
                        gl_Position = projectionMatrix * mvPos;
                    }
                `,
                fragmentShader: /* glsl */ `
                    uniform float uSunScale;
                    varying vec2 vUV;
                    void main() {
                        float d = length(vUV - 0.5) * 2.3;
                        float core = exp(-d * d * 7.0);
                        float glow = exp(-d * d * 1.5) * 0.35;
                        float bloom = exp(-d * d * 0.4) * 0.025;
                        float intensity = (core + glow + bloom) * uSunScale;
                        vec3 color = mix(vec3(1.0, 0.65, 0.3), vec3(1.0, 0.88, 0.7), core);
                        if (intensity < 0.008) discard;
                        gl_FragColor = vec4(color * intensity, intensity);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
            }),
    });

    object.frustumCulled = false;

    useFrameUpdate(() => {
        object.position.copy(props.direction).multiplyScalar(SUN_DISTANCE);
        sunUniforms.uSunScale.value = props.getSunStrength();
    });
}
