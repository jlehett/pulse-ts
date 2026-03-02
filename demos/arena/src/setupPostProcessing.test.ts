import { setupPostProcessing } from './setupPostProcessing';

// Mock three.js and postprocessing modules
jest.mock('three', () => ({
    ACESFilmicToneMapping: 6,
    Vector2: jest.fn(),
}));

jest.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
    EffectComposer: jest.fn().mockImplementation(() => ({
        addPass: jest.fn(),
        render: jest.fn(),
        setSize: jest.fn(),
    })),
}));

jest.mock('three/examples/jsm/postprocessing/RenderPass.js', () => ({
    RenderPass: jest.fn(),
}));

jest.mock('three/examples/jsm/postprocessing/UnrealBloomPass.js', () => ({
    UnrealBloomPass: jest.fn(),
}));

jest.mock('three/examples/jsm/postprocessing/OutputPass.js', () => ({
    OutputPass: jest.fn(),
}));

function createMockThreeService() {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 800 });
    Object.defineProperty(canvas, 'clientHeight', { value: 600 });

    return {
        renderer: {
            domElement: canvas,
            toneMapping: 0,
            toneMappingExposure: 1,
        },
        scene: {},
        camera: {},
        composer: null as any,
        setComposer: jest.fn(function (this: any, c: any) {
            this.composer = c;
        }),
    };
}

describe('setupPostProcessing', () => {
    it('sets ACESFilmic tone mapping on the renderer', () => {
        const svc = createMockThreeService();
        setupPostProcessing(svc as any);
        expect(svc.renderer.toneMapping).toBe(6); // ACESFilmicToneMapping
        expect(svc.renderer.toneMappingExposure).toBe(1.0);
    });

    it('calls setComposer with an EffectComposer', () => {
        const svc = createMockThreeService();
        setupPostProcessing(svc as any);
        expect(svc.setComposer).toHaveBeenCalledTimes(1);
        expect(svc.setComposer).toHaveBeenCalledWith(expect.any(Object));
    });

    it('adds three passes to the composer (render, bloom, output)', () => {
        const svc = createMockThreeService();
        setupPostProcessing(svc as any);
        const composer = svc.setComposer.mock.calls[0][0];
        expect(composer.addPass).toHaveBeenCalledTimes(3);
    });
});
