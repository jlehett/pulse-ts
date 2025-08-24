import { Node, tickLate } from '@pulse-ts/core';

export class RendererDriverNode extends Node {
    constructor(private readonly onRender: (deltaSeconds: number) => void) {
        super();
    }

    @tickLate({ order: Number.MAX_SAFE_INTEGER })
    renderLate(deltaSeconds: number) {
        this.onRender(deltaSeconds);
    }
}