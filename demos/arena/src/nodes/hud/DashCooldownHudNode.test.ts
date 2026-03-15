jest.mock('@pulse-ts/core', () => ({
    useFrameUpdate: jest.fn(),
    useDestroy: jest.fn(),
    useContext: jest.fn(),
    createContext: (name: string) => ({ name }),
}));

jest.mock('@pulse-ts/three', () => ({
    useThreeContext: jest.fn(),
}));

jest.mock('../../isMobileDevice', () => ({
    isMobileDevice: jest.fn(() => false),
}));

jest.mock('../../stores/dashCooldown', () => ({
    getDashCooldownProgress: jest.fn(() => 0),
}));

jest.mock('../../stores/replay', () => ({
    ReplayStore: {},
}));

import { DashCooldownHudNode } from './DashCooldownHudNode';

describe('DashCooldownHudNode', () => {
    it('exports a function', () => {
        expect(typeof DashCooldownHudNode).toBe('function');
    });
});
