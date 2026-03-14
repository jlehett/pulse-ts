import { useCustomMesh } from '@pulse-ts/three';
import { useFrameUpdate } from '@pulse-ts/core';
import * as THREE from 'three';
import { isMobileDevice } from '../isMobileDevice';

/** Radius of the nebula sphere (beyond the starfield shell). */
export const NEBULA_RADIUS = 90;

/** Animation speed multiplier for the swirl drift. */
export const NEBULA_SPEED = 0.03;

/** Overall brightness/intensity of the nebula effect (0–1). */
export const NEBULA_INTENSITY = 0.35;

/** Deep purple base color (hex). */
export const NEBULA_COLOR_DEEP = 0x1a0a2e;

/** Bright purple highlight color (hex). */
export const NEBULA_COLOR_BRIGHT = 0x7b2fbe;

/** FBM octaves — 4 on desktop, 2 on mobile for performance. */
export const NEBULA_FBM_OCTAVES_DESKTOP = 4;

/** FBM octaves on mobile. */
export const NEBULA_FBM_OCTAVES_MOBILE = 2;

/** Sphere geometry segment count — desktop. */
const NEBULA_SEGMENTS_DESKTOP = 32;

/** Sphere geometry segment count — mobile (fewer triangles). */
const NEBULA_SEGMENTS_MOBILE = 16;

const vertexShader = /* glsl */ `
varying vec3 vWorldPos;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

/**
 * Build the nebula fragment shader with a configurable FBM octave count.
 * GLSL requires static loop bounds, so octaves are baked at shader creation.
 *
 * @param octaves - Number of FBM octaves (2 for mobile, 4 for desktop).
 * @returns GLSL fragment shader source.
 */
export function buildNebulaFragmentShader(octaves: number): string {
    return /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColorDeep;
uniform vec3 uColorBright;

varying vec3 vWorldPos;

// Simple 3D hash
vec3 hash3(vec3 p) {
    p = vec3(
        dot(p, vec3(127.1, 311.7, 74.7)),
        dot(p, vec3(269.5, 183.3, 246.1)),
        dot(p, vec3(113.5, 271.9, 124.6))
    );
    return fract(sin(p) * 43758.5453123);
}

// 3D value noise
float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n = mix(
        mix(
            mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), f.x),
            mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), f.x),
            f.y),
        mix(
            mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), f.x),
            mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), f.x),
            f.y),
        f.z);

    return n * 0.5 + 0.5;
}

// Fractal Brownian Motion (${octaves} octaves)
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < ${octaves}; i++) {
        value += amplitude * noise3D(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    // Normalize world position to get direction on sphere
    vec3 dir = normalize(vWorldPos);

    // Slow drift through noise space
    vec3 p = dir * 2.0 + vec3(uTime * 0.4, uTime * 0.15, uTime * -0.25);

    // Layered FBM for swirl structure
    float n1 = fbm(p);
    float n2 = fbm(p + vec3(5.2, 1.3, 2.8) + n1 * 0.8);

    // Combine layers for swirl effect
    float swirl = smoothstep(0.3, 0.7, n2);

    // Color mix: deep purple → bright purple based on swirl intensity
    vec3 color = mix(uColorDeep, uColorBright, swirl * 0.6);

    // Always show the deep purple base; swirl adds brightness on top
    float alpha = mix(uIntensity * 0.5, uIntensity, swirl);

    gl_FragColor = vec4(color, alpha);
}
`;
}

/**
 * Animated nebula background — a large `BackSide` sphere with procedural
 * FBM noise producing a subtle purple swirl behind the starfield.
 *
 * @example
 * ```ts
 * useChild(NebulaNode);
 * ```
 */
export function NebulaNode() {
    const mobile = isMobileDevice();
    const deepColor = new THREE.Color(NEBULA_COLOR_DEEP);
    const brightColor = new THREE.Color(NEBULA_COLOR_BRIGHT);

    const uniforms = {
        uTime: { value: 0 },
        uIntensity: { value: NEBULA_INTENSITY },
        uColorDeep: { value: deepColor },
        uColorBright: { value: brightColor },
    };

    const octaves = mobile
        ? NEBULA_FBM_OCTAVES_MOBILE
        : NEBULA_FBM_OCTAVES_DESKTOP;
    const segments = mobile ? NEBULA_SEGMENTS_MOBILE : NEBULA_SEGMENTS_DESKTOP;

    useCustomMesh({
        geometry: () =>
            new THREE.SphereGeometry(NEBULA_RADIUS, segments, segments),
        material: () =>
            new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader: buildNebulaFragmentShader(octaves),
                uniforms,
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false,
                fog: false,
            }),
    });

    useFrameUpdate((dt) => {
        uniforms.uTime.value += dt * NEBULA_SPEED;
    });
}
