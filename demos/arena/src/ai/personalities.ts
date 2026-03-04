/**
 * Tunable parameter set that defines an AI opponent's playstyle.
 * Adding a new personality is just creating a new object that satisfies
 * this interface — no subclassing or branching required.
 *
 * All fields beyond the original six are optional and default to neutral
 * values that preserve the original three-influence blending behavior.
 */
export interface AiPersonality {
    /** Display name for the personality. */
    name: string;

    /** Accent color for the personality (hex, e.g. `0xe74c3c`). */
    color: number;

    /** Short tagline describing the personality's playstyle. */
    tagline: string;

    // ----- Core (original six) -----

    /** How close (world units) the AI tries to get before attacking. */
    approachDistance: number;

    /** 0–1 how aggressively the AI pursues the opponent vs. wandering. */
    aggression: number;

    /** 0–1 how strongly the AI avoids arena edges (pulled toward center). */
    edgeCaution: number;

    /** Average dashes per second when within approach distance. */
    dashRate: number;

    /** 0–1 randomness added to movement direction each decision tick. */
    erraticism: number;

    /** 0–1 movement input magnitude (1 = full speed). */
    moveSpeed: number;

    // ----- Movement strategy -----

    /**
     * Distance (world units) the AI tries to maintain from the opponent.
     * When closer than this, the AI backs off; when further, it chases.
     * 0 = disabled (uses pure chase behavior).
     */
    preferredDistance?: number;

    /**
     * 0–1 how much the AI moves laterally (perpendicular to the chase axis)
     * rather than directly toward/away from the opponent.
     * 0 = beeline, 1 = pure orbiting.
     */
    strafeStrength?: number;

    /**
     * 0–1 preferred attack angle offset.
     * 0 = head-on charges, 0.5 = 45° flanking, 1 = pure sideswipes.
     */
    anglePref?: number;

    /**
     * 0–1 how much the AI spirals/corkscrews its approach path.
     * Creates hawk-like circling patterns.
     */
    spinRate?: number;

    /**
     * 0–1 rapid micro-oscillations in movement direction.
     * Creates nervous, twitchy, hummingbird-like energy.
     */
    jitterAmplitude?: number;

    /**
     * 0–1 how hard the AI commits to its current direction before turning.
     * 0 = instant snappy turns, 1 = slow sweeping arcs (heavyweight feel).
     */
    momentumCommitment?: number;

    // ----- Spatial tactics -----

    /**
     * 0–1 how much the AI values holding the arena center, independent
     * of edge avoidance. Always pulls toward center.
     */
    centerControl?: number;

    /**
     * 0–1 tendency to position between the opponent and the nearest edge,
     * trying to push them off.
     */
    edgeAggression?: number;

    /**
     * 0–1 tendency to intentionally stay near the edge to bait the opponent
     * into overcommitting near the boundary.
     */
    edgeRiding?: number;

    /**
     * 0–1 how much the AI uses gradual positional pressure to shepherd
     * the opponent toward the edge rather than direct hits.
     */
    herding?: number;

    /**
     * 0–1 how much the AI defends a "home zone" (its spawn position) and
     * becomes more aggressive when the opponent enters it.
     */
    territoriality?: number;

    // ----- Opponent tracking -----

    /**
     * 0–1 how much the AI shadows/mirrors the opponent's lateral movement.
     * High values create an eerie shadowing behavior.
     */
    mirrorTendency?: number;

    /**
     * 0–1 tendency to mirror the opponent's recent movement direction.
     * Creates an eerie shadow-match feel.
     */
    copycat?: number;

    /**
     * 0–1 how much the AI leads the target, aiming where the opponent
     * will be rather than where they are.
     */
    predictionStrength?: number;

    // ----- Dash behavior -----

    /**
     * -1 to 1 bias for dash direction.
     * 1 = toward opponent, 0 = perpendicular (dodge), -1 = away (escape).
     */
    dashDirection?: number;

    /**
     * 0–1 probability of executing a perpendicular evasion dash when
     * the opponent is closing fast.
     */
    dodgeReflex?: number;

    /**
     * 0–1 probability of dashing when the opponent dashes toward the AI.
     * Reactive head-on counter style.
     */
    counterDashRate?: number;

    /**
     * 0–1 willingness to dash even when near the arena edge if the
     * opponent is also in danger. Kamikaze/mutual destruction.
     */
    sacrificialDash?: number;

    /**
     * 0–1 how quickly the AI capitalizes when the opponent whiffs a dash.
     * High = instantly punishes mistakes.
     */
    respectMomentum?: number;

    // ----- Engagement rhythm -----

    /**
     * 0–1 how much the AI reduces speed when at preferred distance,
     * creating circling/waiting behavior before committing.
     */
    patience?: number;

    /**
     * 0–1 how much the AI alternates between stillness and explosive bursts.
     * 0 = smooth consistent speed, 1 = extreme stop-and-go.
     */
    burstiness?: number;

    /**
     * 0–1 how often the AI fakes an approach then pulls back.
     * Creates mind-game baiting behavior.
     */
    feintRate?: number;

    /**
     * 0–1 probability of going deliberately still, then exploding into
     * action when the opponent gets close. Trap-setting behavior.
     */
    ambushTendency?: number;

    /**
     * Seconds of sustained pressure before the AI pulls back.
     * 0 = disabled (no commit/retreat cycles).
     */
    commitWindow?: number;

    /**
     * Seconds the AI oscillates between aggressive and passive phases.
     * 0 = disabled (constant aggression).
     */
    rhythmPeriod?: number;

    // ----- Post-collision behavior -----

    /**
     * 0–1 tendency to back off after a collision before re-engaging.
     * 0 = immediately re-engages, 1 = fully retreats.
     */
    retreatAfterHit?: number;

    /**
     * 0–1 how much the AI escalates aggression after being hit.
     * High = gets "angry" and charges harder for a few seconds.
     */
    grudgeIntensity?: number;

    /**
     * 0–1 how aggressively the AI chases the opponent's knockback
     * trajectory after landing a hit. The combo-seeker.
     */
    bounceChasing?: number;

    /**
     * Seconds of deliberate stillness after a collision.
     * Creates dramatic pauses. 0 = no pause.
     */
    postHitPause?: number;

    // ----- Score-based adaptation -----

    /**
     * 0–1 how much the AI boosts aggression when behind on score.
     * Higher = bigger aggression spike when losing.
     */
    desperationThreshold?: number;

    /**
     * 0–1 how much the AI relaxes when ahead on score.
     * Reduces aggression and increases erraticism.
     */
    overconfidence?: number;

    /**
     * 0–1 tendency to do flashy loops near the edge when ahead.
     * Makes the AI feel cocky and creates exploitable openings.
     */
    showboating?: number;

    /**
     * 0–1 how much behavior degrades under pressure (near edge + losing).
     * High = makes desperate mistakes, low = ice cold.
     */
    panicFactor?: number;

    // ----- Meta-behavior -----

    /**
     * 0–1 how much the AI periodically switches between aggressive and
     * defensive behavior on a timer. Feels like multiple opponents.
     */
    phaseShift?: number;

    /**
     * 0–1 smoothing applied to the perceived opponent position.
     * 0 = instant reactions (robotic), 1 = very sluggish (humanlike).
     */
    reactionDelay?: number;
}

// ---------------------------------------------------------------------------
// Built-in personalities
// ---------------------------------------------------------------------------

/**
 * Brawler — charges head-on, dashes frequently, reckless near edges.
 *
 * @example
 * ```ts
 * useChild(AiPlayerNode, { personality: BRAWLER, ... });
 * ```
 */
export const BRAWLER: AiPersonality = {
    name: 'Brawler',
    color: 0xe74c3c,
    tagline: 'Aggressive charger — dashes often, reckless near edges',
    approachDistance: 3,
    aggression: 0.9,
    edgeCaution: 0.35,
    dashRate: 1.4,
    erraticism: 0.1,
    moveSpeed: 1.0,
    bounceChasing: 0.7,
    respectMomentum: 0.6,
};

/**
 * Sentinel — holds center stage, high edge caution, only engages when
 * the opponent comes close.
 *
 * @example
 * ```ts
 * useChild(AiPlayerNode, { personality: SENTINEL, ... });
 * ```
 */
export const SENTINEL: AiPersonality = {
    name: 'Sentinel',
    color: 0x48c9b0,
    tagline: 'Defensive anchor — holds center, waits for you to slip',
    approachDistance: 6,
    aggression: 0.3,
    edgeCaution: 0.85,
    dashRate: 0.4,
    erraticism: 0.05,
    moveSpeed: 0.65,
    centerControl: 0.7,
    patience: 0.7,
    counterDashRate: 0.6,
    retreatAfterHit: 0.5,
};

/**
 * Gremlin — chaotic movement bursts, unpredictable dash timing,
 * erratic pathing.
 *
 * @example
 * ```ts
 * useChild(AiPlayerNode, { personality: GREMLIN, ... });
 * ```
 */
export const GREMLIN: AiPersonality = {
    name: 'Gremlin',
    color: 0x9b59b6,
    tagline: 'Chaotic wildcard — unpredictable movement, erratic dashes',
    approachDistance: 5,
    aggression: 0.6,
    edgeCaution: 0.5,
    dashRate: 0.9,
    erraticism: 0.65,
    moveSpeed: 0.95,
    jitterAmplitude: 0.6,
    burstiness: 0.7,
    feintRate: 0.4,
};

/**
 * Matador — circles at range, sidesteps charges, strikes from the flank.
 * High dodge reflex and strafing make it hard to hit head-on.
 */
export const MATADOR: AiPersonality = {
    name: 'Matador',
    color: 0xe67e22,
    tagline: 'Graceful sidestepper — dodges charges, strikes from the flank',
    approachDistance: 5,
    aggression: 0.4,
    edgeCaution: 0.85,
    dashRate: 0.5,
    erraticism: 0.1,
    moveSpeed: 0.85,
    preferredDistance: 6,
    strafeStrength: 0.75,
    dodgeReflex: 0.95,
    patience: 0.7,
    anglePref: 0.7,
    centerControl: 0.6,
    respectMomentum: 0.8,
};

/**
 * Juggernaut — slow to turn but once committed, relentlessly pursues.
 * Wide sweeping arcs and sustained pressure make it feel unstoppable.
 */
export const JUGGERNAUT: AiPersonality = {
    name: 'Juggernaut',
    color: 0x7f8c8d,
    tagline: 'Unstoppable force — slow to turn, relentless once committed',
    approachDistance: 3,
    aggression: 0.85,
    edgeCaution: 0.7,
    dashRate: 0.8,
    erraticism: 0.05,
    moveSpeed: 0.7,
    momentumCommitment: 0.7,
    bounceChasing: 0.9,
    commitWindow: 3.5,
    centerControl: 0.5,
    reactionDelay: 0.3,
};

/**
 * Phantom — goes still, then strikes like lightning. Seems to
 * predict your movement with eerie precision.
 */
export const PHANTOM: AiPersonality = {
    name: 'Phantom',
    color: 0x2c3e50,
    tagline: 'Patient predator — goes still, then strikes like lightning',
    approachDistance: 4,
    aggression: 0.75,
    edgeCaution: 0.75,
    dashRate: 0.7,
    erraticism: 0.05,
    moveSpeed: 0.8,
    ambushTendency: 0.9,
    predictionStrength: 0.8,
    postHitPause: 0.6,
    patience: 0.8,
    centerControl: 0.6,
    retreatAfterHit: 0.3,
};

/**
 * Puppeteer — slowly pushes you toward the edge through careful
 * positioning. Rarely dashes, preferring strategic pressure.
 */
export const PUPPETEER: AiPersonality = {
    name: 'Puppeteer',
    color: 0x27ae60,
    tagline: 'Strategic mastermind — herds you toward the edge',
    approachDistance: 6,
    aggression: 0.4,
    edgeCaution: 0.75,
    dashRate: 0.25,
    erraticism: 0.05,
    moveSpeed: 0.75,
    herding: 0.9,
    edgeAggression: 0.8,
    patience: 0.8,
    centerControl: 0.6,
    predictionStrength: 0.4,
    preferredDistance: 5,
};

/**
 * Mimic — eerily mirrors your movement and counters your dashes.
 * Feels like fighting your own shadow.
 */
export const MIMIC: AiPersonality = {
    name: 'Mimic',
    color: 0x2980b9,
    tagline: 'Your shadow — mirrors your moves, counters your dashes',
    approachDistance: 5,
    aggression: 0.55,
    edgeCaution: 0.7,
    dashRate: 0.6,
    erraticism: 0.1,
    moveSpeed: 0.9,
    copycat: 0.9,
    mirrorTendency: 0.9,
    counterDashRate: 0.8,
    centerControl: 0.4,
};

/**
 * Berserker — gets more dangerous when losing. Willing to kamikaze
 * if it means taking you down too.
 */
export const BERSERKER: AiPersonality = {
    name: 'Berserker',
    color: 0xc0392b,
    tagline: 'Reckless fury — gets more dangerous when losing',
    approachDistance: 2,
    aggression: 0.85,
    edgeCaution: 0.35,
    dashRate: 1.3,
    erraticism: 0.2,
    moveSpeed: 0.9,
    grudgeIntensity: 0.95,
    sacrificialDash: 0.8,
    desperationThreshold: 0.95,
    bounceChasing: 0.8,
    panicFactor: 0.2,
};

/**
 * Cyclone — chaotic spiral movement with unpredictable speed bursts.
 * Hard to predict, hard to pin down.
 */
export const CYCLONE: AiPersonality = {
    name: 'Cyclone',
    color: 0x16a085,
    tagline: 'Spinning chaos — spirals in unpredictable bursts',
    approachDistance: 4,
    aggression: 0.75,
    edgeCaution: 0.7,
    dashRate: 1.0,
    erraticism: 0.3,
    moveSpeed: 1.0,
    spinRate: 0.9,
    jitterAmplitude: 0.5,
    burstiness: 0.6,
    dashDirection: 0.3,
    centerControl: 0.5,
};

/**
 * Showboat — shows off when winning, gets reckless and exploitable.
 * Loves to feint and ride the edge.
 */
export const SHOWBOAT: AiPersonality = {
    name: 'Showboat',
    color: 0xf39c12,
    tagline: 'Flashy entertainer — shows off when ahead, easy to exploit',
    approachDistance: 4,
    aggression: 0.75,
    edgeCaution: 0.6,
    dashRate: 0.9,
    erraticism: 0.15,
    moveSpeed: 0.95,
    showboating: 0.9,
    overconfidence: 0.6,
    feintRate: 0.7,
    anglePref: 0.5,
    centerControl: 0.4,
    respectMomentum: 0.6,
};

/**
 * Viper — lightning-fast flanking strikes followed by immediate retreat.
 * Attacks from oblique angles and vanishes before you can respond.
 */
export const VIPER: AiPersonality = {
    name: 'Viper',
    color: 0x2ecc71,
    tagline: 'Lightning strikes — flanks fast, vanishes faster',
    approachDistance: 4,
    aggression: 0.7,
    edgeCaution: 0.75,
    dashRate: 0.8,
    erraticism: 0.1,
    moveSpeed: 0.95,
    anglePref: 0.8,
    strafeStrength: 0.6,
    retreatAfterHit: 0.9,
    dodgeReflex: 0.7,
    commitWindow: 1.5,
    centerControl: 0.5,
    respectMomentum: 0.8,
};

/**
 * Trickster — master of deception. Feints constantly, baits you into
 * overcommitting, then punishes with precise counter-dashes.
 */
export const TRICKSTER: AiPersonality = {
    name: 'Trickster',
    color: 0xf1c40f,
    tagline: 'Mind games — baits you in, punishes the commit',
    approachDistance: 5,
    aggression: 0.5,
    edgeCaution: 0.7,
    dashRate: 0.6,
    erraticism: 0.15,
    moveSpeed: 0.85,
    feintRate: 0.9,
    ambushTendency: 0.6,
    counterDashRate: 0.7,
    respectMomentum: 0.85,
    patience: 0.6,
    centerControl: 0.5,
    predictionStrength: 0.5,
};

/**
 * Pendulum — rhythmic oscillation between aggression and calm. Surges
 * forward in bursts, retreats to recover, then surges again on a timer.
 * Feels like fighting a ticking clock.
 */
export const PENDULUM: AiPersonality = {
    name: 'Pendulum',
    color: 0x8e44ad,
    tagline: 'Ticking clock — rhythmic surges between fury and calm',
    approachDistance: 5,
    aggression: 0.65,
    edgeCaution: 0.7,
    dashRate: 0.7,
    erraticism: 0.1,
    moveSpeed: 0.85,
    phaseShift: 0.9,
    rhythmPeriod: 4,
    patience: 0.5,
    centerControl: 0.5,
    commitWindow: 2.5,
    retreatAfterHit: 0.4,
};

/**
 * Warden — territorial defender that owns its spawn zone. Passive at
 * range but ferocious when you trespass. Gets angrier with each hit.
 */
export const WARDEN: AiPersonality = {
    name: 'Warden',
    color: 0x34495e,
    tagline: 'Stay off my turf — territorial, grudge-holding guardian',
    approachDistance: 5,
    aggression: 0.45,
    edgeCaution: 0.8,
    dashRate: 0.5,
    erraticism: 0.05,
    moveSpeed: 0.7,
    territoriality: 0.9,
    grudgeIntensity: 0.7,
    counterDashRate: 0.6,
    patience: 0.6,
    centerControl: 0.4,
    predictionStrength: 0.4,
    retreatAfterHit: 0.3,
};

/**
 * All built-in AI personalities, for random selection or UI listing.
 *
 * @example
 * ```ts
 * const personality = AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)];
 * ```
 */
export const AI_PERSONALITIES: readonly AiPersonality[] = [
    BRAWLER,
    SENTINEL,
    GREMLIN,
    MATADOR,
    JUGGERNAUT,
    PHANTOM,
    PUPPETEER,
    MIMIC,
    BERSERKER,
    CYCLONE,
    SHOWBOAT,
    VIPER,
    TRICKSTER,
    PENDULUM,
    WARDEN,
];
