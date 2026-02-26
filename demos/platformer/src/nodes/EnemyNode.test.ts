import {
    STOMP_VELOCITY_THRESHOLD,
    STOMP_Y_OFFSET,
    STOMP_BOUNCE_SPEED,
    STOMP_PARTICLE_COLOR,
} from './EnemyNode';

describe('EnemyNode', () => {
    describe('stomp constants', () => {
        it('STOMP_VELOCITY_THRESHOLD is negative (player must be falling)', () => {
            expect(STOMP_VELOCITY_THRESHOLD).toBeLessThan(0);
        });

        it('STOMP_Y_OFFSET is between 0 and 1 (fraction of enemy height)', () => {
            expect(STOMP_Y_OFFSET).toBeGreaterThan(0);
            expect(STOMP_Y_OFFSET).toBeLessThan(1);
        });

        it('STOMP_BOUNCE_SPEED is positive', () => {
            expect(STOMP_BOUNCE_SPEED).toBeGreaterThan(0);
        });

        it('STOMP_PARTICLE_COLOR is the expected red', () => {
            expect(STOMP_PARTICLE_COLOR).toBe(0xcc2200);
        });
    });
});
