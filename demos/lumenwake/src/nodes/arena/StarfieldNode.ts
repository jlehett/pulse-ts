import * as THREE from 'three';
import { useCustomMesh } from '@pulse-ts/three';

const STAR_COUNT = 3000;
const STAR_RADIUS = 200;

export function StarfieldNode() {
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const colors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = STAR_RADIUS;

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        sizes[i] = 0.5 + Math.random() * 1.5;

        // Slight color variation — warm white, cool white, blue-ish
        const temp = Math.random();
        if (temp < 0.7) {
            colors[i * 3] = 0.85 + Math.random() * 0.15;
            colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
            colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
        } else if (temp < 0.9) {
            colors[i * 3] = 0.6 + Math.random() * 0.2;
            colors[i * 3 + 1] = 0.7 + Math.random() * 0.2;
            colors[i * 3 + 2] = 1.0;
        } else {
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.85 + Math.random() * 0.1;
            colors[i * 3 + 2] = 0.6 + Math.random() * 0.2;
        }
    }

    useCustomMesh({
        type: 'points',
        geometry: () => {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute(
                'position',
                new THREE.BufferAttribute(positions, 3),
            );
            geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            return geo;
        },
        material: () =>
            new THREE.ShaderMaterial({
                vertexShader: /* glsl */ `
                    attribute float aSize;
                    varying vec3 vColor;
                    void main() {
                        vColor = color;
                        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = aSize * (300.0 / -mvPos.z);
                        gl_Position = projectionMatrix * mvPos;
                    }
                `,
                fragmentShader: /* glsl */ `
                    varying vec3 vColor;
                    void main() {
                        float d = length(gl_PointCoord - 0.5) * 2.0;
                        float alpha = 1.0 - smoothstep(0.0, 1.0, d);
                        alpha *= alpha;
                        if (alpha < 0.01) discard;
                        gl_FragColor = vec4(vColor * alpha, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: true,
            }),
    });
}
