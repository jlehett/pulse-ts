jest.mock(
    '@pulse-ts/core',
    () => ({
        createContext: (name: string) => ({ name }),
        useFrameUpdate: jest.fn(),
        useDestroy: jest.fn(),
        useContext: jest.fn(),
        useStore: jest.fn(() => [{}]),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/three',
    () => ({
        useThreeContext: jest.fn(),
    }),
    { virtual: true },
);

let mockUseOverlay = jest.fn();

jest.mock(
    '@pulse-ts/dom',
    () => ({
        useOverlay: (...args: any[]) => mockUseOverlay(...args),
        Row: 'div',
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/effects',
    () => ({
        useAnimate: jest.fn(() => ({ play: jest.fn(), value: 0 })),
    }),
    { virtual: true },
);

jest.mock('../replay', () => ({
    ReplayStore: {},
}));

import { ScoreHudNode, SCORE_COLORS } from './ScoreHudNode';

beforeEach(() => {
    mockUseOverlay = jest.fn(() => document.createElement('div'));
});

describe('ScoreHudNode', () => {
    it('exports the node function', () => {
        expect(typeof ScoreHudNode).toBe('function');
    });

    it('exports SCORE_COLORS with teal and coral', () => {
        expect(SCORE_COLORS).toEqual(['#48c9b0', '#e74c3c']);
    });

    it('SCORE_COLORS has exactly two entries', () => {
        expect(SCORE_COLORS).toHaveLength(2);
    });
});
