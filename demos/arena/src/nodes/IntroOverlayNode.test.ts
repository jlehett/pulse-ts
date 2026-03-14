import { BRAWLER } from '../ai/personalities';
import { INTRO_DURATION } from './IntroOverlayNode';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

let mockFrameUpdateCallbacks: ((dt: number) => void)[] = [];
let mockDestroyCallbacks: (() => void)[] = [];
let mockGameState = {
    phase: 'intro' as string,
    scores: [0, 0] as [number, number],
    round: 1,
    lastKnockedOut: -1,
    countdownValue: -1,
    matchWinner: -1,
    pendingKnockout: -1,
    paused: false,
};

const mockContainer = document.createElement('div');
const mockCanvas = document.createElement('canvas');
Object.defineProperty(mockCanvas, 'parentElement', {
    get: () => mockContainer,
});

jest.mock('@pulse-ts/core', () => ({
    createContext: (name: string) => ({ name }),
    useFrameUpdate: (cb: (dt: number) => void) => {
        mockFrameUpdateCallbacks.push(cb);
    },
    useDestroy: (cb: () => void) => {
        mockDestroyCallbacks.push(cb);
    },
    useContext: () => mockGameState,
    color: (hex: number) => {
        const r = (hex >> 16) & 0xff;
        const g = (hex >> 8) & 0xff;
        const b = hex & 0xff;
        return {
            num: hex,
            hex: `#${hex.toString(16).padStart(6, '0')}`,
            rgb: `rgb(${r}, ${g}, ${b})`,
            r,
            g,
            b,
            rgba: (a: number) => `rgba(${r}, ${g}, ${b}, ${a})`,
        };
    },
}));

jest.mock('@pulse-ts/three', () => ({
    useThreeContext: () => ({
        renderer: { domElement: mockCanvas },
    }),
}));

jest.mock('../overlayAnimations', () => ({
    applyStaggeredEntrance: jest.fn(),
}));

import { IntroOverlayNode } from './IntroOverlayNode';

beforeEach(() => {
    mockFrameUpdateCallbacks = [];
    mockDestroyCallbacks = [];
    mockGameState = {
        phase: 'intro',
        scores: [0, 0],
        round: 1,
        lastKnockedOut: -1,
        countdownValue: -1,
        matchWinner: -1,
        pendingKnockout: -1,
        paused: false,
    };
    mockContainer.innerHTML = '';
    jest.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

// hexToCss was replaced by color() from @pulse-ts/core — tested in core package

describe('IntroOverlayNode', () => {
    function mount() {
        IntroOverlayNode({ personality: BRAWLER });
    }

    it('appends an overlay element to the container', () => {
        mount();
        expect(mockContainer.children).toHaveLength(1);
        const overlay = mockContainer.firstElementChild as HTMLElement;
        expect(overlay.style.zIndex).toBe('3000');
    });

    it('displays VS label and personality name', () => {
        mount();
        const text = mockContainer.textContent ?? '';
        expect(text).toContain('VS');
        expect(text).toContain(BRAWLER.name.toUpperCase());
    });

    it('displays personality tagline', () => {
        mount();
        const text = mockContainer.textContent ?? '';
        expect(text).toContain(BRAWLER.tagline);
    });

    it('sets opacity to 1 during intro phase', () => {
        mount();
        mockFrameUpdateCallbacks[0](0.016);
        const overlay = mockContainer.firstElementChild as HTMLElement;
        expect(overlay.style.opacity).toBe('1');
    });

    it('sets opacity to 0 when phase is not intro', () => {
        mount();
        mockGameState.phase = 'playing';
        mockFrameUpdateCallbacks[0](0.016);
        const overlay = mockContainer.firstElementChild as HTMLElement;
        expect(overlay.style.opacity).toBe('0');
    });

    it('renders as full-width top banner with dark background', () => {
        mount();
        const overlay = mockContainer.firstElementChild as HTMLElement;
        expect(overlay.style.top).toBe('0px');
        expect(overlay.style.left).toBe('0px');
        expect(overlay.style.right).toBe('0px');
        expect(overlay.style.alignItems).toBe('flex-start');
        expect(overlay.style.backgroundColor).toContain('rgba(0, 0, 0');
    });

    it('fades out after INTRO_DURATION seconds', () => {
        mount();
        // Advance past the intro duration
        mockFrameUpdateCallbacks[0](INTRO_DURATION + 0.1);
        const overlay = mockContainer.firstElementChild as HTMLElement;
        expect(overlay.style.opacity).toBe('0');
    });

    it('transitions to countdown phase after fade', () => {
        jest.useFakeTimers();
        mount();
        // Advance past intro duration to trigger fade-out
        mockFrameUpdateCallbacks[0](INTRO_DURATION + 0.1);
        // Fast-forward the setTimeout
        jest.runAllTimers();
        expect(mockGameState.phase).toBe('countdown');
        jest.useRealTimers();
    });

    it('removes the overlay on destroy', () => {
        mount();
        expect(mockContainer.children).toHaveLength(1);
        mockDestroyCallbacks[0]();
        expect(mockContainer.children).toHaveLength(0);
    });

    it('registers a useFrameUpdate and useDestroy callback', () => {
        mount();
        expect(mockFrameUpdateCallbacks).toHaveLength(1);
        expect(mockDestroyCallbacks).toHaveLength(1);
    });
});
