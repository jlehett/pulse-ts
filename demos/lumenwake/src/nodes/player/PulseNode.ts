import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useCustomMesh } from '@pulse-ts/three';

const PULSE_LIFETIME = 0.35;

export interface PulseProps {
    origin: THREE.Vector3;
    maxRadius: number;
    damage: number;
    color: number;
    sphereRadius: number;
    onPositionUpdate?: (position: THREE.Vector3) => void;
    onExpired?: () => void;
}

/**
 * Short-range expanding pulse that radiates outward from the player
 * on the sphere surface. Used as Ward's primary attack.
 */
export function PulseNode(props: PulseProps) {
    const { origin, maxRadius, color } = props;

    const world = useWorld();
    const node = useNode();

    const threeColor = new THREE.Color(color);

    let lifetime = 0;
    let destroyed = false;

    const uniforms = {
        uColor: { value: threeColor },
        uProgress: { value: 0 },
        uMaxRadius: { value: maxRadius },
        uMinRadius: { value: maxRadius * 0.25 },
    };

    const { root } = useCustomMesh({
        geometry: () => new THREE.RingGeometry(0.1, 1.0, 32),
        material: () =>
            new THREE.ShaderMaterial({
                uniforms,
                vertexShader: /* glsl */ `
                    uniform float uProgress;
                    uniform float uMaxRadius;
                    uniform float uMinRadius;
                    varying float vEdge;

                    void main() {
                        float innerR = uMinRadius + uProgress * (uMaxRadius * 0.7 - uMinRadius);
                        float outerR = uMinRadius + uProgress * (uMaxRadius - uMinRadius);
                        float t = (position.x * position.x + position.y * position.y);
                        float r = sqrt(t);
                        float mapped = mix(innerR, outerR, (r - 0.1) / 0.9);
                        vec3 pos = normalize(vec3(
                            position.x / max(r, 0.001) * mapped,
                            0.0,
                            position.y / max(r, 0.001) * mapped
                        )) * mapped;
                        pos.y = 0.0;
                        vEdge = (r - 0.1) / 0.9;

                        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
                        gl_Position = projectionMatrix * viewMatrix * worldPos;
                    }
                `,
                fragmentShader: /* glsl */ `
                    uniform vec3 uColor;
                    uniform float uProgress;
                    varying float vEdge;

                    void main() {
                        float fade = 1.0 - uProgress;
                        float ring = smoothstep(0.0, 0.3, vEdge) * smoothstep(1.0, 0.6, vEdge);
                        float alpha = ring * fade * 0.9;
                        if (alpha < 0.01) discard;
                        gl_FragColor = vec4(uColor * 2.0, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                toneMapped: false,
            }),
    });

    const normal = origin.clone().normalize();
    root.position.copy(origin).addScaledVector(normal, 0.15);
    const ref =
        Math.abs(normal.y) < 0.99
            ? new THREE.Vector3(0, 1, 0)
            : new THREE.Vector3(1, 0, 0);
    const tangentX = new THREE.Vector3().crossVectors(normal, ref).normalize();
    const tangentZ = new THREE.Vector3()
        .crossVectors(tangentX, normal)
        .normalize();
    const basis = new THREE.Matrix4().makeBasis(tangentX, normal, tangentZ);
    root.quaternion.setFromRotationMatrix(basis);

    useFrameUpdate((dt) => {
        if (destroyed) return;

        lifetime += dt;

        if (lifetime >= PULSE_LIFETIME) {
            destroyed = true;
            props.onExpired?.();
            world.remove(node);
            return;
        }

        const progress = lifetime / PULSE_LIFETIME;
        uniforms.uProgress.value = progress;

        props.onPositionUpdate?.(origin);
    });

    return {
        position: origin,
        damage: props.damage,
        get radius() {
            const progress = Math.min(lifetime / PULSE_LIFETIME, 1);
            return props.maxRadius * progress;
        },
        get alive() {
            return !destroyed;
        },
    };
}
