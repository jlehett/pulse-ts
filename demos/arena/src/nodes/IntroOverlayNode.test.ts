import { BRAWLER } from '../ai/personalities';
import { INTRO_DURATION } from './IntroOverlayNode';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

let mockFrameUpdateCallbacks: ((dt: number) => void)[] = [];
let mockDestroyCallbacks: (() => void)[] = [];
/** Accumulated time in the mock sequence runner. */
let mockSequenceElapsed = 0;
let mockSequenceSteps: any[] = [];
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

jest.mock(
    '@pulse-ts/core',
    () => ({
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
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/three',
    () => ({
        useThreeContext: () => ({
            renderer: { domElement: mockCanvas },
        }),
    }),
    { virtual: true },
);

let mockUseOverlay = jest.fn();

jest.mock(
    '@pulse-ts/dom',
    () => ({
        useOverlay: (...args: any[]) => mockUseOverlay(...args),
        Column: 'div',
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/effects',
    () => ({
        useSequence: (steps: any[]) => {
            mockSequenceSteps = steps;
            return {
                play() {
                    mockSequenceElapsed = 0;
                },
                reset() {
                    mockSequenceElapsed = 0;
                },
                get finished() {
                    return false;
                },
                get elapsed() {
                    return mockSequenceElapsed;
                },
            };
        },
    }),
    { virtual: true },
);

jest.mock('../overlayAnimations', () => ({
    applyStaggeredEntrance: jest.fn(),
}));

import { IntroOverlayNode } from './IntroOverlayNode';

beforeEach(() => {
    mockFrameUpdateCallbacks = [];
    mockDestroyCallbacks = [];
    mockSequenceElapsed = 0;
    mockSequenceSteps = [];
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
    mockUseOverlay = jest
        .fn()
        .mockImplementation((jsx: any, container: HTMLElement) => {
            const el = document.createElement('div');
            if (jsx?.props?.style) {
                Object.assign(el.style, jsx.props.style);
            }
            if (jsx?.props?.children) {
                for (const child of [].concat(jsx.props.children)) {
                    const childEl = document.createElement('div');
                    if (child?.props?.style) {
                        Object.assign(childEl.style, child.props.style);
                    }
                    if (typeof child?.props?.children === 'string') {
                        childEl.textContent = child.props.children;
                    }
                    el.appendChild(childEl);
                }
            }
            container.appendChild(el);
            mockDestroyCallbacks.push(() => {
                el.remove();
            });
            return el;
        });
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

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

    it('calls useOverlay with JSX and container', () => {
        mount();
        expect(mockUseOverlay).toHaveBeenCalledTimes(1);
        // Second argument should be the container
        expect(mockUseOverlay.mock.calls[0][1]).toBe(mockContainer);
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

    it('creates a sequence with show, fade-out, and countdown steps', () => {
        mount();
        expect(mockSequenceSteps).toHaveLength(3);
        // First step shows the overlay
        expect(typeof mockSequenceSteps[0].action).toBe('function');
        expect(mockSequenceSteps[0].post).toBe(INTRO_DURATION);
        // Second step fades out
        expect(typeof mockSequenceSteps[1].action).toBe('function');
        // Third step transitions to countdown
        expect(typeof mockSequenceSteps[2].action).toBe('function');
    });

    it('sequence show action sets opacity to 1', () => {
        mount();
        mockSequenceSteps[0].action();
        const overlay = mockContainer.firstElementChild as HTMLElement;
        expect(overlay.style.opacity).toBe('1');
    });

    it('sequence fade-out action sets opacity to 0', () => {
        mount();
        mockSequenceSteps[1].action();
        const overlay = mockContainer.firstElementChild as HTMLElement;
        expect(overlay.style.opacity).toBe('0');
    });

    it('sequence countdown action transitions to countdown phase', () => {
        mount();
        mockSequenceSteps[2].action();
        expect(mockGameState.phase).toBe('countdown');
    });

    it('removes the overlay on destroy', () => {
        mount();
        expect(mockContainer.children).toHaveLength(1);
        mockDestroyCallbacks[0]();
        expect(mockContainer.children).toHaveLength(0);
    });

    it('registers a useFrameUpdate and useDestroy callback', () => {
        mount();
        // useOverlay registers cleanup via useDestroy
        // plus the node's own useFrameUpdate
        expect(mockFrameUpdateCallbacks.length).toBeGreaterThanOrEqual(1);
        expect(mockDestroyCallbacks.length).toBeGreaterThanOrEqual(1);
    });
});
