import * as THREE from 'three';
import { System, CullingCamera } from '@pulse-ts/core';
import type { UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';

/**
 * Pushes Three camera projection-view into the CullingCamera service.
 */
export class ThreeCameraPVSystem extends System {
    static updateKind: UpdateKind = 'frame';
    static updatePhase: UpdatePhase = 'early';
    static order = Number.MIN_SAFE_INTEGER;

    private projView = new THREE.Matrix4();
    private pvArray = new Float32Array(16);

    update(): void {
        if (!this.world) return;
        const svc = this.world.getService(ThreeService);
        if (!svc) return;

        // Compose projection * view from Three camera and publish to CullingCamera service
        svc.camera.updateMatrixWorld();
        this.projView.multiplyMatrices(
            svc.camera.projectionMatrix,
            svc.camera.matrixWorldInverse,
        );
        const e = this.projView.elements as number[];
        for (let i = 0; i < 16; i++) this.pvArray[i] = e[i];

        const cullingCamera = this.world.getService(CullingCamera);
        if (cullingCamera) cullingCamera.projView = this.pvArray;
    }
}
