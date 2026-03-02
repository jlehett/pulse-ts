import {
    recordFrame,
    markHit,
    startReplay,
    advanceReplay,
    getReplayPosition,
    isReplayActive,
    getReplayScorer,
    getReplayKnockedOut,
    getReplayHitProximity,
    getSpeedAtFrame,
    getReplayVelocity,
    getReplaySpeed,
    endReplay,
    clearRecording,
    resetReplay,
} from './replay';

afterEach(() => {
    resetReplay();
});

describe('recordFrame + startReplay', () => {
    it('records and replays player positions', () => {
        recordFrame(1, 2, 3, 4, 5, 6);
        recordFrame(7, 8, 9, 10, 11, 12);

        startReplay(1);
        expect(isReplayActive()).toBe(true);
        expect(getReplayScorer()).toBe(0);
        expect(getReplayKnockedOut()).toBe(1);

        // Cursor starts at 0 — first recorded frame
        const p0 = getReplayPosition(0);
        expect(p0).not.toBeNull();
        expect(p0![0]).toBeCloseTo(1);
        expect(p0![1]).toBeCloseTo(2);
        expect(p0![2]).toBeCloseTo(3);

        const p1 = getReplayPosition(1);
        expect(p1).not.toBeNull();
        expect(p1![0]).toBeCloseTo(4);
        expect(p1![1]).toBeCloseTo(5);
        expect(p1![2]).toBeCloseTo(6);
    });

    it('ring buffer overwrites oldest frames', () => {
        // Write 250 frames (buffer is 240 at 4s * 60Hz)
        for (let i = 0; i < 250; i++) {
            recordFrame(i, 0, 0, -i, 0, 0);
        }
        startReplay(0);

        // First available frame should be frame 10 (frames 0-9 were overwritten by ring)
        const p0 = getReplayPosition(0);
        expect(p0).not.toBeNull();
        // 250 - 240 = 10 overwritten, first available is frame 10
        expect(p0![0]).toBeCloseTo(10);
    });
});

describe('advanceReplay', () => {
    it('advances cursor and eventually ends', () => {
        for (let i = 0; i < 10; i++) {
            recordFrame(i, 0, 0, 0, 0, i);
        }
        startReplay(1);

        // Advance with large dt to finish quickly
        let playing = true;
        let steps = 0;
        while (playing && steps < 1000) {
            playing = advanceReplay(0.1);
            steps++;
        }
        expect(playing).toBe(false);
        expect(isReplayActive()).toBe(false);
    });

    it('returns false when no replay is active', () => {
        expect(advanceReplay(0.016)).toBe(false);
    });
});

describe('getReplayPosition interpolation', () => {
    it('interpolates between frames', () => {
        recordFrame(0, 0, 0, 0, 0, 0);
        recordFrame(10, 0, 0, 0, 0, 0);
        startReplay(1);

        // Advance cursor to approximately midpoint
        // Speed ~0.4, FIXED_HZ=60: need dt to advance cursor to ~0.5
        // cursor += dt * 0.4 * 60 = dt * 24
        // For cursor = 0.5: dt = 0.5/24 ≈ 0.0208
        advanceReplay(0.0208);
        const p0 = getReplayPosition(0);
        expect(p0).not.toBeNull();
        // Should be roughly between 0 and 10
        expect(p0![0]).toBeGreaterThan(1);
        expect(p0![0]).toBeLessThan(9);
    });
});

describe('getSpeedAtFrame', () => {
    it('returns normal speed far from hit', () => {
        // No replay started, hitIndex = -1 → always normal
        expect(getSpeedAtFrame(0)).toBeCloseTo(0.4);
        expect(getSpeedAtFrame(100)).toBeCloseTo(0.4);
    });

    it('returns hit speed at the hit frame', () => {
        // Record 10 frames, mark hit at frame 5
        for (let i = 0; i < 10; i++) {
            recordFrame(i, 0, 0, 0, 0, 0);
            if (i === 5) markHit();
        }
        startReplay(1);

        // Advance cursor to near the hit frame (~5)
        // cursor += dt * 0.4 * 60 = dt * 24; for cursor = 5: dt = 5/24 ≈ 0.208
        advanceReplay(0.208);
        // Hit proximity should be high when cursor is near hitIndex
        expect(getReplayHitProximity()).toBeGreaterThan(0.5);
    });
});

describe('getReplayHitProximity', () => {
    it('returns 0 when no replay is active', () => {
        expect(getReplayHitProximity()).toBe(0);
    });

    it('returns > 0 when cursor is near hit frame', () => {
        for (let i = 0; i < 20; i++) {
            recordFrame(i, 0, 0, 0, 0, 0);
            if (i === 5) markHit();
        }
        startReplay(1);
        // Cursor starts at 0, hit at frame 5 — within window
        expect(getReplayHitProximity()).toBeGreaterThan(0);
    });
});

describe('getReplayVelocity', () => {
    it('returns null when no replay is active', () => {
        expect(getReplayVelocity(0)).toBeNull();
    });

    it('computes velocity from position deltas', () => {
        // Frame 0: player 0 at x=0, Frame 1: player 0 at x=2
        // Velocity = (2-0) * 60 = 120 units/sec
        recordFrame(0, 0, 0, 0, 0, 0);
        recordFrame(2, 0, 0, 0, 0, 0);
        startReplay(1);

        const vel = getReplayVelocity(0);
        expect(vel).not.toBeNull();
        expect(vel![0]).toBeCloseTo(120); // dx * FIXED_HZ
        expect(vel![1]).toBeCloseTo(0);
        expect(vel![2]).toBeCloseTo(0);
    });

    it('returns zero velocity at end of buffer', () => {
        recordFrame(0, 0, 0, 0, 0, 0);
        startReplay(1);
        // Only 1 frame — can't compute deltas
        const vel = getReplayVelocity(0);
        expect(vel).toBeNull();
    });
});

describe('getReplaySpeed', () => {
    it('returns 0 when no replay is active', () => {
        expect(getReplaySpeed()).toBe(0);
    });

    it('returns normal speed far from hit', () => {
        // Record enough frames so cursor 0 is far from the fallback
        // hitIndex (which defaults to near the end of the buffer)
        for (let i = 0; i < 60; i++) {
            recordFrame(i, 0, 0, 0, 0, 0);
        }
        startReplay(1);
        // Cursor at 0, fallback hit at frame ~45 — distance exceeds window
        expect(getReplaySpeed()).toBeCloseTo(0.4);
    });
});

describe('clearRecording', () => {
    it('clears recording buffer but not active playback', () => {
        recordFrame(0, 0, 0, 0, 0, 0);
        recordFrame(1, 0, 0, 0, 0, 0);
        startReplay(1);
        expect(isReplayActive()).toBe(true);

        clearRecording();

        // Playback still active — clearRecording only affects recording
        expect(isReplayActive()).toBe(true);

        // New replay after clearing has no frames
        endReplay();
        recordFrame(5, 0, 0, 0, 0, 0);
        startReplay(0);
        const p0 = getReplayPosition(0);
        expect(p0).not.toBeNull();
        expect(p0![0]).toBeCloseTo(5); // only the new frame
    });
});

describe('endReplay / resetReplay', () => {
    it('endReplay deactivates playback', () => {
        recordFrame(0, 0, 0, 0, 0, 0);
        startReplay(0);
        expect(isReplayActive()).toBe(true);
        endReplay();
        expect(isReplayActive()).toBe(false);
    });

    it('resetReplay clears all state', () => {
        recordFrame(0, 0, 0, 0, 0, 0);
        markHit();
        startReplay(0);
        resetReplay();
        expect(isReplayActive()).toBe(false);
        expect(getReplayPosition(0)).toBeNull();
        expect(getReplayScorer()).toBe(-1);
    });
});
