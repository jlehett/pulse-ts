import {
    ReplayNode,
    LETTERBOX_HEIGHT,
    TRANSITION_FLASH_DURATION,
    SELF_KO_MESSAGES,
    SELF_KO_BOB_PERIOD,
    SELF_KO_BOB_STAGGER,
    SELF_KO_BOB_DISTANCE,
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

    it('has a non-empty array of self-KO messages', () => {
        expect(SELF_KO_MESSAGES.length).toBeGreaterThan(0);
        for (const msg of SELF_KO_MESSAGES) {
            expect(typeof msg).toBe('string');
            expect(msg.length).toBeGreaterThan(0);
        }
    });

    it('self-KO bob animation constants are positive', () => {
        expect(SELF_KO_BOB_PERIOD).toBeGreaterThan(0);
        expect(SELF_KO_BOB_STAGGER).toBeGreaterThan(0);
        expect(SELF_KO_BOB_DISTANCE).toBeGreaterThan(0);
    });
});
