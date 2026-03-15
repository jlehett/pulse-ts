import { describe, it, expect, vi } from 'vitest';
import { triggerCollisionEffects } from './collisionEffects';
import type { CollisionEffectsDeps } from './collisionEffects';

// Mock cameraShake's triggerCameraShake
vi.mock('../cameraShake', () => ({
    triggerCameraShake: vi.fn(),
}));

// Mock worldToScreen — returns fixed screen UVs
vi.mock('../shockwave', () => ({
    worldToScreen: vi.fn(() => [0.5, 0.6]),
}));

import { triggerCameraShake } from '../cameraShake';
import { worldToScreen } from '../shockwave';

function makeDeps(): CollisionEffectsDeps {
    return {
        impactBurst: vi.fn(),
        impactSfx: { play: vi.fn() },
        shockwavePool: { trigger: vi.fn() },
        hitImpactPool: { trigger: vi.fn() },
        camera: {} as CollisionEffectsDeps['camera'],
        cameraShake: { intensity: 0, duration: 0, elapsed: 0 },
    };
}

describe('triggerCollisionEffects', () => {
    it('calls all VFX and audio callbacks in sequence', () => {
        const deps = makeDeps();
        const pos: [number, number, number] = [1, 2, 3];

        triggerCollisionEffects(pos, deps);

        expect(deps.impactBurst).toHaveBeenCalledWith(pos);
        expect(triggerCameraShake).toHaveBeenCalledWith(
            deps.cameraShake,
            0.3,
            0.2,
        );
        expect(worldToScreen).toHaveBeenCalledWith(1, 2, 3, deps.camera);
        expect(deps.shockwavePool.trigger).toHaveBeenCalledWith({
            centerX: 0.5,
            centerY: 0.6,
        });
        expect(deps.hitImpactPool.trigger).toHaveBeenCalledWith({
            worldX: 1,
            worldZ: 3,
        });
        expect(deps.impactSfx.play).toHaveBeenCalled();
    });

    it('forwards custom shake intensity and duration', () => {
        const deps = makeDeps();

        triggerCollisionEffects([0, 0, 0], deps, 0.4, 0.3);

        expect(triggerCameraShake).toHaveBeenCalledWith(
            deps.cameraShake,
            0.4,
            0.3,
        );
    });
});
