import {
    Mesh,
    MeshStandardMaterial,
    BoxGeometry,
    SphereGeometry,
    Object3D,
    Color
} from 'three';

/**
 * Tiny helpers to build simple meshes, useful in factories.
 */
export class MeshFactories {
    static box(size = 1, color: number | string = 0x44aa88): Object3D {
        const geometry = new BoxGeometry(size, size, size);
        const material = new MeshStandardMaterial({ color: new Color(color) });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    static sphere(radius = 0.5, color: number | string = 0xaa8844, widthSegments = 16, heightSegments = 12): Object3D {
        const geometry = new SphereGeometry(radius, widthSegments, heightSegments);
        const material = new MeshStandardMaterial({ color: new Color(color) });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }
}