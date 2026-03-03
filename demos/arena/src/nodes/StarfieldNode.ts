import { useObject3D, useThreeContext } from '@pulse-ts/three';
import { useAnimate } from '@pulse-ts/effects';
import { useFrameUpdate } from '@pulse-ts/core';
import * as THREE from 'three';

/** Number of stars in the starfield. */
export const STAR_COUNT = 800;

/** Minimum radius of the sphere shell. */
export const STAR_RADIUS_MIN = 40;

/** Maximum radius of the sphere shell. */
export const STAR_RADIUS_MAX = 80;

/** Base point size for each star (at reference width). */
export const STAR_SIZE = 1.5;

/** Reference viewport width in pixels for star size scaling. */
export const STAR_SIZE_REFERENCE_WIDTH = 1920;

/** Opacity of the starfield. */
export const STAR_OPACITY = 0.6;

/** Rotation rate in radians per second. */
export const STAR_ROTATION_RATE = 0.02;

/** Twinkle speed in Hz (oscillations per second). */
export const STAR_TWINKLE_SPEED = 0.8;

/** Minimum opacity during twinkle trough (0 = fully invisible). */
export const STAR_TWINKLE_MIN = 0.15;

/**
 * Create a Float32Array of random star positions on a sphere shell
 * with upper-hemisphere bias.
 *
 * @param count - Number of stars.
 * @param rMin  - Minimum shell radius.
 * @param rMax  - Maximum shell radius.
 * @returns A `Float32Array` of length `count * 3` (xyz triples).
 *
 * @example
 * ```ts
 * const positions = createStarPositions(100, 40, 80);
 * geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 * ```
 */
export function createStarPositions(
    count: number,
    rMin: number,
    rMax: number,
): Float32Array {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = rMin + Math.random() * (rMax - rMin);
        // Full sphere distribution
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = Math.random() * Math.PI * 2;

        const sinTheta = Math.sin(theta);
        const idx = i * 3;
        positions[idx] = r * sinTheta * Math.cos(phi);
        positions[idx + 1] = r * Math.cos(theta);
        positions[idx + 2] = r * sinTheta * Math.sin(phi);
    }
    return positions;
}

/**
 * Distant starfield backdrop using `THREE.Points` on a large sphere shell.
 *
 * ~800 random points scattered across the upper hemisphere, slowly rotating
 * to give a subtle sense of depth and motion in the background.
 */
export function StarfieldNode() {
    const positions = createStarPositions(
        STAR_COUNT,
        STAR_RADIUS_MIN,
        STAR_RADIUS_MAX,
    );

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Random phase per star for independent twinkle timing
    const phases = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
        phases[i] = Math.random() * Math.PI * 2;
    }
    geometry.setAttribute(
        'aTwinklePhase',
        new THREE.BufferAttribute(phases, 1),
    );

    const timeUniform = { value: 0 };

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: STAR_SIZE,
        sizeAttenuation: false,
        fog: false,
        transparent: true,
        opacity: STAR_OPACITY,
        depthWrite: false,
    });

    // Patch shader to oscillate per-star opacity using the phase attribute
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = timeUniform;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `#include <common>
            attribute float aTwinklePhase;
            varying float vTwinkle;
            uniform float uTime;`,
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            vTwinkle = ${STAR_TWINKLE_MIN.toFixed(2)} + ${(1.0 - STAR_TWINKLE_MIN).toFixed(2)} * (0.5 + 0.5 * sin(uTime * ${(STAR_TWINKLE_SPEED * Math.PI * 2).toFixed(2)} + aTwinklePhase));`,
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `#include <common>
            varying float vTwinkle;`,
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <premultiplied_alpha_fragment>',
            `#include <premultiplied_alpha_fragment>
            gl_FragColor.a *= vTwinkle;`,
        );
    };

    const points = new THREE.Points(geometry, material);
    useObject3D(points);

    const { renderer } = useThreeContext();
    const spin = useAnimate({ rate: STAR_ROTATION_RATE });

    useFrameUpdate((dt) => {
        points.rotation.y = spin.value;
        timeUniform.value += dt;

        // Scale star size with viewport width
        const width = renderer.domElement.clientWidth;
        material.size = STAR_SIZE * (width / STAR_SIZE_REFERENCE_WIDTH);
    });
}
