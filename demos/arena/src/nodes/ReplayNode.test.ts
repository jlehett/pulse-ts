import {
    ReplayNode,
    LETTERBOX_HEIGHT,
    TRANSITION_FLASH_DURATION,
} from './ReplayNode';

describe('ReplayNode', () => {
    it('exports the node function', () => {
        expect(typeof ReplayNode).toBe('function');
    });

    it('letterbox height is a valid CSS value', () => {
        expect(LETTERBOX_HEIGHT).toMatch(/^\d+%$/);
    });

    it('transition flash duration is a short positive value', () => {
        expect(TRANSITION_FLASH_DURATION).toBeGreaterThan(0);
        expect(TRANSITION_FLASH_DURATION).toBeLessThan(1);
    });
});
