import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useCustomMesh } from '@pulse-ts/three';
import { createGeodesicDisc } from '../../utils/geodesicDisc';
import type { PlayerState } from './LocalPlayerNode';

const SANCTUARY_LIFETIME = 6.0;
const SANCTUARY_RADIUS = 4.0;
const HEAL_PER_SECOND = 12;

export interface SanctuaryProps {
    origin: THREE.Vector3;
    color: number;
    sphereRadius: number;
    playerState: PlayerState;
}

export function SanctuaryNode(props: SanctuaryProps) {
    const { origin, color, sphereRadius, playerState } = props;
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

    const discGeo = createGeodesicDisc(origin, SANCTUARY_RADIUS, sphereRadius);

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
                        float border = step(0.92, dist) * 0.6;

                        // Inward-flowing concentric rings (healing draws you in)
                        float ring = step(0.45, fract(dist * 5.0 + uTime * 1.2)) * 0.2;
                        ring *= step(dist, 0.92);

                        // Cross / plus motif at center
                        float ax = abs(center.x);
                        float ay = abs(center.y);
                        float crossArm = step(min(ax, ay), 0.012) * step(dist, 0.35) * 0.4;

                        // Gentle center glow
                        float centerGlow = max(0.0, 1.0 - dist * 1.5) * 0.2;

                        // Inner circle marker
                        float innerRing = step(0.33, dist) * step(dist, 0.36) * 0.3;

                        float alpha = (border + ring + crossArm + centerGlow + innerRing) * uFade * 0.2;
                        if (alpha < 0.01) discard;
                        vec3 col = uColor * (1.8 + centerGlow * 2.0);
                        gl_FragColor = vec4(col, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                toneMapped: false,
            }),
    });

    const healRangeAngle = SANCTUARY_RADIUS / sphereRadius;

    useFrameUpdate((dt) => {
        if (destroyed) return;

        lifetime += dt;

        if (lifetime >= SANCTUARY_LIFETIME) {
            destroyed = true;
            world.remove(node);
            return;
        }

        uniforms.uTime.value = lifetime;

        if (lifetime < 0.3) {
            uniforms.uFade.value = lifetime / 0.3;
        } else if (lifetime > SANCTUARY_LIFETIME - 1.0) {
            uniforms.uFade.value = (SANCTUARY_LIFETIME - lifetime) / 1.0;
        } else {
            uniforms.uFade.value = 1;
        }

        const originNorm = origin.clone().normalize();
        const playerNorm = playerState.position.clone().normalize();
        const angle = Math.acos(
            Math.min(1, Math.max(-1, originNorm.dot(playerNorm))),
        );
        if (angle <= healRangeAngle) {
            playerState.health = Math.min(
                playerState.maxHealth,
                playerState.health + HEAL_PER_SECOND * dt,
            );
        }
    });
}
