import * as THREE from 'three';
import { useDestroy, useFrameUpdate, useInit } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';

/** Point on the board the camera orbits its dolly axis around. */
const LOOK_AT = new THREE.Vector3(0, 0.2, 3.0);
/** Default camera position (zoom = 1). */
const BASE_POS = new THREE.Vector3(0, 16, 15.2);
/** Zoom clamps: fraction of the base distance to the look-at point. */
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.15;
/** Zoom change per wheel notch. */
const ZOOM_STEP = 0.07;
/** Smoothing rate toward the target zoom (per second). */
const ZOOM_SMOOTH = 9;
/** World units panned per pixel of drag (at zoom 1). */
const PAN_SPEED = 0.024;
/** Pan clamps on the ground plane, so the arena stays in view. */
const PAN_MAX_X = 9;
const PAN_MAX_Z = 8;

/**
 * Battle camera: elevated behind the player's half, matching the design's
 * framing (board fills the view, bench at the bottom edge). The mouse wheel
 * dollies smoothly along the view axis to zoom, and dragging with the right
 * or middle mouse button pans across the arena (left stays free for unit
 * dragging).
 */
export function CameraNode(): void {
    const { camera, renderer } = useThreeContext();

    let zoom = 1;
    let zoomTarget = 1;
    // Ground-plane translation added to both the camera and its look-at.
    const pan = new THREE.Vector3();
    const lookAt = new THREE.Vector3();

    const apply = () => {
        lookAt.copy(LOOK_AT).add(pan);
        camera.position
            .copy(BASE_POS)
            .sub(LOOK_AT)
            .multiplyScalar(zoom)
            .add(lookAt);
        camera.lookAt(lookAt);
    };

    useInit(() => {
        camera.fov = 38;
        apply();
        camera.updateProjectionMatrix();
    });

    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        zoomTarget = Math.min(
            ZOOM_MAX,
            Math.max(ZOOM_MIN, zoomTarget + Math.sign(e.deltaY) * ZOOM_STEP),
        );
    };
    // Listen on the canvas so wheel over HUD panels keeps its default use.
    renderer.domElement.addEventListener('wheel', onWheel, {
        passive: false,
    });

    // Right/middle-button drag pans. Grab-the-world mapping: content follows
    // the cursor. Pan speed scales with zoom so it feels consistent when
    // dollied in. Move/up bind to window so a drag can leave the canvas.
    let panning = false;
    let lastX = 0;
    let lastY = 0;
    const isPanButton = (b: number) => b === 1 || b === 2;

    const onPointerDown = (e: PointerEvent) => {
        if (!isPanButton(e.button)) return;
        panning = true;
        lastX = e.clientX;
        lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
        if (!panning) return;
        const k = PAN_SPEED * zoom;
        pan.x = THREE.MathUtils.clamp(
            pan.x - (e.clientX - lastX) * k,
            -PAN_MAX_X,
            PAN_MAX_X,
        );
        pan.z = THREE.MathUtils.clamp(
            pan.z - (e.clientY - lastY) * k,
            -PAN_MAX_Z,
            PAN_MAX_Z,
        );
        lastX = e.clientX;
        lastY = e.clientY;
        apply();
    };
    const onPointerUp = (e: PointerEvent) => {
        if (isPanButton(e.button)) panning = false;
    };
    const onContextMenu = (e: Event) => e.preventDefault();

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    useDestroy(() => {
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('contextmenu', onContextMenu);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    });

    useFrameUpdate((dt) => {
        if (Math.abs(zoomTarget - zoom) < 1e-4) return;
        zoom += (zoomTarget - zoom) * Math.min(1, ZOOM_SMOOTH * dt);
        apply();
    });
}
