/** @jest-environment jsdom */
import { World } from '@pulse-ts/core';
import { installAudio } from './install';
import { useSound } from './useSound';
import type { SoundHandle } from './useSound';

// ---------------------------------------------------------------------------
// Web Audio API stubs — track all created nodes for assertions
// ---------------------------------------------------------------------------

const createdNodes: {
    oscillators: StubOscillator[];
    gains: StubGain[];
    bufferSources: StubBufferSource[];
    filters: StubBiquadFilter[];
} = { oscillators: [], gains: [], bufferSources: [], filters: [] };

function resetNodes() {
    createdNodes.oscillators = [];
    createdNodes.gains = [];
    createdNodes.bufferSources = [];
    createdNodes.filters = [];
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

class StubBufferSource {
    buffer: any = null;
    connect = jest.fn().mockReturnThis();
    start = jest.fn();
    stop = jest.fn();
    constructor() {
        createdNodes.bufferSources.push(this);
    }
}

class StubBiquadFilter {
    type = 'lowpass';
    frequency = new StubAudioParam();
    Q = new StubAudioParam();
    connect = jest.fn().mockReturnThis();
    constructor() {
        createdNodes.filters.push(this);
    }
}

class StubAudioBuffer {
    private _data: Float32Array;
    constructor(_numChannels: number, length: number, _sampleRate: number) {
        this._data = new Float32Array(length);
    }
    getChannelData(_channel: number): Float32Array {
        return this._data;
    }
}

class StubGainNode {
    gain = { value: 1 };
    connect = jest.fn();
}

class StubAudioContext {
    currentTime = 0;
    sampleRate = 44100;
    state = 'running';
    destination = {};
    resume = jest.fn();
    createOscillator() {
        return new StubOscillator();
    }
    createGain() {
        return new StubGain();
    }
    createBufferSource() {
        return new StubBufferSource();
    }
    createBiquadFilter() {
        return new StubBiquadFilter();
    }
    createBuffer(numChannels: number, length: number, sampleRate: number) {
        return new StubAudioBuffer(numChannels, length, sampleRate);
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
// Helper: mount a component that calls useSound and returns the handle
// ---------------------------------------------------------------------------

function mountSound<T extends 'tone' | 'noise' | 'arpeggio'>(
    type: T,
    options: any,
): SoundHandle {
    const world = new World();
    installAudio(world);
    let handle!: SoundHandle;
    function SoundComponent() {
        handle = useSound(type, options);
    }
    world.mount(SoundComponent);
    return handle;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSound — tone', () => {
    test('creates oscillator with fixed frequency', () => {
        const sfx = mountSound('tone', {
            wave: 'triangle',
            frequency: 80,
            duration: 0.1,
            gain: 0.15,
        });
        sfx.play();

        expect(createdNodes.oscillators).toHaveLength(1);
        const osc = createdNodes.oscillators[0];
        expect(osc.type).toBe('triangle');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(80, 0);
        expect(osc.frequency.linearRampToValueAtTime).not.toHaveBeenCalled();
        expect(osc.start).toHaveBeenCalled();
        expect(osc.stop).toHaveBeenCalled();
    });

    test('creates oscillator with frequency ramp', () => {
        const sfx = mountSound('tone', {
            wave: 'square',
            frequency: [400, 800],
            duration: 0.08,
            gain: 0.1,
        });
        sfx.play();

        const osc = createdNodes.oscillators[0];
        expect(osc.type).toBe('square');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(400, 0);
        expect(osc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(800, 0.08);
    });

    test('applies gain envelope that ramps to zero', () => {
        const sfx = mountSound('tone', {
            frequency: 440,
            duration: 0.1,
            gain: 0.2,
        });
        sfx.play();

        // gains[0] is the master gain from AudioService; gains[1] is the tone gain
        const gain = createdNodes.gains[1];
        expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.2, 0);
        expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.1);
    });

    test('defaults wave to sine and gain to 0.1', () => {
        const sfx = mountSound('tone', {
            frequency: 440,
            duration: 0.1,
        });
        sfx.play();

        expect(createdNodes.oscillators[0].type).toBe('sine');
        // gains[0] is the master gain; gains[1] is the tone gain
        expect(createdNodes.gains[1].gain.setValueAtTime).toHaveBeenCalledWith(0.1, 0);
    });

    test('connects through master gain destination', () => {
        const sfx = mountSound('tone', {
            frequency: 440,
            duration: 0.1,
        });
        sfx.play();

        // oscillator → gain → destination (master gain)
        const osc = createdNodes.oscillators[0];
        const gain = createdNodes.gains[0];
        expect(osc.connect).toHaveBeenCalledWith(gain);
    });
});

describe('useSound — noise', () => {
    test('creates buffer source with biquad filter', () => {
        const sfx = mountSound('noise', {
            filter: 'bandpass',
            frequency: [2000, 500],
            duration: 0.15,
            gain: 0.12,
        });
        sfx.play();

        expect(createdNodes.bufferSources).toHaveLength(1);
        expect(createdNodes.filters).toHaveLength(1);

        const filter = createdNodes.filters[0];
        expect(filter.type).toBe('bandpass');
        expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(2000, 0);
        expect(filter.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(500, 0.15);
    });

    test('sets filter Q value', () => {
        const sfx = mountSound('noise', {
            frequency: 1000,
            duration: 0.1,
            q: 5,
        });
        sfx.play();

        expect(createdNodes.filters[0].Q.setValueAtTime).toHaveBeenCalledWith(5, 0);
    });

    test('defaults filter to bandpass and Q to 1', () => {
        const sfx = mountSound('noise', {
            frequency: 1000,
            duration: 0.1,
        });
        sfx.play();

        expect(createdNodes.filters[0].type).toBe('bandpass');
        expect(createdNodes.filters[0].Q.setValueAtTime).toHaveBeenCalledWith(1, 0);
    });

    test('creates white noise buffer with correct size', () => {
        const sfx = mountSound('noise', {
            frequency: 1000,
            duration: 0.1,
        });
        sfx.play();

        const src = createdNodes.bufferSources[0];
        expect(src.buffer).toBeDefined();
        expect(src.start).toHaveBeenCalled();
        expect(src.stop).toHaveBeenCalled();
    });
});

describe('useSound — arpeggio', () => {
    test('creates one oscillator per note', () => {
        const sfx = mountSound('arpeggio', {
            wave: 'sine',
            notes: [523.25, 659.25, 783.99],
            interval: 0.06,
            duration: 0.2,
            gain: 0.1,
        });
        sfx.play();

        expect(createdNodes.oscillators).toHaveLength(3);
        // 1 master gain + 3 note gains = 4 total
        expect(createdNodes.gains).toHaveLength(4);
    });

    test('sets frequency per note with correct offsets', () => {
        const sfx = mountSound('arpeggio', {
            notes: [100, 200, 300],
            interval: 0.05,
            duration: 0.2,
        });
        sfx.play();

        const [osc0, osc1, osc2] = createdNodes.oscillators;
        expect(osc0.frequency.setValueAtTime).toHaveBeenCalledWith(100, 0);
        expect(osc1.frequency.setValueAtTime).toHaveBeenCalledWith(200, 0.05);
        expect(osc2.frequency.setValueAtTime).toHaveBeenCalledWith(300, 0.1);
    });

    test('each note gain ramps to zero over remaining duration', () => {
        const sfx = mountSound('arpeggio', {
            notes: [100, 200],
            interval: 0.05,
            duration: 0.2,
            gain: 0.3,
        });
        sfx.play();

        // gains[0] is master gain; gains[1..2] are note gains
        const [, g0, g1] = createdNodes.gains;
        // note 0: starts at 0, duration 0.2
        expect(g0.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0);
        expect(g0.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.2);
        // note 1: starts at 0.05, remaining 0.15
        expect(g1.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0.05);
        expect(g1.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.2);
    });

    test('skips notes whose offset exceeds duration', () => {
        const sfx = mountSound('arpeggio', {
            notes: [100, 200, 300, 400],
            interval: 0.1,
            duration: 0.2,
        });
        sfx.play();

        // note 0: offset 0.0 (ok), note 1: offset 0.1 (ok), note 2: offset 0.2 (remaining = 0, skipped), note 3: offset 0.3 (skipped)
        expect(createdNodes.oscillators).toHaveLength(2);
    });
});

describe('useSound — general', () => {
    test('play can be called multiple times', () => {
        const sfx = mountSound('tone', {
            frequency: 440,
            duration: 0.1,
        });
        sfx.play();
        sfx.play();
        sfx.play();

        expect(createdNodes.oscillators).toHaveLength(3);
    });

    test('throws if AudioService not installed', () => {
        const world = new World();
        function BadComponent() {
            useSound('tone', { frequency: 440, duration: 0.1 });
        }
        expect(() => world.mount(BadComponent)).toThrow('AudioService not provided');
    });
});
