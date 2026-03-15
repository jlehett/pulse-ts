import {
    ReplayStore,
    recordFrame,
    markHit,
    startReplay,
    advanceReplay,
    getReplayPosition,
    getReplayHitProximity,
    getReplayPastHit,
    getSpeedAtFrame,
    getReplayVelocity,
    getReplaySpeed,
    endReplay,
    clearRecording,
    resetReplay,
    type ReplayState,
} from './replay';

function create(): ReplayState {
    return ReplayStore._factory();
}

describe('recordFrame + startReplay', () => {
    it('records and replays player positions', () => {
        const s = create();
        recordFrame(s, 1, 2, 3, 4, 5, 6);
        recordFrame(s, 7, 8, 9, 10, 11, 12);

        startReplay(s, 1);
        expect(s.active).toBe(true);
        expect(s.scorer).toBe(0);
        expect(s.knockedOut).toBe(1);

        const p0 = getReplayPosition(s, 0);
        expect(p0).not.toBeNull();
        expect(p0![0]).toBeCloseTo(1);
        expect(p0![1]).toBeCloseTo(2);
        expect(p0![2]).toBeCloseTo(3);

        const p1 = getReplayPosition(s, 1);
        expect(p1).not.toBeNull();
        expect(p1![0]).toBeCloseTo(4);
        expect(p1![1]).toBeCloseTo(5);
        expect(p1![2]).toBeCloseTo(6);
    });

    it('ring buffer overwrites oldest frames', () => {
        const s = create();
        for (let i = 0; i < 250; i++) {
            recordFrame(s, i, 0, 0, -i, 0, 0);
        }
        startReplay(s, 0);

        const p0 = getReplayPosition(s, 0);
        expect(p0).not.toBeNull();
        expect(p0![0]).toBeCloseTo(10);
    });
});

describe('advanceReplay', () => {
    it('advances cursor and eventually ends', () => {
        const s = create();
        for (let i = 0; i < 10; i++) {
            recordFrame(s, i, 0, 0, 0, 0, i);
        }
        startReplay(s, 1);

        let playing = true;
        let steps = 0;
        while (playing && steps < 1000) {
            playing = advanceReplay(s, 0.1);
            steps++;
        }
        expect(playing).toBe(false);
        expect(s.active).toBe(false);
    });

    it('returns false when no replay is active', () => {
        const s = create();
        expect(advanceReplay(s, 0.016)).toBe(false);
    });
});

describe('getReplayPosition interpolation', () => {
    it('interpolates between frames', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        recordFrame(s, 10, 0, 0, 0, 0, 0);
        startReplay(s, 1);

        advanceReplay(s, 0.0104);
        const p0 = getReplayPosition(s, 0);
        expect(p0).not.toBeNull();
        expect(p0![0]).toBeGreaterThan(1);
        expect(p0![0]).toBeLessThan(9);
    });
});

describe('getSpeedAtFrame', () => {
    it('returns normal speed far from hit', () => {
        expect(getSpeedAtFrame([], 0)).toBeCloseTo(0.8);
        expect(getSpeedAtFrame([], 100)).toBeCloseTo(0.8);
    });

    it('returns hit speed at the hit frame', () => {
        const s = create();
        for (let i = 0; i < 10; i++) {
            recordFrame(s, i, 0, 0, 0, 0, 0);
            if (i === 5) markHit(s);
        }
        startReplay(s, 1);

        advanceReplay(s, 0.15);
        expect(getReplayHitProximity(s)).toBeGreaterThan(0.5);
    });
});

describe('getReplayHitProximity', () => {
    it('returns 0 when no replay is active', () => {
        const s = create();
        expect(getReplayHitProximity(s)).toBe(0);
    });

    it('returns > 0 when cursor is near hit frame', () => {
        const s = create();
        for (let i = 0; i < 20; i++) {
            recordFrame(s, i, 0, 0, 0, 0, 0);
            if (i === 5) markHit(s);
        }
        startReplay(s, 1);
        expect(getReplayHitProximity(s)).toBeGreaterThan(0);
    });
});

describe('getReplayVelocity', () => {
    it('returns null when no replay is active', () => {
        const s = create();
        expect(getReplayVelocity(s, 0)).toBeNull();
    });

    it('computes velocity from position deltas', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        recordFrame(s, 2, 0, 0, 0, 0, 0);
        startReplay(s, 1);

        const vel = getReplayVelocity(s, 0);
        expect(vel).not.toBeNull();
        expect(vel![0]).toBeCloseTo(120);
        expect(vel![1]).toBeCloseTo(0);
        expect(vel![2]).toBeCloseTo(0);
    });

    it('returns null with only one frame', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        const vel = getReplayVelocity(s, 0);
        expect(vel).toBeNull();
    });
});

describe('getReplaySpeed', () => {
    it('returns 0 when no replay is active', () => {
        const s = create();
        expect(getReplaySpeed(s)).toBe(0);
    });

    it('returns normal speed when no hit was recorded', () => {
        const s = create();
        for (let i = 0; i < 60; i++) {
            recordFrame(s, i, 0, 0, 0, 0, 0);
        }
        startReplay(s, 1);
        expect(getReplaySpeed(s)).toBeCloseTo(0.8);
    });
});

describe('getReplayPastHit', () => {
    it('returns 0 when no replay is active', () => {
        const s = create();
        expect(getReplayPastHit(s)).toBe(0);
    });

    it('returns 0 when cursor is before the hit', () => {
        const s = create();
        for (let i = 0; i < 40; i++) {
            recordFrame(s, i, 0, 0, 0, 0, 0);
            if (i === 30) markHit(s);
        }
        startReplay(s, 1);
        expect(getReplayPastHit(s)).toBe(0);
    });

    it('ramps toward 1 when cursor passes the hit', () => {
        const s = create();
        for (let i = 0; i < 60; i++) {
            recordFrame(s, i, 0, 0, 0, 0, 0);
            if (i === 10) markHit(s);
        }
        startReplay(s, 1);
        advanceReplay(s, 1.0);
        expect(getReplayPastHit(s)).toBeGreaterThan(0);
    });
});

describe('clearRecording', () => {
    it('clears recording buffer but not active playback', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        recordFrame(s, 1, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        expect(s.active).toBe(true);

        clearRecording(s);

        expect(s.active).toBe(true);

        endReplay(s);
        recordFrame(s, 5, 0, 0, 0, 0, 0);
        startReplay(s, 0);
        const p0 = getReplayPosition(s, 0);
        expect(p0).not.toBeNull();
        expect(p0![0]).toBeCloseTo(5);
    });
});

describe('hadRealHit', () => {
    it('returns false when no hit was marked', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        recordFrame(s, 1, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        expect(s.hadRealHit).toBe(false);
    });

    it('returns true when markHit was called before replay', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        markHit(s);
        recordFrame(s, 1, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        expect(s.hadRealHit).toBe(true);
    });

    it('returns false after endReplay', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        markHit(s);
        recordFrame(s, 1, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        expect(s.hadRealHit).toBe(true);
        endReplay(s);
        expect(s.hadRealHit).toBe(false);
    });

    it('self-KO has no slow-motion (normal speed throughout)', () => {
        const s = create();
        for (let i = 0; i < 20; i++) {
            recordFrame(s, i, 0, 0, 0, 0, 0);
        }
        startReplay(s, 1);
        expect(s.hadRealHit).toBe(false);
        expect(getReplaySpeed(s)).toBeCloseTo(0.8);
        expect(getReplayHitProximity(s)).toBe(0);
    });
});

describe('hitIndices (multi-hit)', () => {
    it('returns empty array when no hits recorded', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        expect(s.hitIndices).toEqual([]);
    });

    it('tracks a single hit', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        markHit(s);
        recordFrame(s, 1, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        expect(s.hitIndices).toEqual([1]);
    });

    it('tracks multiple hits at different frames', () => {
        const s = create();
        for (let i = 0; i < 20; i++) {
            recordFrame(s, i, 0, 0, 0, 0, 0);
            if (i === 5 || i === 12) markHit(s);
        }
        startReplay(s, 1);
        const indices = s.hitIndices;
        expect(indices.length).toBe(2);
        expect(indices[0]).toBe(6);
        expect(indices[1]).toBe(13);
    });

    it('speed slows around all hits, not just the last', () => {
        const s = create();
        for (let i = 0; i < 80; i++) {
            recordFrame(s, i, 0, 0, 0, 0, 0);
            if (i === 5 || i === 60) markHit(s);
        }
        startReplay(s, 1);
        const indices = s.hitIndices;
        expect(getSpeedAtFrame(indices, indices[0])).toBeCloseTo(
            0.15,
        );
        expect(getSpeedAtFrame(indices, indices[1])).toBeCloseTo(
            0.15,
        );
        expect(getSpeedAtFrame(indices, 35)).toBeCloseTo(0.8);
    });

    it('cleared after endReplay', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        markHit(s);
        recordFrame(s, 1, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        expect(s.hitIndices.length).toBe(1);
        endReplay(s);
        expect(s.hitIndices).toEqual([]);
    });
});

describe('cursorPos', () => {
    it('starts at 0', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        recordFrame(s, 1, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        expect(s.cursorPos).toBe(0);
    });

    it('advances with advanceReplay', () => {
        const s = create();
        for (let i = 0; i < 20; i++) recordFrame(s, i, 0, 0, 0, 0, 0);
        startReplay(s, 1);
        advanceReplay(s, 0.1);
        expect(s.cursorPos).toBeGreaterThan(0);
    });
});

describe('endReplay / resetReplay', () => {
    it('endReplay deactivates playback', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        startReplay(s, 0);
        expect(s.active).toBe(true);
        endReplay(s);
        expect(s.active).toBe(false);
    });

    it('resetReplay clears all state', () => {
        const s = create();
        recordFrame(s, 0, 0, 0, 0, 0, 0);
        markHit(s);
        startReplay(s, 0);
        resetReplay(s);
        expect(s.active).toBe(false);
        expect(getReplayPosition(s, 0)).toBeNull();
        expect(s.scorer).toBe(-1);
    });
});
