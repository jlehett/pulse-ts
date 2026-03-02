jest.mock('three', () => ({
    Vector2: jest.fn().mockImplementation((x = 0, y = 0) => ({
        x,
        y,
        set(nx: number, ny: number) {
            this.x = nx;
            this.y = ny;
            return this;
        },
    })),
    Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
        x,
        y,
        z,
        project() {
            // Simple mock: return the raw coords as-is (in NDC -1..1 range)
            return this;
        },
    })),
}));

jest.mock('three/examples/jsm/postprocessing/ShaderPass.js', () => ({
    ShaderPass: jest.fn().mockImplementation((shader: any) => ({
        uniforms: { ...shader.uniforms },
        enabled: true,
    })),
}));

import {
    triggerShockwave,
    updateShockwaves,
    syncShockwaveUniforms,
    createShockwavePass,
    worldToScreen,
    hasActiveShockwave,
    resetShockwaves,
    SHOCKWAVE_DURATION,
    MAX_SHOCKWAVES,
    SHOCKWAVE_MAX_RADIUS,
    SHOCKWAVE_STRENGTH,
    SHOCKWAVE_RING_WIDTH,
} from './shockwave';

beforeEach(() => {
    resetShockwaves();
});

describe('triggerShockwave', () => {
    it('activates a slot', () => {
        expect(hasActiveShockwave()).toBe(false);
        triggerShockwave(0.5, 0.5);
        expect(hasActiveShockwave()).toBe(true);
    });

    it('supports multiple simultaneous shockwaves', () => {
        for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            triggerShockwave(i * 0.2, 0.5);
        }
        expect(hasActiveShockwave()).toBe(true);
    });

    it('recycles oldest slot when all are full', () => {
        // Fill all slots with staggered elapsed times
        for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            triggerShockwave(i * 0.1, 0.5);
            // Advance time so each has different elapsed
            updateShockwaves(0.01);
        }

        // Trigger one more — should recycle the oldest (slot 0)
        triggerShockwave(0.99, 0.99);

        // All slots should still be active
        expect(hasActiveShockwave()).toBe(true);

        // Verify the new shockwave was placed (sync and check uniforms)
        const pass = createShockwavePass();
        syncShockwaveUniforms(pass, 1.0);
        // At least one center should be at 0.99
        let foundNew = false;
        for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            const c = pass.uniforms[`center${i}`].value;
            if (c.x === 0.99 && c.y === 0.99) foundNew = true;
        }
        expect(foundNew).toBe(true);
    });
});

describe('updateShockwaves', () => {
    it('expires shockwaves after their duration', () => {
        triggerShockwave(0.5, 0.5);
        expect(hasActiveShockwave()).toBe(true);
        updateShockwaves(SHOCKWAVE_DURATION + 0.01);
        expect(hasActiveShockwave()).toBe(false);
    });

    it('does not expire before duration', () => {
        triggerShockwave(0.5, 0.5);
        updateShockwaves(SHOCKWAVE_DURATION * 0.5);
        expect(hasActiveShockwave()).toBe(true);
    });
});

describe('resetShockwaves', () => {
    it('clears all active shockwaves', () => {
        triggerShockwave(0.5, 0.5);
        triggerShockwave(0.3, 0.7);
        expect(hasActiveShockwave()).toBe(true);
        resetShockwaves();
        expect(hasActiveShockwave()).toBe(false);
    });
});

describe('syncShockwaveUniforms', () => {
    it('writes correct uniform values for an active shockwave', () => {
        triggerShockwave(0.4, 0.6);
        // Advance halfway through duration
        updateShockwaves(SHOCKWAVE_DURATION / 2);

        const pass = createShockwavePass();
        syncShockwaveUniforms(pass, 1.5);

        // Find the active slot
        let activeIdx = -1;
        for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            if (pass.uniforms[`strength${i}`].value > 0) {
                activeIdx = i;
                break;
            }
        }
        expect(activeIdx).toBeGreaterThanOrEqual(0);

        const t = 0.5; // halfway
        expect(pass.uniforms[`center${activeIdx}`].value.x).toBe(0.4);
        expect(pass.uniforms[`center${activeIdx}`].value.y).toBe(0.6);
        expect(pass.uniforms[`radius${activeIdx}`].value).toBeCloseTo(
            t * SHOCKWAVE_MAX_RADIUS,
        );
        expect(pass.uniforms[`strength${activeIdx}`].value).toBeCloseTo(
            SHOCKWAVE_STRENGTH * (1 - t),
        );
        expect(pass.uniforms['aspect'].value).toBe(1.5);
    });

    it('enables the pass when shockwaves are active', () => {
        const pass = createShockwavePass();
        pass.enabled = false;

        triggerShockwave(0.5, 0.5);
        syncShockwaveUniforms(pass, 1.0);
        expect(pass.enabled).toBe(true);
    });

    it('disables the pass when no shockwaves are active', () => {
        const pass = createShockwavePass();
        pass.enabled = true;

        syncShockwaveUniforms(pass, 1.0);
        expect(pass.enabled).toBe(false);
    });

    it('sets strength to 0 for inactive slots', () => {
        const pass = createShockwavePass();
        syncShockwaveUniforms(pass, 1.0);
        for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            expect(pass.uniforms[`strength${i}`].value).toBe(0);
        }
    });
});

describe('createShockwavePass', () => {
    it('returns a pass with expected uniforms', () => {
        const pass = createShockwavePass();
        expect(pass.uniforms['tDiffuse']).toBeDefined();
        expect(pass.uniforms['aspect']).toBeDefined();
        expect(pass.uniforms['ringWidth']).toBeDefined();
        for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            expect(pass.uniforms[`center${i}`]).toBeDefined();
            expect(pass.uniforms[`radius${i}`]).toBeDefined();
            expect(pass.uniforms[`strength${i}`]).toBeDefined();
        }
    });

    it('starts disabled', () => {
        const pass = createShockwavePass();
        expect(pass.enabled).toBe(false);
    });
});

describe('worldToScreen', () => {
    it('converts NDC to 0..1 UV space', () => {
        // Our mock project() returns raw coords, so (0,0,0) → NDC (0,0) → UV (0.5, 0.5)
        const [u, v] = worldToScreen(0, 0, 0, {} as any);
        expect(u).toBeCloseTo(0.5);
        expect(v).toBeCloseTo(0.5);
    });
});

describe('constants', () => {
    it('have sensible ranges', () => {
        expect(SHOCKWAVE_DURATION).toBeGreaterThan(0);
        expect(SHOCKWAVE_DURATION).toBeLessThan(2);
        expect(MAX_SHOCKWAVES).toBeGreaterThanOrEqual(1);
        expect(SHOCKWAVE_MAX_RADIUS).toBeGreaterThan(0);
        expect(SHOCKWAVE_MAX_RADIUS).toBeLessThanOrEqual(1);
        expect(SHOCKWAVE_STRENGTH).toBeGreaterThan(0);
        expect(SHOCKWAVE_STRENGTH).toBeLessThan(1);
        expect(SHOCKWAVE_RING_WIDTH).toBeGreaterThan(0);
        expect(SHOCKWAVE_RING_WIDTH).toBeLessThan(1);
    });
});
