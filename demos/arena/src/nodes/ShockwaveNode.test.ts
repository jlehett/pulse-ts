jest.mock('three/examples/jsm/postprocessing/ShaderPass.js', () => ({
    ShaderPass: jest.fn(),
}));

import { ShockwaveNode } from './ShockwaveNode';

describe('ShockwaveNode', () => {
    it('is an exported function', () => {
        expect(typeof ShockwaveNode).toBe('function');
    });
});
