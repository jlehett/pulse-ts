import { createAiState, updateAiState } from './aiState';

const DT = 1 / 60;

describe('createAiState', () => {
    it('returns an object with all expected fields', () => {
        const s = createAiState();
        expect(s.elapsed).toBe(0);
        expect(s.initialized).toBe(false);
        expect(s.timeSinceCollision).toBeGreaterThan(100);
        expect(s.selfScore).toBe(0);
        expect(s.opponentScore).toBe(0);
    });
});

describe('updateAiState', () => {
    it('initializes on first call', () => {
        const s = createAiState();
        updateAiState(s, 3, 4, 7, 8, 0, 0, DT);
        expect(s.initialized).toBe(true);
        expect(s.prevSelfX).toBe(3);
        expect(s.prevSelfZ).toBe(4);
        expect(s.homeX).toBe(3);
        expect(s.homeZ).toBe(4);
    });

    it('computes velocity from position deltas', () => {
        const s = createAiState();
        updateAiState(s, 0, 0, 10, 10, 0, 0, DT);
        // Move self 1 unit in X
        updateAiState(s, 1, 0, 10, 10, 0, 0, DT);
        expect(s.selfVelX).toBeCloseTo(1 / DT);
        expect(s.selfVelZ).toBeCloseTo(0);
    });

    it('tracks opponent velocity', () => {
        const s = createAiState();
        updateAiState(s, 0, 0, 0, 0, 0, 0, DT);
        updateAiState(s, 0, 0, 0, 2, 0, 0, DT);
        expect(s.opVelZ).toBeCloseTo(2 / DT);
    });

    it('detects collision via proximity + separation', () => {
        const s = createAiState();
        // Frame 0: players apart
        updateAiState(s, 0, 0, 5, 0, 0, 0, DT);
        // Frame 1: players close (within threshold)
        updateAiState(s, 0, 0, 1.5, 0, 0, 0, DT);
        // Frame 2: players separating (distance increasing)
        updateAiState(s, 0, 0, 3, 0, 0, 0, DT);
        expect(s.timeSinceCollision).toBeCloseTo(0, 1);
    });

    it('increments elapsed time', () => {
        const s = createAiState();
        updateAiState(s, 0, 0, 5, 0, 0, 0, DT);
        updateAiState(s, 0, 0, 5, 0, 0, 0, DT);
        updateAiState(s, 0, 0, 5, 0, 0, 0, DT);
        expect(s.elapsed).toBeCloseTo(DT * 2, 5);
    });

    it('tracks scores', () => {
        const s = createAiState();
        updateAiState(s, 0, 0, 5, 0, 0, 0, DT);
        updateAiState(s, 0, 0, 5, 0, 2, 1, DT);
        expect(s.selfScore).toBe(2);
        expect(s.opponentScore).toBe(1);
    });

    it('detects opponent dash via speed spike', () => {
        const s = createAiState();
        // Frame 0
        updateAiState(s, 0, 0, 0, 0, 0, 0, DT);
        // Frame 1: opponent barely moves
        updateAiState(s, 0, 0, 0.1, 0, 0, 0, DT);
        // Frame 2: opponent suddenly moves far (dash)
        updateAiState(s, 0, 0, 1.5, 0, 0, 0, DT);
        // Speed went from ~6 to ~84 — should detect dash
        expect(s.timeSinceOpDash).toBeCloseTo(0, 1);
    });

    it('advances behavioral timers', () => {
        const s = createAiState();
        updateAiState(s, 0, 0, 5, 0, 0, 0, DT);
        const prevBurst = s.burstPhase;
        updateAiState(s, 0, 0, 5, 0, 0, 0, DT);
        expect(s.burstPhase).toBeGreaterThan(prevBurst);
    });
});
