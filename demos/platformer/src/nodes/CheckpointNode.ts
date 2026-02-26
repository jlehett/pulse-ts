import * as THREE from 'three';
import { useComponent, Transform, getComponent, useContext } from '@pulse-ts/core';
import { useRigidBody, useSphereCollider, useOnCollisionStart } from '@pulse-ts/physics';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';
import { PlayerTag } from '../components/PlayerTag';
import { RespawnCtx } from '../contexts';

const PILLAR_RADIUS = 0.15;
const PILLAR_HEIGHT = 2.0;
const TRIGGER_RADIUS = 1.0;

const INACTIVE_COLOR = 0x556677;
const INACTIVE_EMISSIVE = 0x223344;
const INACTIVE_EMISSIVE_INTENSITY = 0.2;

const ACTIVE_COLOR = 0x00ff88;
const ACTIVE_EMISSIVE = 0x00ff88;
const ACTIVE_EMISSIVE_INTENSITY = 0.8;

/** Tracks which checkpoint is currently active so the previous one can be deactivated. */
let activeCheckpointMaterial: THREE.MeshStandardMaterial | null = null;

/**
 * Resets the active checkpoint tracking. Useful for testing.
 */
export function resetActiveCheckpoint(): void {
    activeCheckpointMaterial = null;
}

export interface CheckpointNodeProps {
    position: [number, number, number];
}

/**
 * Checkpoint pillar that updates the player's respawn position on contact.
 *
 * Renders a tall thin cylinder that changes from dim blue-gray to bright green
 * when activated. Only the most recently activated checkpoint glows.
 *
 * @param props - Checkpoint world position.
 *
 * @example
 * ```ts
 * import { useChild } from '@pulse-ts/core';
 * import { CheckpointNode } from './CheckpointNode';
 *
 * useChild(CheckpointNode, { position: [18, 3, -1] });
 * ```
 */
export function CheckpointNode(props: Readonly<CheckpointNodeProps>) {
    const respawnState = useContext(RespawnCtx);
    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    useRigidBody({ type: 'static' });
    useSphereCollider(TRIGGER_RADIUS, { isTrigger: true });

    // Visual — tall thin cylinder
    const root = useThreeRoot();
    const geometry = new THREE.CylinderGeometry(
        PILLAR_RADIUS,
        PILLAR_RADIUS,
        PILLAR_HEIGHT,
        8,
    );
    const material = new THREE.MeshStandardMaterial({
        color: INACTIVE_COLOR,
        emissive: INACTIVE_EMISSIVE,
        emissiveIntensity: INACTIVE_EMISSIVE_INTENSITY,
        roughness: 0.4,
        metalness: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // Shift mesh up so the base sits at the node origin
    mesh.position.y = PILLAR_HEIGHT / 2;
    mesh.castShadow = true;
    useObject3D(mesh);

    // Position root at transform
    root.position.set(...props.position);

    let activated = false;

    useOnCollisionStart(({ other }) => {
        if (!getComponent(other, PlayerTag)) return;
        if (activated) return;

        activated = true;

        // Deactivate the previous active checkpoint
        if (activeCheckpointMaterial && activeCheckpointMaterial !== material) {
            activeCheckpointMaterial.color.setHex(INACTIVE_COLOR);
            activeCheckpointMaterial.emissive.setHex(INACTIVE_EMISSIVE);
            activeCheckpointMaterial.emissiveIntensity = INACTIVE_EMISSIVE_INTENSITY;
        }

        // Activate this checkpoint
        material.color.setHex(ACTIVE_COLOR);
        material.emissive.setHex(ACTIVE_EMISSIVE);
        material.emissiveIntensity = ACTIVE_EMISSIVE_INTENSITY;
        activeCheckpointMaterial = material;

        // Update respawn position (slightly above so player doesn't clip into ground)
        respawnState.position = [
            props.position[0],
            props.position[1] + 1.0,
            props.position[2],
        ];
    });
}
