import { PLATFORM_RADIUS, PLATFORM_HEIGHT } from './PlatformNode';
import { ARENA_RADIUS } from '../config/arena';

describe('PlatformNode constants', () => {
    it('platform radius matches arena config radius', () => {
        expect(PLATFORM_RADIUS).toBe(ARENA_RADIUS);
    });

    it('platform radius is positive', () => {
        expect(PLATFORM_RADIUS).toBeGreaterThan(0);
    });

    it('platform height is positive and thin', () => {
        expect(PLATFORM_HEIGHT).toBeGreaterThan(0);
        expect(PLATFORM_HEIGHT).toBeLessThanOrEqual(1);
    });

    it('platform height is 0.5', () => {
        expect(PLATFORM_HEIGHT).toBe(0.5);
    });
});
