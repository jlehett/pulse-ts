import {
    PlayerVelocityStore,
    updatePlayerVelocity,
    getPlayerVelocity,
    type PlayerVelocityState,
} from './playerVelocity';

function createStates(): [PlayerVelocityState, PlayerVelocityState] {
    return PlayerVelocityStore._factory().states;
}

describe('PlayerVelocityStore', () => {
    it('factory returns zero initial state', () => {
        const states = createStates();
        const [vx, vz] = getPlayerVelocity(states, 0);
        expect(vx).toBe(0);
        expect(vz).toBe(0);
    });

    it('factory returns a fresh object each call', () => {
        const a = PlayerVelocityStore._factory();
        const b = PlayerVelocityStore._factory();
        expect(a).not.toBe(b);
    });
});

describe('updatePlayerVelocity / getPlayerVelocity', () => {
    it('derives velocity from position deltas', () => {
        const states = createStates();
        const dt = 1 / 60;
        updatePlayerVelocity(states, 0, 0, 0, dt);
        updatePlayerVelocity(states, 0, 1, 0, dt);
        const [vx, vz] = getPlayerVelocity(states, 0);
        expect(vx).toBeCloseTo(60, 0);
        expect(vz).toBe(0);
    });

    it('tracks players independently', () => {
        const states = createStates();
        const dt = 1 / 60;
        updatePlayerVelocity(states, 0, 0, 0, dt);
        updatePlayerVelocity(states, 1, 0, 0, dt);
        updatePlayerVelocity(states, 0, 1, 0, dt);
        updatePlayerVelocity(states, 1, 0, 2, dt);

        const [vx0, vz0] = getPlayerVelocity(states, 0);
        const [vx1, vz1] = getPlayerVelocity(states, 1);
        expect(vx0).toBeCloseTo(60, 0);
        expect(vz0).toBe(0);
        expect(vx1).toBe(0);
        expect(vz1).toBeCloseTo(120, 0);
    });

    it('skips velocity computation when dt is 0', () => {
        const states = createStates();
        updatePlayerVelocity(states, 0, 0, 0, 1 / 60);
        updatePlayerVelocity(states, 0, 5, 5, 1 / 60);
        updatePlayerVelocity(states, 0, 10, 10, 0);
        const [vx, vz] = getPlayerVelocity(states, 0);
        expect(vx).toBeCloseTo(300, 0);
        expect(vz).toBeCloseTo(300, 0);
    });
});
