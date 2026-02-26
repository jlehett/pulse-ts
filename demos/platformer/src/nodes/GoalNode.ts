import * as THREE from 'three';
import {
    useComponent,
    useFrameUpdate,
    useWorld,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useSphereCollider, useOnCollisionStart } from '@pulse-ts/physics';
import { useThreeRoot, useObject3D, useThreeContext } from '@pulse-ts/three';

const GOAL_RADIUS = 0.6;
const SPIN_SPEED = 1.2;
const BOB_SPEED = 1.5;
const BOB_AMPLITUDE = 0.3;
const TRIGGER_RADIUS = 1.0;

export interface GoalNodeProps {
    position: [number, number, number];
}

/**
 * Goal object that the player touches to win the level.
 *
 * Renders a glowing octahedron with spin and bob animation. When the player
 * enters its trigger sphere, the world pauses and a win screen overlay appears.
 *
 * @param props - Goal position in world space.
 *
 * @example
 * ```ts
 * import { useChild } from '@pulse-ts/core';
 * import { GoalNode } from './GoalNode';
 *
 * useChild(GoalNode, { position: [34, 6.8, 0] });
 * ```
 */
export function GoalNode(props: Readonly<GoalNodeProps>) {
    const world = useWorld();

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    useRigidBody({ type: 'static' });
    useSphereCollider(TRIGGER_RADIUS, { isTrigger: true });

    // Three.js visual — octahedron for a gem/trophy look
    const root = useThreeRoot();
    const geometry = new THREE.OctahedronGeometry(GOAL_RADIUS, 0);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0xffa500,
        emissiveIntensity: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    useObject3D(mesh);

    const baseY = props.position[1];
    let elapsed = 0;

    // Spin and bob animation
    useFrameUpdate((dt) => {
        elapsed += dt;
        mesh.rotation.y += SPIN_SPEED * dt;
        root.position.set(
            transform.localPosition.x,
            baseY + Math.sin(elapsed * BOB_SPEED) * BOB_AMPLITUDE,
            transform.localPosition.z,
        );
    });

    // Win trigger — pause world and show overlay
    const { renderer } = useThreeContext();
    useOnCollisionStart(() => {
        world.pause();
        const container = renderer.domElement.parentElement ?? document.body;
        showWinScreen(container);
    });
}

/**
 * Creates and appends a full-screen "You Win!" overlay to the given container.
 *
 * The overlay includes a heading and a "Play Again" button that reloads the page.
 * Styled with absolute positioning and a semi-transparent backdrop.
 *
 * @param container - The HTML element to append the overlay to.
 * @returns The overlay element (useful for testing).
 *
 * @example
 * ```ts
 * const overlay = showWinScreen(document.getElementById('game')!);
 * ```
 */
export function showWinScreen(container: HTMLElement): HTMLElement {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '10000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    } as Partial<CSSStyleDeclaration>);

    const heading = document.createElement('h1');
    heading.textContent = 'You Win!';
    Object.assign(heading.style, {
        color: '#ffd700',
        fontSize: '4rem',
        fontFamily: 'sans-serif',
        marginBottom: '1.5rem',
        textShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
    } as Partial<CSSStyleDeclaration>);
    overlay.appendChild(heading);

    const button = document.createElement('button');
    button.textContent = 'Play Again';
    Object.assign(button.style, {
        padding: '0.8rem 2rem',
        fontSize: '1.5rem',
        fontFamily: 'sans-serif',
        cursor: 'pointer',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#ffd700',
        color: '#1a1a2e',
        fontWeight: 'bold',
    } as Partial<CSSStyleDeclaration>);
    button.addEventListener('click', () => {
        location.reload();
    });
    overlay.appendChild(button);

    container.appendChild(overlay);
    return overlay;
}
