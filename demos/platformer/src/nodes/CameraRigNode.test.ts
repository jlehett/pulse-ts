import { SHAKE_DECAY, SHAKE_MAX } from './CameraRigNode';

describe('Camera shake constants', () => {
    it('SHAKE_DECAY is positive', () => {
        expect(SHAKE_DECAY).toBeGreaterThan(0);
    });

    it('SHAKE_MAX is positive and reasonable', () => {
        expect(SHAKE_MAX).toBeGreaterThan(0);
        expect(SHAKE_MAX).toBeLessThan(2); // shouldn't be wildly large
    });
});
