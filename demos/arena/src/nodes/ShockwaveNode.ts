import { useFrameUpdate } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { updateShockwaves, syncShockwaveUniforms } from '../shockwave';

export interface ShockwaveNodeProps {
    /** The ShaderPass instance returned by {@link createShockwavePass}. */
    pass?: ShaderPass;
}

/**
 * Frame-update node that drives the shockwave distortion effect.
 * Advances shockwave timers and syncs uniform state into the post-processing
 * pass each frame. Does nothing if no pass is provided.
 *
 * @param props - Must include the `pass` from `createShockwavePass()`.
 *
 * @example
 * ```ts
 * useChild(ShockwaveNode, { pass: shockwavePass });
 * ```
 */
export function ShockwaveNode(props?: Readonly<ShockwaveNodeProps>) {
    const pass = props?.pass;
    if (!pass) return;

    const { renderer } = useThreeContext();

    useFrameUpdate((dt) => {
        updateShockwaves(dt);
        const canvas = renderer.domElement;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        syncShockwaveUniforms(pass, aspect);
    });
}
