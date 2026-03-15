import { BRAWLER } from '../../ai/personalities';

/* ------------------------------------------------------------------ */
/*  Mocks — capture hook callbacks so we can invoke them in tests     */
/* ------------------------------------------------------------------ */

const mockFixedUpdateCallbacks: (() => void)[] = [];
const mockDestroyCallbacks: (() => void)[] = [];
let mockChildCalls: { fn: unknown; props: unknown }[] = [];
let mockGameState = {
    phase: 'playing' as string,
    paused: false,
    scores: [0, 0] as [number, number],
};

const mockInput = {
    holdAxis2D: jest.fn(),
    releaseAxis2D: jest.fn(),
    injectDigital: jest.fn(),
};

jest.mock('@pulse-ts/core', () => ({
    createContext: (name: string) => ({ name }),
    useFixedUpdate: (cb: () => void) => {
        mockFixedUpdateCallbacks.push(cb);
    },
    useDestroy: (cb: () => void) => {
        mockDestroyCallbacks.push(cb);
    },
    useChild: (fn: unknown, props?: unknown) => {
        mockChildCalls.push({ fn, props });
    },
    useContext: () => mockGameState,
}));

jest.mock('@pulse-ts/input', () => ({
    useInput: () => mockInput,
}));

jest.mock('../../ai/playerPositions', () => ({
    getPlayerPosition: (id: number) => (id === 1 ? [0, 0, 0] : [5, 0, 5]),
}));

jest.mock('../../ai/aiDecision', () => ({
    computeAiDecision: jest.fn(() => ({
        moveX: 0.7,
        moveY: -0.3,
        dash: true,
    })),
}));

jest.mock('../../ai/aiState', () => ({
    createAiState: jest.fn(() => ({ initialized: false })),
    updateAiState: jest.fn(),
}));

jest.mock('./LocalPlayerNode', () => ({
    LocalPlayerNode: jest.fn(),
}));

import { AiPlayerNode } from './AiPlayerNode';
import { LocalPlayerNode } from './LocalPlayerNode';
import { computeAiDecision } from '../../ai/aiDecision';
import { createAiState, updateAiState } from '../../ai/aiState';

beforeEach(() => {
    mockFixedUpdateCallbacks.length = 0;
    mockDestroyCallbacks.length = 0;
    mockChildCalls = [];
    mockGameState = {
        phase: 'playing',
        paused: false,
        scores: [0, 0],
    };
    jest.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('AiPlayerNode', () => {
    const PROPS = {
        playerId: 1,
        moveAction: 'p2Move',
        dashAction: 'p2Dash',
        personality: BRAWLER,
    } as const;

    function mount() {
        AiPlayerNode(PROPS);
    }

    it('mounts a LocalPlayerNode as a child with personality color', () => {
        mount();
        expect(mockChildCalls).toHaveLength(1);
        expect(mockChildCalls[0].fn).toBe(LocalPlayerNode);
        expect(mockChildCalls[0].props).toEqual({
            playerId: 1,
            moveAction: 'p2Move',
            dashAction: 'p2Dash',
            customColor: BRAWLER.color,
        });
    });

    it('creates AI state on mount', () => {
        mount();
        expect(createAiState).toHaveBeenCalled();
    });

    it('registers a useFixedUpdate and useDestroy callback', () => {
        mount();
        expect(mockFixedUpdateCallbacks).toHaveLength(1);
        expect(mockDestroyCallbacks).toHaveLength(1);
    });

    describe('fixed update — playing phase', () => {
        it('updates state and calls computeAiDecision with state', () => {
            mount();
            mockFixedUpdateCallbacks[0]();

            expect(updateAiState).toHaveBeenCalled();
            expect(computeAiDecision).toHaveBeenCalledWith(
                BRAWLER,
                expect.any(Object), // state
                0,
                0, // self position (player 1 → [0,0,0])
                5,
                5, // opponent position (player 0 → [5,0,5])
                expect.any(Number), // arenaRadius
                1 / 60, // dt
                expect.any(Number), // random
            );

            expect(mockInput.holdAxis2D).toHaveBeenCalledWith('p2Move', {
                x: 0.7,
                y: -0.3,
            });
            expect(mockInput.injectDigital).toHaveBeenCalledWith(
                'p2Dash',
                'ai:bot',
                true,
            );
        });
    });

    describe('fixed update — non-playing phase', () => {
        it('releases input when phase is not playing', () => {
            mockGameState.phase = 'ko_flash';
            mount();
            mockFixedUpdateCallbacks[0]();

            expect(computeAiDecision).not.toHaveBeenCalled();
            expect(mockInput.releaseAxis2D).toHaveBeenCalledWith('p2Move');
            expect(mockInput.injectDigital).toHaveBeenCalledWith(
                'p2Dash',
                'ai:bot',
                false,
            );
        });

        it('still computes AI decision when paused (engine timeScale handles freeze)', () => {
            mockGameState.paused = true;
            mount();
            mockFixedUpdateCallbacks[0]();

            // Pause is now handled by engine timeScale=0, not app-level guards.
            // When phase is 'playing', AI computes normally — the engine simply
            // won't call useFixedUpdate when timeScale=0.
            expect(computeAiDecision).toHaveBeenCalled();
            expect(mockInput.holdAxis2D).toHaveBeenCalledWith('p2Move', {
                x: 0.7,
                y: -0.3,
            });
        });
    });

    describe('destroy', () => {
        it('releases movement and clears dash on destroy', () => {
            mount();
            mockDestroyCallbacks[0]();

            expect(mockInput.releaseAxis2D).toHaveBeenCalledWith('p2Move');
            expect(mockInput.injectDigital).toHaveBeenCalledWith(
                'p2Dash',
                'ai:bot',
                false,
            );
        });
    });
});
