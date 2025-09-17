/**
 * Registers serializers for any components provided by @pulse-ts/three.
 *
 * This is a no-op unless @pulse-ts/three defines components that require
 * save/load support. It remains safe when @pulse-ts/three is not installed.
 */
import { registerComponentSerializer } from '../registries/componentRegistry';
import { registerServiceSerializer } from '../registries/serviceRegistry';

/**
 * Register serializers for any components/services provided by @pulse-ts/three.
 */
export function registerThreeSerializers(): void {
    // Dynamically import @pulse-ts/three when present to keep it optional.
    // Registration is deferred; safe to call whether the package is installed or not.
    import('@pulse-ts/three')
        .then((mod) => {
            const { ThreeService } = mod as any;

            if (ThreeService) {
                registerServiceSerializer(ThreeService, {
                    id: 'three:service',
                    serialize(_world, svc: any) {
                        const c = svc.camera;
                        return {
                            camera: {
                                p: [c.position.x, c.position.y, c.position.z],
                                q: [
                                    c.quaternion.x,
                                    c.quaternion.y,
                                    c.quaternion.z,
                                    c.quaternion.w,
                                ],
                                fov: c.fov,
                                near: c.near,
                                far: c.far,
                            },
                        };
                    },
                    deserialize(world, data: any) {
                        const svc = world.getService(ThreeService)!;
                        if (!svc || !data || !data.camera) return;
                        const d = data.camera as any;
                        svc.camera.position.set(d.p[0], d.p[1], d.p[2]);
                        svc.camera.quaternion.set(
                            d.q[0],
                            d.q[1],
                            d.q[2],
                            d.q[3],
                        );
                        if (typeof d.fov === 'number') svc.camera.fov = d.fov;
                        if (typeof d.near === 'number')
                            svc.camera.near = d.near;
                        if (typeof d.far === 'number') svc.camera.far = d.far;
                        svc.camera.updateProjectionMatrix();
                        svc.camera.updateMatrixWorld();
                    },
                });
            }
        })
        .catch(() => {
            // Optional peer not installed; ignore.
        });
}
