import { World, Node, attachComponent, Transform } from '@pulse-ts/core';
import { Collider } from '../../../public/components/Collider';
import { detectCollision } from './detect';

function makeSphere(
    world: World,
    x: number,
    y: number,
    z: number,
    radius: number,
) {
    const n = new Node();
    world.add(n);
    const t = attachComponent(n, Transform);
    t.localPosition.set(x, y, z);
    const c = attachComponent(n, Collider);
    c.kind = 'sphere';
    c.radius = radius;
    return c;
}

function makeCylinder(
    world: World,
    x: number,
    y: number,
    z: number,
    radius: number,
    halfHeight: number,
) {
    const n = new Node();
    world.add(n);
    const t = attachComponent(n, Transform);
    t.localPosition.set(x, y, z);
    const c = attachComponent(n, Collider);
    c.kind = 'cylinder';
    c.cylRadius = radius;
    c.cylHalfHeight = halfHeight;
    return c;
}

function makePlane(world: World, y: number) {
    const n = new Node();
    world.add(n);
    const t = attachComponent(n, Transform);
    t.localPosition.set(0, y, 0);
    const c = attachComponent(n, Collider);
    c.kind = 'plane';
    return c;
}

function makeBox(
    world: World,
    x: number,
    y: number,
    z: number,
    hx: number,
    hy: number,
    hz: number,
) {
    const n = new Node();
    world.add(n);
    const t = attachComponent(n, Transform);
    t.localPosition.set(x, y, z);
    const c = attachComponent(n, Collider);
    c.kind = 'box';
    c.halfX = hx;
    c.halfY = hy;
    c.halfZ = hz;
    return c;
}

describe('sphere-cylinder collision', () => {
    it('detects sphere above top cap (centered)', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 2, 1);
        // Sphere just above top cap: center at y=1.4, radius=0.5 → touching cap at y=1
        const sphere = makeSphere(world, 0, 1.4, 0, 0.5);
        const res = detectCollision(sphere, cyl);
        expect(res).not.toBeNull();
        // Convention: normal from A toward B → from sphere(above) toward cyl(below) = -Y
        expect(res!.ny).toBeLessThan(-0.9);
        expect(res!.depth).toBeCloseTo(0.1, 1);
    });

    it('detects sphere beside barrel at midheight', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 2, 1);
        // Sphere at x=2.3 (just touching barrel of radius 2), radius=0.5
        const sphere = makeSphere(world, 2.3, 0, 0, 0.5);
        const res = detectCollision(sphere, cyl);
        expect(res).not.toBeNull();
        // Convention: normal from A toward B → from sphere(+X) toward cyl(origin) = -X
        expect(res!.nx).toBeLessThan(-0.9);
        expect(res!.depth).toBeCloseTo(0.2, 1);
    });

    it('detects sphere at cap rim (corner case)', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 2, 1);
        // Sphere near the rim edge — diagonally above/outside
        const sphere = makeSphere(world, 2.2, 1.2, 0, 0.5);
        const res = detectCollision(sphere, cyl);
        expect(res).not.toBeNull();
        // Convention: normal from A toward B → from sphere toward cyl = -X, -Y
        expect(res!.nx).toBeLessThan(0);
        expect(res!.ny).toBeLessThan(0);
    });

    it('returns null for separated sphere', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 2, 1);
        // Sphere far away
        const sphere = makeSphere(world, 10, 10, 10, 0.5);
        const res = detectCollision(sphere, cyl);
        expect(res).toBeNull();
    });

    it('detects sphere barely touching barrel (depth near zero)', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 2, 1);
        // Sphere at x = 2.49, radius = 0.5 → just barely touching
        const sphere = makeSphere(world, 2.49, 0, 0, 0.5);
        const res = detectCollision(sphere, cyl);
        expect(res).not.toBeNull();
        expect(res!.depth).toBeCloseTo(0.01, 1);
    });

    it('handles arena scenario: sphere(r=0.8) vs cylinder(r=14, hh=0.25)', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 14, 0.25);
        // Player sphere sitting on top of cylinder
        const sphere = makeSphere(world, 5, 1, 3, 0.8);
        const res = detectCollision(sphere, cyl);
        expect(res).not.toBeNull();
        // Convention: normal from A toward B → from sphere(above) toward cyl(below) = -Y
        expect(res!.ny).toBeLessThan(-0.9);
    });

    it('works with cylinder as A and sphere as B (reversed order)', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 2, 1);
        const sphere = makeSphere(world, 0, 1.4, 0, 0.5);
        const res = detectCollision(cyl, sphere);
        expect(res).not.toBeNull();
        // Convention: normal from A toward B → from cyl(below) toward sphere(above) = +Y
        expect(res!.ny).toBeGreaterThan(0.9);
    });
});

describe('cylinder-plane collision', () => {
    it('detects cylinder overlapping plane', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0.2, 0, 2, 0.5);
        const plane = makePlane(world, 0);
        const res = detectCollision(cyl, plane);
        expect(res).not.toBeNull();
        // Should push cylinder up
        expect(res!.ny).toBeLessThan(-0.9);
        expect(res!.depth).toBeCloseTo(0.3, 1);
    });

    it('returns null for separated cylinder above plane', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 5, 0, 2, 0.5);
        const plane = makePlane(world, 0);
        const res = detectCollision(cyl, plane);
        expect(res).toBeNull();
    });

    it('works with plane as A (reversed order)', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0.2, 0, 2, 0.5);
        const plane = makePlane(world, 0);
        const res = detectCollision(plane, cyl);
        expect(res).not.toBeNull();
        expect(res!.ny).toBeGreaterThan(0.9);
    });
});

describe('cylinder-box collision', () => {
    it('detects cylinder overlapping box', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 1, 0.5);
        const box = makeBox(world, 1.2, 0, 0, 0.5, 0.5, 0.5);
        const res = detectCollision(cyl, box);
        expect(res).not.toBeNull();
        expect(res!.depth).toBeGreaterThan(0);
    });

    it('returns null for separated cylinder and box', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 1, 0.5);
        const box = makeBox(world, 5, 0, 0, 0.5, 0.5, 0.5);
        const res = detectCollision(cyl, box);
        expect(res).toBeNull();
    });

    it('works with box as A (reversed order)', () => {
        const world = new World();
        const cyl = makeCylinder(world, 0, 0, 0, 1, 0.5);
        const box = makeBox(world, 1.2, 0, 0, 0.5, 0.5, 0.5);
        const res = detectCollision(box, cyl);
        expect(res).not.toBeNull();
    });
});
