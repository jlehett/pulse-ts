import * as THREE from 'three';

let cachedGlow: THREE.Texture | null = null;

/**
 * Shared soft radial glow sprite, generated once on a small canvas. Used
 * by every particle pool and flash sprite so everything reads as light
 * rather than as flat geometry.
 *
 * @returns A cached {@link THREE.Texture} with a white radial falloff.
 *
 * @example
 * const mat = new THREE.SpriteMaterial({ map: glowTexture() });
 */
export function glowTexture(): THREE.Texture {
    if (cachedGlow) return cachedGlow;
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2,
    );
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.28)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    cachedGlow = new THREE.CanvasTexture(canvas);
    return cachedGlow;
}
