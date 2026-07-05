import * as THREE from 'three';
import { TRAIT_BY_ID } from '../../config/traits';
import type { UnitDef } from '../../config/types';
import type { Team } from '../../sim/types';

/**
 * Procedural construct meshes. Differentiation works on both trait axes:
 * the ROLE drives the silhouette (bulk, stance, weapon), while the
 * MANUFACTURER drives the accent color and a signature attachment
 * (tesla coil, armor slabs, sensor dish, junk pack, coolant tanks).
 */

/** Base hull colors per team — bright enough to read against the board. */
const HULL: Record<Team, number> = { player: 0xc2d8e8, enemy: 0x9a6a72 };
const HULL_DARK: Record<Team, number> = { player: 0x60788c, enemy: 0x5e3d45 };

/** Parses a CSS hex color string to a number. */
export function cssHex(color: string): number {
    return parseInt(color.replace('#', ''), 16);
}

/** Accent color for a unit (its manufacturer's trait color). */
export function accentOf(def: UnitDef): number {
    const trait = TRAIT_BY_ID.get(def.manufacturer);
    return trait ? cssHex(trait.color) : 0x38e8ff;
}

interface Kit {
    hull: THREE.MeshStandardMaterial;
    dark: THREE.MeshStandardMaterial;
    core: THREE.MeshStandardMaterial;
}

function metal(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color,
        metalness: 0.6,
        roughness: 0.42,
        emissive: color,
        emissiveIntensity: 0.06,
    });
}

function glow(color: number, intensity = 1.8): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: intensity,
        metalness: 0.2,
        roughness: 0.4,
    });
}

function box(
    kit: THREE.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), kit);
    m.position.set(x, y, z);
    return m;
}

/**
 * Builds a procedural robot mesh for a construct. Origin at ground level,
 * facing -Z.
 *
 * @param def - Unit definition (role → silhouette, manufacturer → kit).
 * @param team - Which side (drives hull tint).
 * @param star - Star level (adds bulk and glow).
 * @returns A THREE.Group roughly 1.3-1.9 units tall.
 *
 * @example
 * const mesh = buildRobot(UNIT_BY_ID.get('piton')!, 'player', 1);
 * group.add(mesh);
 */
export function buildRobot(
    def: UnitDef,
    team: Team,
    star: number,
): THREE.Group {
    const g = new THREE.Group();
    const kit: Kit = {
        hull: metal(HULL[team]),
        dark: metal(HULL_DARK[team]),
        core: glow(accentOf(def), 1.6 + star * 0.4),
    };

    switch (def.role) {
        case 'vanguard':
            buildVanguard(g, kit);
            break;
        case 'breacher':
            buildBreacher(g, kit);
            break;
        case 'gunner':
            buildGunner(g, kit);
            break;
        case 'longshot':
            buildLongshot(g, kit);
            break;
        case 'swarm':
            buildSwarm(g, kit);
            break;
        case 'catalyst':
            buildCatalyst(g, kit);
            break;
    }

    addManufacturerKit(g, def.manufacturer, kit);

    // Invisible-but-raycastable hit proxy so pointer picking is forgiving
    // (the robot bodies are thin; opacity 0 still intersects rays).
    const proxy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 1.7, 8),
        new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
        }),
    );
    proxy.position.y = 0.85;
    proxy.name = 'hit-proxy';
    g.add(proxy);

    // Cost adds presence, stars add a bit more.
    const scale = 0.95 + def.cost * 0.06 + (star - 1) * 0.13;
    g.scale.setScalar(scale);
    g.traverse((o) => {
        if (o instanceof THREE.Mesh) {
            o.castShadow = false;
            o.receiveShadow = false;
        }
    });
    return g;
}

/** Two-eye visor head. `mono` swaps in a single round optic (longshot). */
function addHead(
    g: THREE.Group,
    kit: Kit,
    y: number,
    size = 0.34,
    mono = false,
): void {
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(size, size * 0.78, size * 0.9),
        kit.hull,
    );
    head.position.y = y;
    g.add(head);
    if (mono) {
        const eye = new THREE.Mesh(
            new THREE.CylinderGeometry(size * 0.22, size * 0.22, 0.06, 10),
            kit.core,
        );
        eye.rotation.x = Math.PI / 2;
        eye.position.set(0, y, -size * 0.48);
        g.add(eye);
    } else {
        const visor = new THREE.Mesh(
            new THREE.BoxGeometry(size * 0.72, size * 0.22, 0.06),
            kit.core,
        );
        visor.position.set(0, y + 0.02, -size * 0.48);
        g.add(visor);
    }
}

function addLegs(
    g: THREE.Group,
    kit: Kit,
    width: number,
    height: number,
    thick = 0.17,
): void {
    for (const side of [-1, 1]) {
        g.add(box(kit.dark, thick, height, 0.24, side * width, height / 2, 0));
        // Foot pad.
        g.add(
            box(kit.dark, thick + 0.08, 0.08, 0.34, side * width, 0.04, -0.04),
        );
    }
}

// ── Role silhouettes ────────────────────────────────────────────────────

/** Vanguard: squat and WIDE, hiding behind a huge tower shield. */
function buildVanguard(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.3, 0.3, 0.22);
    const torso = box(kit.hull, 0.95, 0.6, 0.55, 0, 0.62, 0.05);
    g.add(torso);
    for (const side of [-1, 1]) {
        g.add(box(kit.dark, 0.26, 0.36, 0.5, side * 0.62, 0.88, 0.05));
    }
    // Tower shield: taller and wider than the body.
    const shield = box(kit.dark, 1.15, 1.05, 0.1, 0, 0.62, -0.44);
    g.add(shield);
    g.add(box(kit.core, 0.85, 0.07, 0.04, 0, 0.95, -0.5));
    g.add(box(kit.core, 0.07, 0.6, 0.04, 0, 0.55, -0.5));
    addHead(g, kit, 1.12, 0.34);
}

/** Breacher: lean, crouched forward, twin circular saw discs. */
function buildBreacher(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.2, 0.42);
    const torso = box(kit.hull, 0.5, 0.55, 0.5, 0, 0.75, -0.06);
    torso.rotation.x = -0.22;
    g.add(torso);
    // Twin saw discs, big and unmistakable.
    for (const side of [-1, 1]) {
        const arm = box(kit.dark, 0.12, 0.14, 0.5, side * 0.38, 0.72, -0.3);
        g.add(arm);
        const saw = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12),
            kit.core,
        );
        saw.rotation.z = Math.PI / 2;
        saw.position.set(side * 0.46, 0.62, -0.55);
        saw.name = 'spin-z';
        g.add(saw);
        const hub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.09, 0.09, 0.08, 8),
            kit.dark,
        );
        hub.rotation.z = Math.PI / 2;
        hub.position.copy(saw.position);
        g.add(hub);
    }
    addHead(g, kit, 1.18, 0.28);
}

/** Gunner: broad chest and an obvious tri-barrel rotary cannon. */
function buildGunner(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.24, 0.36);
    g.add(box(kit.hull, 0.68, 0.55, 0.5, 0, 0.68, 0));
    // Rotary cannon: 3 barrels around a hub.
    const gun = new THREE.Group();
    gun.position.set(0.36, 0.72, -0.3);
    gun.name = 'spin-gun';
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.75, 8),
            kit.dark,
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, -0.3);
        gun.add(barrel);
    }
    const muzzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.1, 10),
        kit.core,
    );
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.z = -0.68;
    gun.add(muzzle);
    g.add(gun);
    // Ammo backpack with belt.
    g.add(box(kit.dark, 0.46, 0.4, 0.26, -0.1, 0.78, 0.36));
    g.add(box(kit.core, 0.06, 0.3, 0.06, 0.2, 0.82, 0.32));
    addHead(g, kit, 1.12, 0.3);
}

/** Longshot: tall stilt legs and an extremely long rail rifle. */
function buildLongshot(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.2, 0.66, 0.12);
    g.add(box(kit.hull, 0.42, 0.5, 0.34, 0, 0.95, 0));
    // The rail: longer than the robot is tall.
    g.add(box(kit.dark, 0.09, 0.11, 1.7, 0.26, 1.18, -0.35));
    g.add(box(kit.core, 0.035, 0.045, 1.5, 0.26, 1.26, -0.35));
    // Muzzle brake + rear stock.
    g.add(box(kit.dark, 0.14, 0.18, 0.12, 0.26, 1.18, -1.22));
    g.add(box(kit.dark, 0.12, 0.2, 0.18, 0.26, 1.12, 0.48));
    addHead(g, kit, 1.42, 0.28, true);
}

/** Swarm: small hovering tri-rotor drone (no legs). */
function buildSwarm(g: THREE.Group, kit: Kit): void {
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), kit.hull);
    body.position.y = 0.72;
    body.rotation.y = Math.PI / 4;
    g.add(body);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), kit.core);
    eye.position.set(0, 0.72, -0.26);
    g.add(eye);
    // Three rotor pods on arms, 120° apart.
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        const px = Math.cos(a) * 0.42;
        const pz = Math.sin(a) * 0.42;
        const arm = box(kit.dark, 0.34, 0.04, 0.07, px / 2, 0.82, pz / 2);
        arm.rotation.y = -a;
        g.add(arm);
        const rotor = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.02, 0.06),
            kit.core,
        );
        rotor.position.set(px, 0.88, pz);
        rotor.name = `spin-rotor-${i}`;
        g.add(rotor);
        const pod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8),
            kit.dark,
        );
        pod.position.set(px, 0.84, pz);
        g.add(pod);
    }
}

/** Catalyst: hovering monolith — orb core, twin rings, no head or legs. */
function buildCatalyst(g: THREE.Group, kit: Kit): void {
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.46, 0.28, 6),
        kit.dark,
    );
    base.position.y = 0.14;
    g.add(base);
    const monolith = box(kit.hull, 0.3, 0.65, 0.22, 0, 0.62, 0);
    monolith.rotation.y = Math.PI / 8;
    g.add(monolith);
    const orb = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.26, 0),
        kit.core,
    );
    orb.position.y = 1.25;
    orb.name = 'catalyst-orb';
    g.add(orb);
    for (const [tilt, name] of [
        [Math.PI / 2.6, 'catalyst-ring'],
        [-Math.PI / 3.4, 'catalyst-ring-2'],
    ] as const) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.42, 0.028, 8, 36),
            kit.hull,
        );
        ring.position.y = 1.25;
        ring.rotation.x = tilt;
        ring.name = name;
        g.add(ring);
    }
}

// ── Manufacturer signature attachments ──────────────────────────────────

function addManufacturerKit(
    g: THREE.Group,
    manufacturer: UnitDef['manufacturer'],
    kit: Kit,
): void {
    switch (manufacturer) {
        case 'hexawatt': {
            // Tesla coil on the back.
            const rod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.05, 0.5, 6),
                kit.dark,
            );
            rod.position.set(-0.22, 1.15, 0.26);
            g.add(rod);
            const tip = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 8, 8),
                kit.core,
            );
            tip.position.set(-0.22, 1.44, 0.26);
            g.add(tip);
            break;
        }
        case 'ferrocrete': {
            // Angled armor slabs over the shoulders.
            for (const side of [-1, 1]) {
                const slab = box(
                    kit.dark,
                    0.1,
                    0.44,
                    0.6,
                    side * 0.5,
                    1.1,
                    0.08,
                );
                slab.rotation.z = side * 0.35;
                g.add(slab);
                g.add(box(kit.core, 0.02, 0.3, 0.05, side * 0.55, 1.12, -0.16));
            }
            break;
        }
        case 'whisperline': {
            // Sensor dish + whisker antennas.
            const dish = new THREE.Mesh(
                new THREE.ConeGeometry(0.16, 0.1, 12, 1, true),
                kit.core,
            );
            dish.rotation.x = -Math.PI / 2.4;
            dish.position.set(0.3, 1.4, 0.12);
            g.add(dish);
            for (const side of [-1, 1]) {
                const whisker = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4),
                    kit.dark,
                );
                whisker.rotation.z = side * 0.5;
                whisker.position.set(side * 0.18, 1.5, 0.06);
                g.add(whisker);
            }
            break;
        }
        case 'scrapline': {
            // Junk backpack: a jumble of salvage boxes.
            const junk: Array<[number, number, number, number, number]> = [
                [0.22, 0.16, 0.14, -0.14, 0.92],
                [0.16, 0.22, 0.12, 0.12, 0.86],
                [0.14, 0.12, 0.16, 0.02, 1.08],
            ];
            for (const [w, h, d, x, y] of junk) {
                const piece = box(kit.dark, w, h, d, x, y, 0.34);
                piece.rotation.set(x, y, x * y);
                g.add(piece);
            }
            const light = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 6, 6),
                kit.core,
            );
            light.position.set(0.05, 1.14, 0.36);
            g.add(light);
            break;
        }
        case 'cryostat': {
            // Twin coolant tanks with glowing caps.
            for (const side of [-1, 1]) {
                const tank = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.09, 0.09, 0.42, 10),
                    kit.hull,
                );
                tank.position.set(side * 0.18, 0.92, 0.32);
                g.add(tank);
                const cap = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.09, 0.08, 10),
                    kit.core,
                );
                cap.position.set(side * 0.18, 1.17, 0.32);
                g.add(cap);
            }
            break;
        }
    }
}
