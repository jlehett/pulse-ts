import {
    playJump,
    playCollect,
    playLand,
    playDash,
    playDeath,
    JUMP_DURATION,
    JUMP_FREQ_START,
    JUMP_FREQ_END,
    JUMP_GAIN,
    COLLECT_DURATION,
    COLLECT_NOTE_INTERVAL,
    COLLECT_FREQUENCIES,
    COLLECT_GAIN,
    LAND_DURATION,
    LAND_FREQUENCY,
    LAND_GAIN,
    DASH_DURATION,
    DASH_FILTER_START,
    DASH_FILTER_END,
    DASH_GAIN,
    DEATH_DURATION,
    DEATH_FREQ_START,
    DEATH_FREQ_END,
    DEATH_GAIN,
} from './audio';

describe('audio', () => {
    describe('exported play functions', () => {
        it('exports playJump as a function', () => {
            expect(typeof playJump).toBe('function');
        });

        it('exports playCollect as a function', () => {
            expect(typeof playCollect).toBe('function');
        });

        it('exports playLand as a function', () => {
            expect(typeof playLand).toBe('function');
        });

        it('exports playDash as a function', () => {
            expect(typeof playDash).toBe('function');
        });

        it('exports playDeath as a function', () => {
            expect(typeof playDeath).toBe('function');
        });
    });

    describe('jump constants', () => {
        it('has a positive duration', () => {
            expect(JUMP_DURATION).toBeGreaterThan(0);
        });

        it('ramps frequency upward', () => {
            expect(JUMP_FREQ_END).toBeGreaterThan(JUMP_FREQ_START);
        });

        it('has a positive gain', () => {
            expect(JUMP_GAIN).toBeGreaterThan(0);
        });
    });

    describe('collect constants', () => {
        it('has a positive duration', () => {
            expect(COLLECT_DURATION).toBeGreaterThan(0);
        });

        it('has a positive note interval', () => {
            expect(COLLECT_NOTE_INTERVAL).toBeGreaterThan(0);
        });

        it('has ascending frequencies for the arpeggio', () => {
            for (let i = 1; i < COLLECT_FREQUENCIES.length; i++) {
                expect(COLLECT_FREQUENCIES[i]).toBeGreaterThan(
                    COLLECT_FREQUENCIES[i - 1],
                );
            }
        });

        it('has a positive gain', () => {
            expect(COLLECT_GAIN).toBeGreaterThan(0);
        });
    });

    describe('land constants', () => {
        it('has a positive duration', () => {
            expect(LAND_DURATION).toBeGreaterThan(0);
        });

        it('has a positive frequency', () => {
            expect(LAND_FREQUENCY).toBeGreaterThan(0);
        });

        it('has a positive gain', () => {
            expect(LAND_GAIN).toBeGreaterThan(0);
        });
    });

    describe('dash constants', () => {
        it('has a positive duration', () => {
            expect(DASH_DURATION).toBeGreaterThan(0);
        });

        it('sweeps filter frequency downward', () => {
            expect(DASH_FILTER_START).toBeGreaterThan(DASH_FILTER_END);
        });

        it('has a positive gain', () => {
            expect(DASH_GAIN).toBeGreaterThan(0);
        });
    });

    describe('death constants', () => {
        it('has a positive duration', () => {
            expect(DEATH_DURATION).toBeGreaterThan(0);
        });

        it('ramps frequency downward', () => {
            expect(DEATH_FREQ_START).toBeGreaterThan(DEATH_FREQ_END);
        });

        it('has a positive gain', () => {
            expect(DEATH_GAIN).toBeGreaterThan(0);
        });
    });
});
