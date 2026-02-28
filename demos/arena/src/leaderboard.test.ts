import {
    loadLeaderboard,
    saveMatchResult,
    clearLeaderboard,
    defaultLeaderboard,
} from './leaderboard';

const STORAGE_KEY = 'pulse-arena-leaderboard';

beforeEach(() => {
    localStorage.clear();
});

describe('defaultLeaderboard', () => {
    it('returns zeroed data with empty history', () => {
        const board = defaultLeaderboard();
        expect(board).toEqual({ p1Wins: 0, p2Wins: 0, history: [] });
    });
});

describe('loadLeaderboard', () => {
    it('returns defaults when localStorage is empty', () => {
        expect(loadLeaderboard()).toEqual({
            p1Wins: 0,
            p2Wins: 0,
            history: [],
        });
    });

    it('returns defaults when stored JSON is corrupt', () => {
        localStorage.setItem(STORAGE_KEY, 'not-json!!!');
        expect(loadLeaderboard()).toEqual({
            p1Wins: 0,
            p2Wins: 0,
            history: [],
        });
    });

    it('returns defaults when stored data has wrong shape', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
        expect(loadLeaderboard()).toEqual({
            p1Wins: 0,
            p2Wins: 0,
            history: [],
        });
    });

    it('returns defaults when p1Wins is not a number', () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ p1Wins: 'x', p2Wins: 0, history: [] }),
        );
        expect(loadLeaderboard()).toEqual({
            p1Wins: 0,
            p2Wins: 0,
            history: [],
        });
    });

    it('returns defaults when history is not an array', () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ p1Wins: 0, p2Wins: 0, history: 'nope' }),
        );
        expect(loadLeaderboard()).toEqual({
            p1Wins: 0,
            p2Wins: 0,
            history: [],
        });
    });

    it('loads valid stored data', () => {
        const data = {
            p1Wins: 3,
            p2Wins: 2,
            history: [
                { winner: 0, loserScore: 2, date: '2026-01-01T00:00:00Z' },
            ],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        expect(loadLeaderboard()).toEqual(data);
    });
});

describe('saveMatchResult', () => {
    it('increments p1Wins when player 0 wins', () => {
        const result = saveMatchResult(0, 3);
        expect(result.p1Wins).toBe(1);
        expect(result.p2Wins).toBe(0);
    });

    it('increments p2Wins when player 1 wins', () => {
        const result = saveMatchResult(1, 2);
        expect(result.p1Wins).toBe(0);
        expect(result.p2Wins).toBe(1);
    });

    it('appends a match result to history', () => {
        const result = saveMatchResult(0, 4);
        expect(result.history).toHaveLength(1);
        expect(result.history[0].winner).toBe(0);
        expect(result.history[0].loserScore).toBe(4);
        expect(result.history[0].date).toBeTruthy();
    });

    it('accumulates across multiple saves', () => {
        saveMatchResult(0, 3);
        saveMatchResult(1, 2);
        saveMatchResult(0, 1);
        const board = loadLeaderboard();
        expect(board.p1Wins).toBe(2);
        expect(board.p2Wins).toBe(1);
        expect(board.history).toHaveLength(3);
    });

    it('persists to localStorage', () => {
        saveMatchResult(1, 0);
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw!);
        expect(parsed.p2Wins).toBe(1);
    });
});

describe('clearLeaderboard', () => {
    it('removes all stored data', () => {
        saveMatchResult(0, 2);
        clearLeaderboard();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('loadLeaderboard returns defaults after clear', () => {
        saveMatchResult(0, 2);
        saveMatchResult(1, 3);
        clearLeaderboard();
        expect(loadLeaderboard()).toEqual({
            p1Wins: 0,
            p2Wins: 0,
            history: [],
        });
    });
});

describe('round-trip', () => {
    it('save then load returns consistent data', () => {
        const saved = saveMatchResult(0, 4);
        const loaded = loadLeaderboard();
        expect(loaded.p1Wins).toBe(saved.p1Wins);
        expect(loaded.p2Wins).toBe(saved.p2Wins);
        expect(loaded.history).toEqual(saved.history);
    });
});
