jest.mock('three/examples/jsm/postprocessing/ShaderPass.js', () => ({
    ShaderPass: jest.fn(),
}));

import { RemotePlayerNode } from './RemotePlayerNode';

describe('RemotePlayerNode', () => {
    it('exports the node function', () => {
        expect(typeof RemotePlayerNode).toBe('function');
    });
});
