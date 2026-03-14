import { useDestroy, useFrameUpdate } from '@pulse-ts/core';
import { createElement } from '../domain/createElement';
import type { PulseElement } from '../domain/types';

/**
 * Mounts a JSX element tree into the DOM and manages its lifecycle.
 *
 * The JSX tree is rendered once into real DOM nodes. Reactive bindings
 * (function values in props, style, or text content) are dirty-checked
 * each frame — the DOM is only updated when a value changes.
 *
 * The mounted DOM tree is automatically removed when the owning pulse-ts
 * node is destroyed.
 *
 * @param element - The JSX element to mount.
 * @param container - The DOM element to append to. Defaults to `document.body`.
 * @returns The root DOM element that was mounted.
 *
 * @example
 * ```tsx
 * import { useOverlay } from '@pulse-ts/dom';
 *
 * function ScoreHud() {
 *     let score = 0;
 *
 *     useOverlay(
 *         <div style={{ font: 'bold 24px monospace', color: '#fff' }}>
 *             {() => `Score: ${score}`}
 *         </div>,
 *     );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { useOverlay, Column, Button } from '@pulse-ts/dom';
 *
 * function PauseMenu() {
 *     useOverlay(
 *         <Column center gap={16}>
 *             <h1 style={{ color: '#fff' }}>PAUSED</h1>
 *             <Button onClick={() => resume()}>Resume</Button>
 *         </Column>,
 *     );
 * }
 * ```
 */
export function useOverlay(
    element: PulseElement,
    container?: HTMLElement,
): globalThis.Element | DocumentFragment {
    const { root, bindings } = createElement(element);
    const target = container ?? document.body;
    target.appendChild(root);

    // Dirty-check reactive bindings each frame
    if (bindings.length > 0) {
        useFrameUpdate(() => {
            for (const binding of bindings) {
                const next = binding.get();
                if (next !== binding.prev) {
                    binding.prev = next;
                    binding.apply(next);
                }
            }
        });
    }

    // Cleanup on node destroy
    useDestroy(() => {
        if (root.parentNode) {
            root.parentNode.removeChild(root);
        }
    });

    return root;
}
