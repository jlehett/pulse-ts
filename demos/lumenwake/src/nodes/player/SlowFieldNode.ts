import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useCustomMesh } from '@pulse-ts/three';
import { createGeodesicDisc } from '../../utils/geodesicDisc';

const FIELD_LIFETIME = 4.0;
const FIELD_RADIUS = 5.0;

export interface SlowFieldProps {
    origin: THREE.Vector3;
    color: number;
    sphereRadius: number;
}

export function SlowFieldNode(props: SlowFieldProps) {
    const { origin, color, sphereRadius } = props;
    const world = useWorld();
    const node = useNode();
    const threeColor = new THREE.Color(color);

    let lifetime = 0;
    let destroyed = false;

    const uniforms = {
        uColor: { value: threeColor },
        uTime: { value: 0 },
        uFade: { value: 0 },
    };

    const discGeo = createGeodesicDisc(origin, FIELD_RADIUS, sphereRadius);

    useCustomMesh({
        geometry: () => discGeo,
        material: () =>
            new THREE.ShaderMaterial({
                uniforms,
                vertexShader: /* glsl */ `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: /* glsl */ `
                    uniform vec3 uColor;
                    uniform float uTime;
                    uniform float uFade;
                    varying vec2 vUv;

                    void main() {
                        vec2 center = vUv - 0.5;
                        float dist = length(center) * 2.0;
                        float angle = atan(center.y, center.x);

                        // Sharp circular border
                        if (dist > 0.98) discard;
                        float border = step(0.92, dist) * 0.7;

                        // Radial spokes (8 spokes, rotating slowly)
                        float spokeAngle = mod(angle + uTime * 0.3, 6.28318) * 1.2732; // * 8 / 2pi
                        float spoke = step(fract(spokeAngle), 0.06) * step(0.15, dist) * step(dist, 0.92) * 0.3;

                        // Honeycomb / hex grid
                        vec2 hex = center * 12.0;
                        float hx = hex.x * 1.1547; // 2/sqrt(3)
                        float hz = hex.y + mod(floor(hx), 2.0) * 0.5;
                        float hEdge = length(fract(vec2(hx, hz)) - 0.5);
                        float hexGrid = step(0.38, hEdge) * 0.2 * step(dist, 0.90) * step(0.1, dist);

                        // Outward-pulsing wave (oppressive / expanding)
                        float wave = step(0.47, fract(dist * 4.0 - uTime * 0.8)) * 0.15;
                        wave *= step(dist, 0.92);

                        // Concentric dashed rings
                        float dashRing = step(0.48, fract(dist * 8.0)) * step(fract(dist * 8.0), 0.52);
                        dashRing *= step(0.48, fract(angle * 2.546 + dist * 3.0)); // break into dashes
                        dashRing *= 0.2 * step(dist, 0.92);

                        float alpha = (border + spoke + hexGrid + wave + dashRing) * uFade * 0.2;
                        if (alpha < 0.01) discard;
                        vec3 col = uColor * 1.6;
                        gl_FragColor = vec4(col, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                toneMapped: false,
            }),
    });

    useFrameUpdate((dt) => {
        if (destroyed) return;

        lifetime += dt;

        if (lifetime >= FIELD_LIFETIME) {
            destroyed = true;
            world.remove(node);
            return;
        }

        uniforms.uTime.value = lifetime;

        if (lifetime < 0.3) {
            uniforms.uFade.value = lifetime / 0.3;
        } else if (lifetime > FIELD_LIFETIME - 1.0) {
            uniforms.uFade.value = (FIELD_LIFETIME - lifetime) / 1.0;
        } else {
            uniforms.uFade.value = 1;
        }
    });
}
