import { CameraRigNode, CAMERA_HEIGHT, CAMERA_Z_OFFSET } from './CameraRigNode';

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
});
