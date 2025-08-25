import type { Camera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Thin wrapper so consumers can wire OrbitControls without bringing three/examples knowledge into app code.
 */
export class OrbitControlsAdapter {
    //#region Fields

    private controls: OrbitControls;

    //#endregion

    constructor(camera: Camera, canvas: HTMLCanvasElement) {
        this.controls = new OrbitControls(camera as any, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.target.set(0, 1, 0);
    }

    //#region Public Methods

    /**
     * Update the controls.
     */
    update(): void {
        this.controls.update();
    }

    /**
     * Dispose of the controls.
     */
    dispose(): void {
        this.controls.dispose();
    }

    //#endregion
}
