/** @jest-environment jsdom */
import { World } from '@pulse-ts/core';
import { installAudio } from './install';
import { useSoundGroup } from './useSoundGroup';
import { useSound } from './useSound';
import type { SoundGroupHandle } from './useSoundGroup';
import type { SoundHandle } from './useSound';
import { AudioService } from '../domain/services/Audio';

// ---------------------------------------------------------------------------
// Web Audio API stubs
// ---------------------------------------------------------------------------

const createdNodes: {
    oscillators: StubOscillator[];
    gains: StubGain[];
} = { oscillators: [], gains: [] };

function resetNodes() {
    createdNodes.oscillators = [];
    createdNodes.gains = [];
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
        return {
            buffer: null,
            connect: jest.fn().mockReturnThis(),
            start: jest.fn(),
            stop: jest.fn(),
        };
    }
    createBiquadFilter() {
        return {
            type: 'lowpass',
            frequency: new StubAudioParam(),
            Q: new StubAudioParam(),
            connect: jest.fn().mockReturnThis(),
        };
    }
    createBuffer(numChannels: number, length: number) {
        return {
            getChannelData: () => new Float32Array(length),
        };
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
// Tests — useSoundGroup
// ---------------------------------------------------------------------------

describe('useSoundGroup', () => {
    test('creates a group with default volume 1 and muted false', () => {
        const world = new World();
        installAudio(world);
        let handle!: SoundGroupHandle;
        world.mount(() => {
            handle = useSoundGroup('sfx');
        });

        expect(handle.name).toBe('sfx');
        expect(handle.volume).toBe(1);
        expect(handle.muted).toBe(false);
    });

    test('creates a group with custom initial volume and muted state', () => {
        const world = new World();
        installAudio(world);
        let handle!: SoundGroupHandle;
        world.mount(() => {
            handle = useSoundGroup('music', { volume: 0.5, muted: true });
        });

        expect(handle.volume).toBe(0.5);
        expect(handle.muted).toBe(true);
    });

    test('setVolume updates the group volume', () => {
        const world = new World();
        installAudio(world);
        let handle!: SoundGroupHandle;
        world.mount(() => {
            handle = useSoundGroup('sfx', { volume: 0.8 });
        });

        handle.setVolume(0.3);
        expect(handle.volume).toBe(0.3);
    });

    test('setMuted updates the group muted state', () => {
        const world = new World();
        installAudio(world);
        let handle!: SoundGroupHandle;
        world.mount(() => {
            handle = useSoundGroup('sfx');
        });

        handle.setMuted(true);
        expect(handle.muted).toBe(true);

        handle.setMuted(false);
        expect(handle.muted).toBe(false);
    });

    test('same group name returns the same group across different components', () => {
        const world = new World();
        installAudio(world);
        let handle1!: SoundGroupHandle;
        let handle2!: SoundGroupHandle;
        world.mount(() => {
            handle1 = useSoundGroup('sfx', { volume: 0.7 });
        });
        world.mount(() => {
            handle2 = useSoundGroup('sfx', { volume: 0.3 }); // initial ignored
        });

        expect(handle1.volume).toBe(0.7);
        expect(handle2.volume).toBe(0.7); // same underlying group

        handle1.setVolume(0.1);
        expect(handle2.volume).toBe(0.1);
    });

    test('groups persist across world lifecycles (tied to AudioService)', () => {
        const audio = new AudioService();

        // First world
        const world1 = new World();
        world1.provideService(audio);
        let handle1!: SoundGroupHandle;
        world1.mount(() => {
            handle1 = useSoundGroup('sfx', { volume: 0.6 });
        });
        handle1.setVolume(0.4);

        // Second world, same AudioService
        const world2 = new World();
        world2.provideService(audio);
        let handle2!: SoundGroupHandle;
        world2.mount(() => {
            handle2 = useSoundGroup('sfx');
        });

        expect(handle2.volume).toBe(0.4);
    });

    test('throws if AudioService not installed', () => {
        const world = new World();
        expect(() =>
            world.mount(() => {
                useSoundGroup('sfx');
            }),
        ).toThrow('AudioService not provided');
    });
});

// ---------------------------------------------------------------------------
// Tests — useSound with group integration
// ---------------------------------------------------------------------------

describe('useSound with group', () => {
    test('scales gain by group volume', () => {
        const world = new World();
        installAudio(world);
        let sfx!: SoundHandle;
        world.mount(() => {
            useSoundGroup('sfx', { volume: 0.5 });
            sfx = useSound('tone', {
                frequency: 440,
                duration: 0.1,
                gain: 0.2,
                group: 'sfx',
            });
        });

        sfx.play();

        // gains[0] is master gain, gains[1] is tone gain
        const toneGain = createdNodes.gains[1];
        // effective gain = 0.2 * 0.5 = 0.1
        expect(toneGain.gain.setValueAtTime).toHaveBeenCalledWith(0.1, 0);
    });

    test('muted group results in zero gain', () => {
        const world = new World();
        installAudio(world);
        let sfx!: SoundHandle;
        let group!: SoundGroupHandle;
        world.mount(() => {
            group = useSoundGroup('sfx', { volume: 0.8 });
            sfx = useSound('tone', {
                frequency: 440,
                duration: 0.1,
                gain: 0.2,
                group: 'sfx',
            });
        });

        group.setMuted(true);
        sfx.play();

        const toneGain = createdNodes.gains[1];
        expect(toneGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
    });

    test('sound without group is unaffected (gain = sound.gain * 1)', () => {
        const world = new World();
        installAudio(world);
        let sfx!: SoundHandle;
        world.mount(() => {
            useSoundGroup('sfx', { volume: 0.1 }); // exists but not used
            sfx = useSound('tone', {
                frequency: 440,
                duration: 0.1,
                gain: 0.2,
                // no group
            });
        });

        sfx.play();

        const toneGain = createdNodes.gains[1];
        // should be unscaled: 0.2 * 1 = 0.2
        expect(toneGain.gain.setValueAtTime).toHaveBeenCalledWith(0.2, 0);
    });

    test('group volume changes apply on next play call', () => {
        const world = new World();
        installAudio(world);
        let sfx!: SoundHandle;
        let group!: SoundGroupHandle;
        world.mount(() => {
            group = useSoundGroup('sfx', { volume: 1 });
            sfx = useSound('tone', {
                frequency: 440,
                duration: 0.1,
                gain: 0.5,
                group: 'sfx',
            });
        });

        // First play at full volume
        sfx.play();
        expect(createdNodes.gains[1].gain.setValueAtTime).toHaveBeenCalledWith(
            0.5,
            0,
        );

        // Change volume, play again
        group.setVolume(0.4);
        sfx.play();
        // gains[0]=master, [1]=first play gain, [2]=second play gain
        expect(createdNodes.gains[2].gain.setValueAtTime).toHaveBeenCalledWith(
            0.2, // 0.5 * 0.4
            0,
        );
    });

    test('sound referencing nonexistent group plays at full gain', () => {
        const world = new World();
        installAudio(world);
        let sfx!: SoundHandle;
        world.mount(() => {
            sfx = useSound('tone', {
                frequency: 440,
                duration: 0.1,
                gain: 0.3,
                group: 'nonexistent',
            });
        });

        sfx.play();

        const toneGain = createdNodes.gains[1];
        expect(toneGain.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0);
    });
});
