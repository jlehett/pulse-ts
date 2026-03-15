/* ------------------------------------------------------------------ */
/*  Mocks                                                             */
/* ------------------------------------------------------------------ */

const mockSetTimeScale = jest.fn();
const mockFrameUpdateCallbacks: ((dt: number) => void)[] = [];
const mockDestroyCallbacks: (() => void)[] = [];
let mockGameState = {
    phase: 'playing' as string,
    paused: false,
};
let mockPauseAction = { pressed: false };

jest.mock('@pulse-ts/core', () => ({
    createContext: (name: string) => ({ name }),
    useFrameUpdate: (cb: (dt: number) => void) => {
        mockFrameUpdateCallbacks.push(cb);
    },
    useDestroy: (cb: () => void) => {
        mockDestroyCallbacks.push(cb);
    },
    useContext: () => mockGameState,
    useWorld: () => ({ setTimeScale: mockSetTimeScale }),
}));

jest.mock('@pulse-ts/input', () => ({
    useAction: () => () => mockPauseAction,
}));

jest.mock('@pulse-ts/three', () => ({
    useThreeContext: () => ({
        renderer: {
            domElement: {
                parentElement: global.document.body,
            },
        },
    }),
}));

jest.mock('../../ui/overlayAnimations', () => ({
    applyStaggeredEntrance: jest.fn(),
    applyButtonHoverScale: jest.fn(),
}));

import { PauseMenuNode } from './PauseMenuNode';

beforeEach(() => {
    mockFrameUpdateCallbacks.length = 0;
    mockDestroyCallbacks.length = 0;
    mockGameState = { phase: 'playing', paused: false };
    mockPauseAction = { pressed: false };
    jest.clearAllMocks();
    global.document.body.innerHTML = '';
});

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('PauseMenuNode', () => {
    it('exports the node function', () => {
        expect(typeof PauseMenuNode).toBe('function');
    });

    /** Find the last useFrameUpdate callback (the node's own, after useOverlay's). */
    function getNodeFrameUpdate() {
        return mockFrameUpdateCallbacks[mockFrameUpdateCallbacks.length - 1];
    }

    describe('offline mode — setTimeScale', () => {
        function mount() {
            PauseMenuNode();
        }

        it('calls setTimeScale(0) when pausing via Escape', () => {
            mount();
            mockPauseAction = { pressed: true };
            getNodeFrameUpdate()(0.016);

            expect(mockSetTimeScale).toHaveBeenCalledWith(0);
            expect(mockGameState.paused).toBe(true);
        });

        it('calls setTimeScale(1) when unpausing via Escape', () => {
            mount();
            // First press: pause
            mockPauseAction = { pressed: true };
            getNodeFrameUpdate()(0.016);
            mockSetTimeScale.mockClear();

            // Second press: unpause
            mockPauseAction = { pressed: true };
            getNodeFrameUpdate()(0.016);

            expect(mockSetTimeScale).toHaveBeenCalledWith(1);
            expect(mockGameState.paused).toBe(false);
        });

        it('does not call setTimeScale when Escape is not pressed', () => {
            mount();
            mockPauseAction = { pressed: false };
            getNodeFrameUpdate()(0.016);
            expect(mockSetTimeScale).not.toHaveBeenCalled();
        });
    });

    describe('online mode — no setTimeScale', () => {
        function mount() {
            PauseMenuNode({ online: true });
        }

        it('does not call setTimeScale when toggling online menu', () => {
            mount();
            mockPauseAction = { pressed: true };
            getNodeFrameUpdate()(0.016);

            expect(mockSetTimeScale).not.toHaveBeenCalled();
        });
    });

    describe('button click — setTimeScale', () => {
        it('calls setTimeScale(1) when Resume is clicked', () => {
            PauseMenuNode();
            const buttons = global.document.querySelectorAll('button');
            const resumeBtn = Array.from(buttons).find(
                (b) => b.textContent === 'Resume',
            )!;

            // Pause first
            mockGameState.paused = true;
            mockSetTimeScale.mockClear();

            resumeBtn.click();

            expect(mockSetTimeScale).toHaveBeenCalledWith(1);
            expect(mockGameState.paused).toBe(false);
        });

        it('calls setTimeScale(1) when Exit Match is clicked', () => {
            const onRequestMenu = jest.fn();
            PauseMenuNode({ onRequestMenu });
            const buttons = global.document.querySelectorAll('button');
            const exitBtn = Array.from(buttons).find(
                (b) => b.textContent === 'Exit Match',
            )!;

            // Pause first
            mockGameState.paused = true;
            mockSetTimeScale.mockClear();

            exitBtn.click();

            expect(mockSetTimeScale).toHaveBeenCalledWith(1);
            expect(mockGameState.paused).toBe(false);
            expect(onRequestMenu).toHaveBeenCalled();
        });
    });
});
