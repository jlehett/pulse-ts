jest.mock('@pulse-ts/core', () => ({
    useFrameUpdate: jest.fn(),
    useDestroy: jest.fn(),
    useContext: jest.fn(),
    createContext: (name: string) => ({ name }),
}));

jest.mock('@pulse-ts/three', () => ({
    useThreeContext: jest.fn(),
}));

jest.mock('../overlayAnimations', () => ({
    applyScalePop: jest.fn(),
}));

import { CountdownOverlayNode, countdownLabel } from './CountdownOverlayNode';

describe('CountdownOverlayNode', () => {
    it('exports the node function', () => {
        expect(typeof CountdownOverlayNode).toBe('function');
    });
});

describe('countdownLabel', () => {
    it('returns string digit for values above 0', () => {
        expect(countdownLabel(3)).toBe('3');
        expect(countdownLabel(2)).toBe('2');
        expect(countdownLabel(1)).toBe('1');
    });

    it('returns "GO!" for 0', () => {
        expect(countdownLabel(0)).toBe('GO!');
    });

    it('returns "GO!" for negative values', () => {
        expect(countdownLabel(-1)).toBe('GO!');
    });
});
