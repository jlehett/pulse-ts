import { useFrameUpdate } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { useShockwavePool, syncShockwaveUniforms } from '../../stores/shockwave';

export interface ShockwaveNodeProps {
    /** The ShaderPass instance returned by {@link createShockwavePass}. */
    pass?: ShaderPass;
}

/**
 * Frame-update node that drives the shockwave distortion effect.
 * Syncs the effect pool state into the post-processing pass uniforms
 * each frame. Does nothing if no pass is provided.
 *
 * The pool timing is managed automatically by {@link useShockwavePool}
 * via `useEffectPool`'s internal `useFixedUpdate`.
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
    const pool = useShockwavePool();

    useFrameUpdate(() => {
        const canvas = renderer.domElement;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        syncShockwaveUniforms(pool, pass, aspect);
    });
}
