/** @jest-environment jsdom */
import { World } from '@pulse-ts/core';
import { AudioService } from './Audio';
import { installAudio } from '../../public/install';
import { useAudio } from '../../public/hooks';

// Minimal AudioContext / GainNode stubs for jsdom (no Web Audio API)
class StubGainNode {
    gain = { value: 1 };
    connect = jest.fn();
}

class StubAudioListener {
    positionX = { value: 0 };
    positionY = { value: 0 };
    positionZ = { value: 0 };
}

class StubAudioContext {
    state = 'running';
    destination = {};
    listener = new StubAudioListener();
    resume = jest.fn();
    createGain(): StubGainNode {
        return new StubGainNode();
    }
}

beforeAll(() => {
    (global as any).AudioContext = StubAudioContext;
});

afterAll(() => {
    delete (global as any).AudioContext;
});

describe('AudioService', () => {
    test('creates with default master volume of 1', () => {
        const svc = new AudioService();
        expect(svc.masterVolume).toBe(1);
    });

    test('accepts masterVolume option', () => {
        const svc = new AudioService({ masterVolume: 0.5 });
        expect(svc.masterVolume).toBe(0.5);
    });

    test('ensureContext creates AudioContext lazily', () => {
        const svc = new AudioService();
        const ctx = svc.ensureContext();
        expect(ctx).toBeInstanceOf(StubAudioContext);
    });

    test('ensureContext returns same context on subsequent calls', () => {
        const svc = new AudioService();
        const ctx1 = svc.ensureContext();
        const ctx2 = svc.ensureContext();
        expect(ctx1).toBe(ctx2);
    });

    test('ensureContext resumes suspended context', () => {
        const svc = new AudioService();
        const ctx = svc.ensureContext() as unknown as StubAudioContext;
        // Simulate browser suspending the context
        ctx.state = 'suspended';
        svc.ensureContext();
        expect(ctx.resume).toHaveBeenCalled();
    });

    test('destination returns the master gain node', () => {
        const svc = new AudioService({ masterVolume: 0.7 });
        const dest = svc.destination;
        expect(dest).toBeDefined();
        expect((dest as unknown as StubGainNode).gain.value).toBe(0.7);
    });

    test('masterVolume setter updates gain node when context exists', () => {
        const svc = new AudioService({ masterVolume: 1 });
        svc.ensureContext(); // create context + gain
        svc.masterVolume = 0.3;
        expect(svc.masterVolume).toBe(0.3);
        expect(svc.destination).toBeDefined();
        // The gain value should reflect the new volume
        expect((svc.destination as unknown as StubGainNode).gain.value).toBe(
            0.3,
        );
    });

    test('masterVolume setter works before context creation', () => {
        const svc = new AudioService({ masterVolume: 1 });
        svc.masterVolume = 0.5;
        expect(svc.masterVolume).toBe(0.5);
        // Now create context — gain should use updated volume
        const dest = svc.destination;
        expect((dest as unknown as StubGainNode).gain.value).toBe(0.5);
    });

    test('master gain connects to context destination', () => {
        const svc = new AudioService();
        svc.ensureContext();
        const dest = svc.destination as unknown as StubGainNode;
        expect(dest.connect).toHaveBeenCalled();
    });

    test('setListenerPosition updates listener position', () => {
        const svc = new AudioService();
        svc.ensureContext();
        svc.setListenerPosition(5, 10, 15);

        const ctx = svc.ensureContext() as unknown as StubAudioContext;
        expect(ctx.listener.positionX.value).toBe(5);
        expect(ctx.listener.positionY.value).toBe(10);
        expect(ctx.listener.positionZ.value).toBe(15);
    });

    test('setListenerPosition is no-op before context creation', () => {
        const svc = new AudioService();
        // Should not throw when context doesn't exist yet
        svc.setListenerPosition(1, 2, 3);
    });
});

describe('installAudio', () => {
    test('registers AudioService on the world', () => {
        const world = new World();
        const svc = installAudio(world);
        expect(svc).toBeInstanceOf(AudioService);
        expect(world.getService(AudioService)).toBe(svc);
    });

    test('passes options through to AudioService', () => {
        const world = new World();
        const svc = installAudio(world, { masterVolume: 0.6 });
        expect(svc.masterVolume).toBe(0.6);
    });
});

describe('useAudio', () => {
    test('returns installed AudioService inside a component', () => {
        const world = new World();
        const svc = installAudio(world, { masterVolume: 0.8 });
        let hookResult: AudioService | null = null;
        function AudioConsumer() {
            hookResult = useAudio();
        }
        world.mount(AudioConsumer);
        expect(hookResult).toBe(svc);
    });

    test('throws when AudioService is not installed', () => {
        const world = new World();
        function AudioConsumer() {
            useAudio();
        }
        expect(() => world.mount(AudioConsumer)).toThrow(
            'AudioService not provided to world',
        );
    });
});
