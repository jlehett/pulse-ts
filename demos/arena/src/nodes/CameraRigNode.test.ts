import { CameraRigNode, CAMERA_OFFSET } from './CameraRigNode';

describe('CameraRigNode', () => {
    it('exports the node function', () => {
        expect(typeof CameraRigNode).toBe('function');
    });

    it('camera offset is elevated above the arena', () => {
        const [, y] = CAMERA_OFFSET;
        expect(y).toBeGreaterThan(10);
    });

    it('camera offset has a positive Z for rear view', () => {
        const [, , z] = CAMERA_OFFSET;
        expect(z).toBeGreaterThan(0);
    });
});
