import { CameraShakeStore, triggerCameraShake } from './cameraShake';

describe('CameraShakeStore', () => {
    it('exports a store definition', () => {
        expect(CameraShakeStore).toBeDefined();
    });
});

describe('triggerCameraShake', () => {
    it('sets shake state when no shake is active', () => {
        const shake = { intensity: 0, duration: 0, elapsed: 0 };
        triggerCameraShake(shake, 0.5, 0.3);
        expect(shake.intensity).toBe(0.5);
        expect(shake.duration).toBe(0.3);
        expect(shake.elapsed).toBe(0);
    });

    it('does not override a stronger active shake', () => {
        const shake = { intensity: 0.8, duration: 0.5, elapsed: 0.1 };
        triggerCameraShake(shake, 0.3, 0.2);
        expect(shake.intensity).toBe(0.8);
        expect(shake.duration).toBe(0.5);
        expect(shake.elapsed).toBe(0.1);
    });

    it('overrides a weaker active shake and resets elapsed', () => {
        const shake = { intensity: 0.3, duration: 0.2, elapsed: 0.05 };
        triggerCameraShake(shake, 0.8, 0.5);
        expect(shake.intensity).toBe(0.8);
        expect(shake.duration).toBe(0.5);
        expect(shake.elapsed).toBe(0);
    });
});
