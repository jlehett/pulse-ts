import * as THREE from 'three';

/**
 * Generate a disc mesh whose vertices lie directly on a sphere surface,
 * producing a perfect geodesic circle with no projection distortion.
 *
 * Vertices are emitted in world space — the vertex shader should use
 * `projectionMatrix * viewMatrix * vec4(position, 1.0)` (bypassing modelMatrix).
 *
 * UVs map the disc to a circle centered at (0.5, 0.5) where
 * `length(uv - 0.5) * 2.0` gives normalized geodesic distance from center (0–1).
 */
export function createGeodesicDisc(
    origin: THREE.Vector3,
    radius: number,
    sphereRadius: number,
    segments = 48,
    rings = 12,
): THREE.BufferGeometry {
    const normal = origin.clone().normalize();
    const ref =
        Math.abs(normal.y) < 0.99
            ? new THREE.Vector3(0, 1, 0)
            : new THREE.Vector3(1, 0, 0);
    const tx = new THREE.Vector3().crossVectors(normal, ref).normalize();
    const tz = new THREE.Vector3().crossVectors(tx, normal).normalize();

    const angularRadius = radius / sphereRadius;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const surfaceOffset = 0.08;
    const cn = normal.clone().multiplyScalar(surfaceOffset);
    positions.push(origin.x + cn.x, origin.y + cn.y, origin.z + cn.z);
    uvs.push(0.5, 0.5);

    const dir = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const pn = new THREE.Vector3();

    for (let r = 1; r <= rings; r++) {
        const frac = r / rings;
        const alpha = angularRadius * frac;
        const cosA = Math.cos(alpha);
        const sinA = Math.sin(alpha);

        for (let s = 0; s <= segments; s++) {
            const theta = (s / segments) * Math.PI * 2;
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);

            dir.set(0, 0, 0)
                .addScaledVector(tx, cosT)
                .addScaledVector(tz, sinT);

            pos.set(0, 0, 0)
                .addScaledVector(normal, cosA)
                .addScaledVector(dir, sinA)
                .multiplyScalar(sphereRadius);

            pn.copy(pos).normalize();
            positions.push(
                pos.x + pn.x * surfaceOffset,
                pos.y + pn.y * surfaceOffset,
                pos.z + pn.z * surfaceOffset,
            );

            const uvR = frac * 0.5;
            uvs.push(0.5 + uvR * cosT, 0.5 + uvR * sinT);
        }
    }

    const vpr = segments + 1;
    for (let s = 0; s < segments; s++) {
        indices.push(0, 1 + s, 1 + s + 1);
    }
    for (let r = 1; r < rings; r++) {
        const inner = 1 + (r - 1) * vpr;
        const outer = 1 + r * vpr;
        for (let s = 0; s < segments; s++) {
            indices.push(inner + s, outer + s, outer + s + 1);
            indices.push(inner + s, outer + s + 1, inner + s + 1);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
}
