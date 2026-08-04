import * as THREE from 'three';
import { CUSTOM_MODELS } from '../../config/models';
import { TRAIT_BY_ID } from '../../config/traits';
import type { UnitDef } from '../../config/types';
import type { Team } from '../../sim/types';
import { customModelInstance, loadCustomModel } from './customModel';

/**
 * Procedural construct meshes. Differentiation works on both trait axes:
 * the ROLE drives the silhouette (bulk, stance, weapon), while the
 * MANUFACTURER drives the accent color and a signature attachment
 * (armor slabs, thrusters, sensor dish, shell rack, light panels).
 * Primes have neither axis and get their own imposing silhouette; trait-less
 * scrap fodder gets a hunched junk-walker look instead.
 */

/** Base hull colors per team — bright enough to read against the board. */
const HULL: Record<Team, number> = { player: 0xd4e6f2, enemy: 0xc98a94 };
const HULL_DARK: Record<Team, number> = { player: 0x6e8aa0, enemy: 0x7a4e58 };

/** Parses a CSS hex color string to a number. */
export function cssHex(color: string): number {
    return parseInt(color.replace('#', ''), 16);
}

/** Accent color for a unit (manufacturer color, prime gold, scrap rust). */
export function accentOf(def: UnitDef): number {
    const id = def.manufacturer ?? def.prime ?? def.role;
    const trait = id ? TRAIT_BY_ID.get(id) : undefined;
    return trait ? cssHex(trait.color) : 0xc97b3d;
}

interface Kit {
    hull: THREE.MeshStandardMaterial;
    dark: THREE.MeshStandardMaterial;
    core: THREE.MeshStandardMaterial;
}

function metal(color: number): THREE.MeshStandardMaterial {
    // Low metalness on purpose: there is no environment map, so high
    // metalness renders near-black and units vanish into the board.
    return new THREE.MeshStandardMaterial({
        color,
        metalness: 0.25,
        roughness: 0.55,
        emissive: color,
        emissiveIntensity: 0.16,
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
 * Builds the mesh for a construct. Origin at ground level, facing -Z.
 * Units registered in `config/models.ts` use their custom model (swapped
 * in asynchronously on first load); everything else gets a procedural
 * robot whose ROLE drives the silhouette and MANUFACTURER the attachments.
 *
 * @param def - Unit definition (role → silhouette, manufacturer → kit).
 * @param team - Which side (drives hull tint).
 * @param star - Star level (adds bulk and glow).
 * @returns A THREE.Group roughly 1.3-1.9 units tall.
 *
 * @example
 * const mesh = buildRobot(UNIT_BY_ID.get('tripod')!, 'player', 1);
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

    // All visible body parts live in one sub-group so a custom model can
    // replace them wholesale while the hit proxy / scaling stay intact.
    const body = new THREE.Group();
    body.name = 'construct-body';
    g.add(body);

    if (def.prime) {
        buildPrime(body, kit);
    } else {
        switch (def.role) {
            case 'bulwark':
                buildBulwark(body, kit);
                break;
            case 'flanker':
                buildFlanker(body, kit);
                break;
            case 'turret':
                buildTurret(body, kit);
                break;
            case 'bombardier':
                buildBombardier(body, kit);
                break;
            case 'medic':
                buildMedic(body, kit);
                break;
            case 'amplifier':
                buildAmplifier(body, kit);
                break;
            case 'juggernaut':
                buildJuggernaut(body, kit);
                break;
            case 'breaker':
                buildBreaker(body, kit);
                break;
            case 'reaper':
                buildReaper(body, kit);
                break;
            default:
                // No role and no prime: trait-less scrap fodder.
                buildScrap(body, kit);
                break;
        }
    }

    addManufacturerKit(body, def.manufacturer, kit);

    if (CUSTOM_MODELS[def.id]) {
        // The animator rides on userData so UnitsNode can drive clips
        // even though the swap may land after this group is returned.
        const swapIn = (custom: {
            root: THREE.Group;
            animator: unknown;
        }): void => {
            body.clear();
            body.add(custom.root);
            g.userData.animator = custom.animator;
        };
        const custom = customModelInstance(def.id, team);
        if (custom) {
            swapIn(custom);
        } else {
            // Not loaded yet: keep the procedural robot as a placeholder
            // and swap when the model arrives.
            void loadCustomModel(def.id).then(() => {
                const late = customModelInstance(def.id, team);
                if (late) swapIn(late);
            });
        }
    }

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

/** Two-eye visor head. `mono` swaps in a single round optic. */
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

/** Bulwark: squat and WIDE, hiding behind a huge tower shield. */
function buildBulwark(g: THREE.Group, kit: Kit): void {
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

/** Flanker: lean, crouched forward, twin circular blade discs. */
function buildFlanker(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.2, 0.42);
    const torso = box(kit.hull, 0.5, 0.55, 0.5, 0, 0.75, -0.06);
    torso.rotation.x = -0.22;
    g.add(torso);
    // Twin blade discs, big and unmistakable.
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

/** Turret: broad chest and an obvious tri-barrel rotary cannon. */
function buildTurret(g: THREE.Group, kit: Kit): void {
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

/** Bombardier: squat carriage with a fat mortar tube angled skyward. */
function buildBombardier(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.28, 0.3, 0.2);
    g.add(box(kit.hull, 0.8, 0.5, 0.6, 0, 0.58, 0.04));
    // Mortar tube over the right shoulder, angled up and forward.
    const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 0.95, 10),
        kit.dark,
    );
    tube.rotation.x = -Math.PI / 3.2;
    tube.position.set(0.3, 1.05, -0.05);
    g.add(tube);
    const mouth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.16, 0.12, 10),
        kit.core,
    );
    mouth.rotation.x = -Math.PI / 3.2;
    mouth.position.set(0.3, 1.46, -0.29);
    g.add(mouth);
    // Recoil brace down to the carriage.
    g.add(box(kit.dark, 0.1, 0.4, 0.1, 0.3, 0.75, 0.22));
    addHead(g, kit, 1.02, 0.3);
}

/** Medic: small hovering tri-rotor drone (no legs). */
function buildMedic(g: THREE.Group, kit: Kit): void {
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), kit.hull);
    body.position.y = 0.72;
    body.rotation.y = Math.PI / 4;
    g.add(body);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), kit.core);
    eye.position.set(0, 0.72, -0.26);
    g.add(eye);
    // Glowing cross on the belly.
    g.add(box(kit.core, 0.26, 0.06, 0.05, 0, 0.5, -0.05));
    g.add(box(kit.core, 0.06, 0.26, 0.05, 0, 0.5, -0.05));
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

/** Amplifier: hovering monolith — orb core, twin rings, no head or legs. */
function buildAmplifier(g: THREE.Group, kit: Kit): void {
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

/** Juggernaut: hulking barrel torso, hanging fists, exposed glowing core. */
function buildJuggernaut(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.32, 0.32, 0.24);
    // Massive rounded torso leaning forward.
    const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.5, 0.7, 10),
        kit.hull,
    );
    torso.position.set(0, 0.78, 0.02);
    torso.rotation.x = 0.12;
    g.add(torso);
    // Exposed reactor heart on the chest.
    const heart = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 10),
        kit.core,
    );
    heart.position.set(0, 0.88, -0.42);
    heart.name = 'catalyst-orb';
    g.add(heart);
    // Huge shoulder balls and hanging fists.
    for (const side of [-1, 1]) {
        const shoulder = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 10, 10),
            kit.dark,
        );
        shoulder.position.set(side * 0.56, 1.06, 0.02);
        g.add(shoulder);
        g.add(box(kit.dark, 0.18, 0.5, 0.2, side * 0.62, 0.66, 0));
        g.add(box(kit.hull, 0.24, 0.24, 0.26, side * 0.62, 0.36, -0.04));
    }
    // Welded repair plates.
    g.add(box(kit.dark, 0.34, 0.2, 0.06, -0.14, 1.0, -0.36));
    addHead(g, kit, 1.3, 0.3);
}

/** Breaker: industrial wrecker with one oversized piston hammer arm. */
function buildBreaker(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.26, 0.36, 0.2);
    g.add(box(kit.hull, 0.7, 0.55, 0.5, 0, 0.68, 0.02));
    // Counterweight pack on the left.
    g.add(box(kit.dark, 0.26, 0.34, 0.34, -0.42, 0.86, 0.14));
    // The hammer arm: piston housing, ram and a glowing crusher head.
    const housing = box(kit.dark, 0.3, 0.3, 0.55, 0.5, 0.82, -0.16);
    g.add(housing);
    const ram = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.4, 8),
        kit.hull,
    );
    ram.rotation.x = Math.PI / 2;
    ram.position.set(0.5, 0.82, -0.55);
    g.add(ram);
    const head = box(kit.core, 0.34, 0.34, 0.18, 0.5, 0.82, -0.82);
    g.add(head);
    // Warning chevrons on the housing.
    g.add(box(kit.core, 0.04, 0.2, 0.04, 0.38, 0.9, -0.4));
    addHead(g, kit, 1.14, 0.3, true);
}

/** Reaper: gaunt hooded frame with a single crescent scythe blade. */
function buildReaper(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.18, 0.44, 0.12);
    // Narrow hunched torso.
    const torso = box(kit.hull, 0.4, 0.6, 0.34, 0, 0.78, -0.02);
    torso.rotation.x = -0.16;
    g.add(torso);
    // Tattered hood: cone over a mono eye.
    const hood = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.42, 8),
        kit.dark,
    );
    hood.position.set(0, 1.32, 0.02);
    g.add(hood);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), kit.core);
    eye.position.set(0, 1.22, -0.18);
    g.add(eye);
    // Scythe: haft across the body, crescent blade out the right side.
    const haft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 1.15, 6),
        kit.dark,
    );
    haft.rotation.z = 0.5;
    haft.position.set(0.3, 0.9, -0.18);
    g.add(haft);
    const blade = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.045, 6, 20, Math.PI * 0.9),
        kit.core,
    );
    blade.position.set(0.72, 1.28, -0.18);
    blade.rotation.z = -1.9;
    blade.name = 'spin-z';
    g.add(blade);
    // Vertebrae studs down the back.
    for (let i = 0; i < 3; i++) {
        g.add(box(kit.dark, 0.1, 0.08, 0.08, 0, 0.62 + i * 0.22, 0.18));
    }
}

/** Scrap fodder: hunched junk walker with mismatched patch plates. */
function buildScrap(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.22, 0.28, 0.14);
    const torso = box(kit.hull, 0.55, 0.45, 0.45, 0, 0.52, 0);
    torso.rotation.x = 0.18;
    g.add(torso);
    // Mismatched salvage plates riveted on wherever they fit.
    g.add(box(kit.dark, 0.3, 0.2, 0.06, 0.16, 0.6, -0.24));
    g.add(box(kit.dark, 0.2, 0.28, 0.06, -0.2, 0.48, -0.23));
    // One loose cable arm.
    g.add(box(kit.dark, 0.08, 0.4, 0.08, 0.34, 0.4, -0.06));
    addHead(g, kit, 0.9, 0.26, true);
}

/** Prime: tall regal frame with a floating halo and crown spires. */
function buildPrime(g: THREE.Group, kit: Kit): void {
    addLegs(g, kit, 0.24, 0.5, 0.14);
    // Tapered tall torso.
    const torso = box(kit.hull, 0.6, 0.85, 0.42, 0, 1.02, 0);
    g.add(torso);
    g.add(box(kit.dark, 0.72, 0.16, 0.5, 0, 1.42, 0));
    // Chest core.
    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.15, 0),
        kit.core,
    );
    core.position.set(0, 1.12, -0.24);
    core.name = 'catalyst-orb';
    g.add(core);
    addHead(g, kit, 1.72, 0.3, true);
    // Floating halo behind the head.
    const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.03, 8, 32),
        kit.core,
    );
    halo.position.set(0, 1.82, 0.18);
    halo.rotation.x = Math.PI / 12;
    halo.name = 'catalyst-ring';
    g.add(halo);
    // Crown spires on the shoulder plate.
    for (const side of [-1, 1]) {
        const spire = new THREE.Mesh(
            new THREE.ConeGeometry(0.06, 0.34, 6),
            kit.dark,
        );
        spire.position.set(side * 0.32, 1.66, 0);
        g.add(spire);
    }
}

// ── Manufacturer signature attachments ──────────────────────────────────

function addManufacturerKit(
    g: THREE.Group,
    manufacturer: UnitDef['manufacturer'],
    kit: Kit,
): void {
    switch (manufacturer) {
        case 'aegisline': {
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
        case 'redline': {
            // Twin booster thrusters raked back off the shoulders.
            for (const side of [-1, 1]) {
                const thruster = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.08, 0.11, 0.4, 10),
                    kit.hull,
                );
                thruster.rotation.x = Math.PI / 3;
                thruster.position.set(side * 0.24, 1.0, 0.34);
                g.add(thruster);
                const flame = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.1, 0.05, 0.12, 10),
                    kit.core,
                );
                flame.rotation.x = Math.PI / 3;
                flame.position.set(side * 0.24, 0.87, 0.56);
                g.add(flame);
            }
            break;
        }
        case 'blacksite': {
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
        case 'blastworks': {
            // Shell rack: a row of ready rounds across the back.
            for (let i = 0; i < 3; i++) {
                const shell = new THREE.Mesh(
                    new THREE.CapsuleGeometry(0.06, 0.16, 3, 8),
                    i === 1 ? kit.core : kit.dark,
                );
                shell.position.set((i - 1) * 0.17, 0.95, 0.36);
                g.add(shell);
            }
            const rack = box(kit.dark, 0.56, 0.08, 0.14, 0, 0.82, 0.36);
            g.add(rack);
            break;
        }
        case 'hardlight': {
            // Floating light panels beside the shoulders.
            for (const side of [-1, 1]) {
                const panel = new THREE.Mesh(
                    new THREE.BoxGeometry(0.05, 0.3, 0.22),
                    kit.core,
                );
                panel.position.set(side * 0.55, 1.15, 0.1);
                panel.rotation.y = side * 0.3;
                g.add(panel);
            }
            break;
        }
        case 'vulture': {
            // Scavenger hook craned over the shoulder + trophy spikes.
            const boom = box(kit.dark, 0.07, 0.5, 0.07, -0.3, 1.3, 0.2);
            boom.rotation.x = 0.5;
            g.add(boom);
            const hook = new THREE.Mesh(
                new THREE.TorusGeometry(0.11, 0.03, 6, 12, Math.PI * 1.3),
                kit.core,
            );
            hook.position.set(-0.3, 1.52, -0.02);
            hook.rotation.y = Math.PI / 2;
            g.add(hook);
            for (let i = 0; i < 3; i++) {
                const spike = new THREE.Mesh(
                    new THREE.ConeGeometry(0.045, 0.2, 5),
                    i === 1 ? kit.core : kit.dark,
                );
                spike.position.set(0.1 + i * 0.14, 1.02, 0.3);
                spike.rotation.x = 0.7;
                g.add(spike);
            }
            break;
        }
        case 'surgecore': {
            // Reactor capacitor stack arcing off the back.
            for (let i = 0; i < 3; i++) {
                const coil = new THREE.Mesh(
                    new THREE.TorusGeometry(0.12 - i * 0.025, 0.025, 6, 14),
                    i === 1 ? kit.dark : kit.core,
                );
                coil.position.set(0, 0.92 + i * 0.16, 0.34);
                coil.rotation.x = Math.PI / 2;
                g.add(coil);
            }
            const rod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6),
                kit.dark,
            );
            rod.position.set(0, 1.05, 0.34);
            g.add(rod);
            const tip = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 8, 8),
                kit.core,
            );
            tip.position.set(0, 1.36, 0.34);
            g.add(tip);
            break;
        }
    }
}
