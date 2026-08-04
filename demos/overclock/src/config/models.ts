/**
 * Custom 3D model registry — swap any unit's procedural robot for your own
 * mesh in two steps:
 *
 * 1. Drop a `.glb` / `.gltf` file into `demos/overclock/public/models/`.
 * 2. Add an entry below keyed by the unit id (see `config/units.ts`).
 *
 * Models are auto-fitted on load: scaled to a standard construct height,
 * centered on x/z, and grounded at y=0, so downloads of any size work
 * without manual tuning. Use the optional fields for fine adjustments.
 * Units without an entry keep their procedural robot.
 */

/**
 * Animation slots the game drives. Clips are matched to slots by name
 * (case-insensitive synonyms: idle/breath/stand, walk/run/move,
 * attack/punch/slash/shoot/swing/fire/hit, cast/spell/skill/ability,
 * death/die/dead) — use the `clips` field only to override that mapping.
 */
export type ClipSlot = 'idle' | 'move' | 'attack' | 'cast' | 'death';

/** Registration for one unit's replacement mesh. */
export interface CustomModelDef {
    /**
     * Model URL, relative to the demo's public root (e.g.
     * `'models/kensei.glb'`). Absolute URLs also work.
     */
    url: string;
    /** Extra uniform scale applied after auto-fit. Default 1. */
    scale?: number;
    /** Vertical offset in world units after grounding. Default 0. */
    yOffset?: number;
    /**
     * Yaw correction in radians. Units must face -Z; use this when the
     * model was authored facing another direction (e.g. `Math.PI` for +Z).
     */
    rotationY?: number;
    /**
     * Tint enemy copies toward the enemy hull color so both teams stay
     * readable when they field the same model. Default true.
     */
    teamTint?: boolean;
    /**
     * Explicit clip-name overrides per animation slot, for models whose
     * clip names don't match the auto-detected synonyms.
     *
     * @example
     * clips: { attack: 'Punch_Left', move: 'Hover' }
     */
    clips?: Partial<Record<ClipSlot, string>>;
}

/**
 * Unit id → custom model. Empty by default; every unit falls back to its
 * procedural robot.
 *
 * @example
 * export const CUSTOM_MODELS: Record<string, CustomModelDef> = {
 *     kensei: { url: 'models/kensei.glb', rotationY: Math.PI },
 *     pellet: { url: 'models/scrapbot.glb', scale: 0.9 },
 * };
 */
export const CUSTOM_MODELS: Record<string, CustomModelDef> = {
    scrap: { url: 'models/scrap.glb', rotationY: Math.PI },
    stinger: { url: 'models/stinger.glb', rotationY: Math.PI },
    fuze: { url: 'models/fuze.glb', rotationY: Math.PI },
    sentry: { url: 'models/sentry.glb', rotationY: -Math.PI / 2, scale: 0.5 },
    picket: { url: 'models/picket.glb', rotationY: Math.PI },
    chock: { url: 'models/chock.glb', rotationY: Math.PI },
    mortar: { url: 'models/mortar.glb', rotationY: Math.PI, scale: 0.5 },
    gauze: { url: 'models/gauze.glb', rotationY: Math.PI, scale: 0.5 },
    pellet: { url: 'models/pellet.glb', rotationY: Math.PI, scale: 0.8 },
    tripod: { url: 'models/trestle.glb', rotationY: Math.PI, scale: 0.65 },
    lug: { url: 'models/lug.glb', rotationY: Math.PI, scale: 0.65 },
    relay: { url: 'models/relay.glb', rotationY: -Math.PI / 2, scale: 0.65 },
    wake: { url: 'models/wake.glb', rotationY: Math.PI, scale: 0.65 },
    jolt: { url: 'models/jolt.glb', rotationY: Math.PI, scale: 0.65 },
    ramrod: { url: 'models/ramrod.glb', rotationY: -Math.PI / 2, scale: 0.5 },
    wisp: { url: 'models/wisp.glb', rotationY: Math.PI, scale: 0.65 },
    bulkhead: { url: 'models/bulkhead.glb', rotationY: Math.PI, scale: 0.85 },
    static: { url: 'models/static.glb', rotationY: Math.PI, scale: 0.85 },
    sawbones: { url: 'models/sawbones.glb', rotationY: Math.PI, scale: 0.85 },
    gutter: { url: 'models/gutter.glb', rotationY: Math.PI, scale: 0.85 },
    brownout: { url: 'models/brownout.glb', rotationY: Math.PI, scale: 0.85 },
    bastille: { url: 'models/bastille.glb', rotationY: Math.PI, scale: 0.85 },
    cinder: { url: 'models/cinder.glb', rotationY: Math.PI, scale: 0.85 },
    carrion: { url: 'models/carrion.glb', rotationY: Math.PI, scale: 0.85 },
    dynamo: { url: 'models/dynamo.glb', rotationY: Math.PI, scale: 0.85 },
    gaffhook: { url: 'models/gaffhook.glb', rotationY: Math.PI, scale: 0.85 },
    lantern: { url: 'models/lantern.glb', rotationY: Math.PI, scale: 0.85 },
    loom: { url: 'models/loom.glb', rotationY: Math.PI, scale: 0.85 },
    pulsar: { url: 'models/pulsar.glb', rotationY: Math.PI, scale: 0.85 },
    roost: { url: 'models/roost.glb', rotationY: Math.PI, scale: 0.85 },
    arclight: { url: 'models/arclight.glb', rotationY: Math.PI, scale: 0.85 },
    vantage: { url: 'models/vantage.glb', rotationY: Math.PI, scale: 0.85 },
    gorge: { url: 'models/gorge.glb', rotationY: Math.PI, scale: 0.85 },
    lifeline: { url: 'models/lifeline.glb', rotationY: Math.PI, scale: 0.85 },
    kilovolt: { url: 'models/kilovolt.glb', rotationY: Math.PI, scale: 0.85 },
    nocturne: { url: 'models/nocturne.glb', rotationY: Math.PI, scale: 0.85 },
    gravitas: { url: 'models/gravitas.glb', rotationY: Math.PI, scale: 0.85 },
    sledge: { url: 'models/sledge.glb', rotationY: Math.PI, scale: 0.85 },
    warhead: { url: 'models/warhead.glb', rotationY: Math.PI, scale: 0.85 },
    blackout: { url: 'models/blackout.glb', rotationY: Math.PI, scale: 0.85 },
    citadel: { url: 'models/citadel.glb', rotationY: Math.PI, scale: 0.85 },
    kensei: { url: 'models/kensei.glb', rotationY: Math.PI, scale: 0.85 },
    meridian: { url: 'models/meridian.glb', rotationY: Math.PI, scale: 0.85 },
    facsimile: { url: 'models/facsimile.glb', rotationY: Math.PI, scale: 0.85 },
    valkyr: { url: 'models/valkyr.glb', rotationY: Math.PI, scale: 0.85 },
};
