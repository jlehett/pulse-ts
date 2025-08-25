import {
    Mesh,
    MeshStandardMaterial,
    BoxGeometry,
    SphereGeometry,
    Object3D,
    Color,
} from 'three';

/**
 * Tiny helpers to build simple meshes, useful in factories.
 */
export class MeshFactories {
    //#region Public Static Methods

    /**
     * Create a box mesh.
     * @param size The size of the box.
     * @param color The color of the box.
     * @returns The box mesh.
     */
    static box(size = 1, color: number | string = 0x44aa88): Object3D {
        const geometry = new BoxGeometry(size, size, size);
        const material = new MeshStandardMaterial({ color: new Color(color) });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    /**
     * Create a sphere mesh.
     * @param radius The radius of the sphere.
     * @param color The color of the sphere.
     * @param widthSegments The number of segments around the width of the sphere.
     * @param heightSegments The number of segments around the height of the sphere.
     * @returns The sphere mesh.
     */
    static sphere(
        radius = 0.5,
        color: number | string = 0xaa8844,
        widthSegments = 16,
        heightSegments = 12,
    ): Object3D {
        const geometry = new SphereGeometry(
            radius,
            widthSegments,
            heightSegments,
        );
        const material = new MeshStandardMaterial({ color: new Color(color) });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    //#endregion
}
