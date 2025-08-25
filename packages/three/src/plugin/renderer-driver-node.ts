import { Node, tickLate } from '@pulse-ts/core';

/**
 * Node that drives the renderer.
 */
export class RendererDriverNode extends Node {
    constructor(private readonly onRender: (deltaSeconds: number) => void) {
        super();
    }

    //#region Public Methods

    /**
     * Render the scene.
     * @param deltaSeconds The delta in seconds.
     */
    @tickLate({ order: Number.MAX_SAFE_INTEGER })
    renderLate(deltaSeconds: number) {
        this.onRender(deltaSeconds);
    }

    //#endregion
}
