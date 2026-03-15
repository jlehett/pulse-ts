import {
    CameraRigNode,
    CAMERA_HEIGHT,
    CAMERA_Z_OFFSET,
    REPLAY_CAMERA_HEIGHT,
    REPLAY_CAMERA_FOLLOW_DIST,
    REPLAY_HIT_ZOOM,
    REPLAY_CAMERA_SMOOTH,
    REPLAY_LOSER_FALLEN_Y,
    REPLAY_FALL_ZOOM_RANGE,
    REPLAY_TIE_BASE_SEPARATION,
    REPLAY_TIE_HEIGHT_PER_UNIT,
} from './CameraRigNode';
import {
    CameraShakeStore,
    triggerCameraShake,
} from '../../stores/cameraShake';

describe('CameraRigNode', () => {
    it('exports the node function', () => {
        expect(typeof CameraRigNode).toBe('function');
    });

    it('camera is elevated well above the arena', () => {
        expect(CAMERA_HEIGHT).toBeGreaterThan(10);
    });

    it('camera has a small positive Z offset', () => {
        expect(CAMERA_Z_OFFSET).toBeGreaterThan(0);
        expect(CAMERA_Z_OFFSET).toBeLessThan(5);
    });

    it('replay camera is lower than the overhead camera', () => {
        expect(REPLAY_CAMERA_HEIGHT).toBeLessThan(CAMERA_HEIGHT);
        expect(REPLAY_CAMERA_HEIGHT).toBeGreaterThan(5);
    });

    it('replay camera follows from behind', () => {
        expect(REPLAY_CAMERA_FOLLOW_DIST).toBeGreaterThan(0);
    });

    it('hit zoom subtracts from camera height', () => {
        expect(REPLAY_HIT_ZOOM).toBeGreaterThan(0);
        expect(REPLAY_CAMERA_HEIGHT - REPLAY_HIT_ZOOM).toBeGreaterThan(2);
    });

    it('replay smoothing factor is positive', () => {
        expect(REPLAY_CAMERA_SMOOTH).toBeGreaterThan(0);
    });

    it('loser fallen threshold is below the platform', () => {
        expect(REPLAY_LOSER_FALLEN_Y).toBeLessThan(0);
    });

    it('fall zoom range is positive', () => {
        expect(REPLAY_FALL_ZOOM_RANGE).toBeGreaterThan(0);
    });

    it('tie base separation is positive', () => {
        expect(REPLAY_TIE_BASE_SEPARATION).toBeGreaterThan(0);
    });

    it('tie height per unit is positive', () => {
        expect(REPLAY_TIE_HEIGHT_PER_UNIT).toBeGreaterThan(0);
    });
});

describe('CameraShakeStore', () => {
    it('exports the store definition', () => {
        expect(CameraShakeStore).toBeDefined();
    });
});

describe('triggerCameraShake', () => {
    it('sets shake state on the store object', () => {
        const shake = { intensity: 0, duration: 0, elapsed: 0 };
        triggerCameraShake(shake, 0.5, 0.3);
        expect(shake.intensity).toBe(0.5);
        expect(shake.duration).toBe(0.3);
        expect(shake.elapsed).toBe(0);
    });

    it('weaker shake does not override stronger active shake', () => {
        const shake = { intensity: 0, duration: 0, elapsed: 0 };
        triggerCameraShake(shake, 0.8, 0.5);
        triggerCameraShake(shake, 0.3, 0.2); // should be ignored
        expect(shake.intensity).toBe(0.8);
        expect(shake.duration).toBe(0.5);
    });

    it('stronger shake overrides weaker active shake', () => {
        const shake = { intensity: 0, duration: 0, elapsed: 0 };
        triggerCameraShake(shake, 0.3, 0.2);
        triggerCameraShake(shake, 0.8, 0.5);
        expect(shake.intensity).toBe(0.8);
        expect(shake.duration).toBe(0.5);
        expect(shake.elapsed).toBe(0);
    });
});
