import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { CollectibleCtx } from '../contexts';

export interface CollectibleHudNodeProps {
    total: number;
}

/**
 * DOM overlay that displays "Gems: X / Y" in the top-right corner.
 *
 * Styled to match the StatsOverlaySystem (monospace, green on dark).
 *
 * @param props - Total gem count and shared mutable counter.
 */
export function CollectibleHudNode(props: Readonly<CollectibleHudNodeProps>) {
    const collectibleState = useContext(CollectibleCtx);
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
        el.textContent = `Gems: ${collectibleState.collected} / ${props.total}`;
    });

    useDestroy(() => {
        el.remove();
    });
}
