import * as THREE from 'three';

const _tempVec = new THREE.Vector3();
const _tempVec2 = new THREE.Vector3();

/**
 * Move a position along the sphere surface by a tangent velocity.
 * The result is re-projected onto the sphere (great-circle arc).
 */
export function moveSpherePosition(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    dt: number,
    sphereRadius: number,
): void {
    position.add(_tempVec.copy(velocity).multiplyScalar(dt));
    position.normalize().multiplyScalar(sphereRadius);
}

/**
 * Project a velocity vector onto the tangent plane of the sphere at a position.
 * Removes any radial (normal) component.
 */
export function projectToTangent(
    velocity: THREE.Vector3,
    position: THREE.Vector3,
): void {
    const normal = _tempVec.copy(position).normalize();
    const dot = velocity.dot(normal);
    velocity.sub(normal.multiplyScalar(dot));
}

/**
 * Get a local tangent frame at a sphere position.
 * Returns forward (tangent along "north-ish") and right (tangent along "east").
 */
export function getTangentFrame(
    position: THREE.Vector3,
    out: { forward: THREE.Vector3; right: THREE.Vector3; up: THREE.Vector3 },
): void {
    const normal = out.up.copy(position).normalize();

    // Choose a reference vector that isn't parallel to normal
    const ref = Math.abs(normal.y) < 0.99
        ? _tempVec.set(0, 1, 0)
        : _tempVec.set(1, 0, 0);

    // Right = cross(normal, ref), then normalize
    out.right.crossVectors(normal, ref).normalize();
    // Forward = cross(right, normal)
    out.forward.crossVectors(out.right, normal).normalize();
}

/**
 * Build a rotation quaternion that orients an object on the sphere surface.
 * "Up" is the surface normal, "forward" is the facing direction.
 */
export function orientOnSphere(
    position: THREE.Vector3,
    facing: THREE.Vector3,
    quaternion: THREE.Quaternion,
): void {
    const up = _tempVec.copy(position).normalize();
    // Ensure facing is tangent
    const tangentFacing = _tempVec2.copy(facing);
    tangentFacing.sub(up.clone().multiplyScalar(tangentFacing.dot(up))).normalize();

    // Build rotation matrix
    const right = new THREE.Vector3().crossVectors(tangentFacing, up).normalize();
    const correctedForward = new THREE.Vector3().crossVectors(up, right).normalize();

    const m = new THREE.Matrix4().makeBasis(right, up, correctedForward);
    quaternion.setFromRotationMatrix(m);
}

/**
 * Compute the great-circle direction from one sphere position to another.
 * Returns a unit tangent vector at `from` pointing toward `to`.
 */
export function geodesicDirection(
    from: THREE.Vector3,
    to: THREE.Vector3,
): THREE.Vector3 {
    const fromNorm = _tempVec.copy(from).normalize();
    const toNorm = _tempVec2.copy(to).normalize();

    // Direction on the tangent plane = project (to - from) onto tangent at from
    const dir = new THREE.Vector3().copy(toNorm).sub(fromNorm);
    const dot = dir.dot(fromNorm);
    dir.sub(fromNorm.clone().multiplyScalar(dot));

    const len = dir.length();
    if (len < 1e-6) return new THREE.Vector3(0, 0, 0);
    return dir.divideScalar(len);
}

/**
 * Raycast from camera through a screen point onto a sphere at origin.
 * Returns the intersection point on the sphere, or null if missed.
 */
export function raycastSphere(
    camera: THREE.Camera,
    screenX: number,
    screenY: number,
    sphereRadius: number,
): THREE.Vector3 | null {
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2(screenX, screenY);
    raycaster.setFromCamera(ndc, camera);

    const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), sphereRadius);
    const intersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectSphere(sphere, intersection);
    return hit ? intersection : null;
}
