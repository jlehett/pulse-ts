/** @jest-environment jsdom */
import { World } from '@pulse-ts/core';
import { installAudio } from './install';
import { useSpatialSound } from './useSpatialSound';
import type { SpatialSoundHandle } from './useSpatialSound';

// ---------------------------------------------------------------------------
// Web Audio API stubs — track all created nodes for assertions
// ---------------------------------------------------------------------------

const createdNodes: {
    oscillators: StubOscillator[];
    gains: StubGain[];
    panners: StubPannerNode[];
} = { oscillators: [], gains: [], panners: [] };

function resetNodes() {
    createdNodes.oscillators = [];
    createdNodes.gains = [];
    createdNodes.panners = [];
}

class StubAudioParam {
    value = 0;
    setValueAtTime = jest.fn();
    linearRampToValueAtTime = jest.fn();
}

class StubOscillator {
    type = 'sine';
    frequency = new StubAudioParam();
    connect = jest.fn().mockReturnThis();
    start = jest.fn();
    stop = jest.fn();
    disconnect = jest.fn();
    constructor() {
        createdNodes.oscillators.push(this);
    }
}

class StubGain {
    gain = new StubAudioParam();
    connect = jest.fn().mockReturnThis();
    constructor() {
        createdNodes.gains.push(this);
    }
}

class StubPannerNode {
    distanceModel = 'inverse';
    refDistance = 1;
    maxDistance = 10000;
    positionX = new StubAudioParam();
    positionY = new StubAudioParam();
    positionZ = new StubAudioParam();
    connect = jest.fn().mockReturnThis();
    constructor() {
        createdNodes.panners.push(this);
    }
}

class StubAudioListener {
    positionX = new StubAudioParam();
    positionY = new StubAudioParam();
    positionZ = new StubAudioParam();
}

class StubAudioContext {
    currentTime = 0;
    sampleRate = 44100;
    state = 'running';
    destination = {};
    listener = new StubAudioListener();
    resume = jest.fn();
    createOscillator() {
        return new StubOscillator();
    }
    createGain() {
        return new StubGain();
    }
    createPanner() {
        return new StubPannerNode();
    }
}

beforeAll(() => {
    (global as any).AudioContext = StubAudioContext;
});

afterAll(() => {
    delete (global as any).AudioContext;
});

beforeEach(resetNodes);

// ---------------------------------------------------------------------------
// Helper: mount a component that calls useSpatialSound and returns the handle
// ---------------------------------------------------------------------------

function mountSpatialSound(type: 'tone', options: any): SpatialSoundHandle {
    const world = new World();
    installAudio(world);
    let handle!: SpatialSoundHandle;
    function SoundComponent() {
        handle = useSpatialSound(type, options);
    }
    world.mount(SoundComponent);
    return handle;
}

// ---------------------------------------------------------------------------
// Looping tone
// ---------------------------------------------------------------------------

describe('useSpatialSound — tone (looping)', () => {
    test('play creates oscillator and panner', () => {
        const sfx = mountSpatialSound('tone', {
            wave: 'sawtooth',
            frequency: 120,
            loop: true,
            gain: 0.3,
        });
        sfx.play();

        expect(createdNodes.panners).toHaveLength(1);
        expect(createdNodes.oscillators).toHaveLength(1);

        const osc = createdNodes.oscillators[0];
        expect(osc.type).toBe('sawtooth');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(120, 0);
        expect(osc.start).toHaveBeenCalled();
    });

    test('panner configured with rolloff and distance', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
            rolloff: 'exponential',
            refDistance: 2,
            maxDistance: 100,
        });
        sfx.play();

        const panner = createdNodes.panners[0];
        expect(panner.distanceModel).toBe('exponential');
        expect(panner.refDistance).toBe(2);
        expect(panner.maxDistance).toBe(100);
    });

    test('defaults rolloff to inverse, refDistance to 1, maxDistance to 50', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
        });
        sfx.play();

        const panner = createdNodes.panners[0];
        expect(panner.distanceModel).toBe('inverse');
        expect(panner.refDistance).toBe(1);
        expect(panner.maxDistance).toBe(50);
    });

    test('stop stops and disconnects the oscillator', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
        });
        sfx.play();
        expect(sfx.playing).toBe(true);

        sfx.stop();
        expect(sfx.playing).toBe(false);
        expect(createdNodes.oscillators[0].stop).toHaveBeenCalled();
        expect(createdNodes.oscillators[0].disconnect).toHaveBeenCalled();
    });

    test('play while already playing is a no-op for looping sounds', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
        });
        sfx.play();
        sfx.play(); // should not create another oscillator

        expect(createdNodes.oscillators).toHaveLength(1);
    });

    test('gain is set on the gain node', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
            gain: 0.5,
        });
        sfx.play();

        // gains[0] = master gain, gains[1] = spatial gain
        const gain = createdNodes.gains[1];
        expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
    });

    test('defaults wave to sine and gain to 0.1', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 200,
            loop: true,
        });
        sfx.play();

        expect(createdNodes.oscillators[0].type).toBe('sine');
        const gain = createdNodes.gains[1];
        expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.1, 0);
    });

    test('panner reused across stop/play cycles', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
        });
        sfx.play();
        sfx.stop();
        sfx.play();

        // Only one panner, but two oscillators
        expect(createdNodes.panners).toHaveLength(1);
        expect(createdNodes.oscillators).toHaveLength(2);
    });
});

// ---------------------------------------------------------------------------
// One-shot tone
// ---------------------------------------------------------------------------

describe('useSpatialSound — tone (one-shot)', () => {
    test('play creates oscillator with duration and gain envelope', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 440,
            duration: 0.3,
            gain: 0.2,
        });
        sfx.play();

        const osc = createdNodes.oscillators[0];
        expect(osc.start).toHaveBeenCalledWith(0);
        expect(osc.stop).toHaveBeenCalledWith(0.3);

        // gains[0] = master, gains[1] = shot gain
        const gain = createdNodes.gains[1];
        expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.2, 0);
        expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.3);
    });

    test('multiple one-shot plays create multiple oscillators', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 440,
            duration: 0.1,
        });
        sfx.play();
        sfx.play();
        sfx.play();

        expect(createdNodes.oscillators).toHaveLength(3);
    });

    test('defaults duration to 0.5 and gain to 0.1', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 440,
        });
        sfx.play();

        const osc = createdNodes.oscillators[0];
        expect(osc.stop).toHaveBeenCalledWith(0.5);

        const gain = createdNodes.gains[1];
        expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.1, 0);
    });

    test('shares panner across multiple one-shot plays', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 440,
            duration: 0.1,
        });
        sfx.play();
        sfx.play();

        expect(createdNodes.panners).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

describe('useSpatialSound — position', () => {
    test('setPosition updates panner position after play', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
        });
        sfx.play();
        sfx.setPosition(5, 10, 15);

        const panner = createdNodes.panners[0];
        expect(panner.positionX.value).toBe(5);
        expect(panner.positionY.value).toBe(10);
        expect(panner.positionZ.value).toBe(15);
    });

    test('setPosition before play stores position for lazy apply', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
        });
        sfx.setPosition(3, 6, 9);

        // No panner yet
        expect(createdNodes.panners).toHaveLength(0);

        sfx.play();

        const panner = createdNodes.panners[0];
        expect(panner.positionX.value).toBe(3);
        expect(panner.positionY.value).toBe(6);
        expect(panner.positionZ.value).toBe(9);
    });
});

// ---------------------------------------------------------------------------
// General
// ---------------------------------------------------------------------------

describe('useSpatialSound — general', () => {
    test('handle exposes expected interface', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
        });

        expect(typeof sfx.play).toBe('function');
        expect(typeof sfx.stop).toBe('function');
        expect(typeof sfx.setPosition).toBe('function');
        expect(typeof sfx.playing).toBe('boolean');
    });

    test('throws if AudioService not installed', () => {
        const world = new World();
        function BadComponent() {
            useSpatialSound('tone', { frequency: 100 });
        }
        expect(() => world.mount(BadComponent)).toThrow(
            'AudioService not provided',
        );
    });

    test('stop before play is a no-op', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
        });
        sfx.stop(); // should not throw
        expect(sfx.playing).toBe(false);
    });

    test('panner connects to master gain destination', () => {
        const sfx = mountSpatialSound('tone', {
            frequency: 100,
            loop: true,
        });
        sfx.play();

        const panner = createdNodes.panners[0];
        // Panner should connect to the master gain (gains[0])
        const masterGain = createdNodes.gains[0];
        expect(panner.connect).toHaveBeenCalledWith(masterGain);
    });
});
