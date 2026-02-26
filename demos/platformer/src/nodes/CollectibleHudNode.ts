import { useFrameUpdate, useDestroy } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import type { CollectibleState } from './CollectibleNode';

export interface CollectibleHudNodeProps {
    total: number;
    collectibleState: CollectibleState;
}

/**
 * DOM overlay that displays "Gems: X / Y" in the top-right corner.
 *
 * Styled to match the StatsOverlaySystem (monospace, green on dark).
 *
 * @param props - Total gem count and shared mutable counter.
 */
export function CollectibleHudNode(props: Readonly<CollectibleHudNodeProps>) {
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    const el = document.createElement('div');
    Object.assign(el.style, {
        position: 'absolute',
        top: '0',
        right: '0',
        zIndex: '1000',
        padding: '2px 6px',
        font: '12px monospace',
        color: '#0f0',
        backgroundColor: 'rgba(0,0,0,0.4)',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    el.textContent = `Gems: 0 / ${props.total}`;
    container.appendChild(el);

    useFrameUpdate(() => {
        el.textContent = `Gems: ${props.collectibleState.collected} / ${props.total}`;
    });

    useDestroy(() => {
        el.remove();
    });
}
