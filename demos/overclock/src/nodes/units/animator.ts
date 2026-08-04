import * as THREE from 'three';
import type { ClipSlot } from '../../config/models';

/** Crossfade time between the idle and move base states. */
const BASE_FADE = 0.18;
/** Base-state weight while a one-shot (attack/cast) plays over it. */
const BASE_DUCK = 0.2;
/** Longest a death clip holds the corpse on the board. */
export const DEATH_LINGER_CAP = 2;

/**
 * Drives a custom model's animation clips from game state: a looping base
 * state (idle/move) with crossfades, fire-and-forget one-shots for
 * attacks/casts, and a terminal death clip.
 */
export interface UnitAnimator {
    /** Advances the mixer. Call every frame with the frame delta. */
    update(dt: number): void;
    /** Switches the looping base state (no-op when unchanged). */
    setBase(state: 'idle' | 'move'): void;
    /**
     * Plays a one-shot over the base state. `duration` (seconds) speeds
     * the clip up when it is longer than the available window (a fast
     * attacker's swing must fit its attack interval); clips are never
     * slowed down. Casts fall back to the attack clip.
     */
    trigger(slot: 'attack' | 'cast', duration?: number): void;
    /**
     * Stops everything and plays the death clip, clamped on its last
     * frame.
     *
     * @returns Seconds the corpse should linger (0 = no death clip).
     */
    playDeath(): number;
}

/**
 * Creates an animator for one model instance. Starts in idle (or the
 * model's only clip) and immediately applies the first frame so static
 * renders show a pose instead of the bind pose.
 *
 * @param root - The cloned model instance the mixer animates.
 * @param clips - Animation clips from the model file (shared, not copied).
 * @param resolved - Slot → clip-name mapping (see `resolveClipNames`).
 * @returns The animator, or null when no usable clips resolved.
 *
 * @example
 * const animator = createAnimator(model, gltf.animations, { idle: 'Idle' });
 * animator?.update(dt);
 */
export function createAnimator(
    root: THREE.Object3D,
    clips: readonly THREE.AnimationClip[],
    resolved: Partial<Record<ClipSlot, string>>,
): UnitAnimator | null {
    const byName = new Map(clips.map((c) => [c.name, c]));
    const mixer = new THREE.AnimationMixer(root);
    const actionFor = (slot: ClipSlot): THREE.AnimationAction | null => {
        const name = resolved[slot];
        const clip = name ? byName.get(name) : undefined;
        return clip ? mixer.clipAction(clip) : null;
    };

    const idle = actionFor('idle');
    const move = actionFor('move');
    const attack = actionFor('attack');
    const cast = actionFor('cast') ?? attack;
    const death = actionFor('death');
    if (!idle && !move && !attack && !death) return null;

    let base = idle ?? move;
    let baseState: 'idle' | 'move' = 'idle';
    let oneShots = 0;
    base?.play();
    mixer.update(0);

    for (const a of [attack, cast]) {
        a?.setLoop(THREE.LoopOnce, 1);
    }
    mixer.addEventListener('finished', (e) => {
        if (e.action === attack || e.action === cast) {
            oneShots = Math.max(0, oneShots - 1);
            if (oneShots === 0) base?.setEffectiveWeight(1);
        }
    });

    return {
        update: (dt) => mixer.update(dt),
        setBase: (state) => {
            if (state === baseState) return;
            baseState = state;
            // Without a walk clip the idle keeps playing while moving.
            const next = state === 'move' ? (move ?? idle) : (idle ?? move);
            if (!next || next === base) return;
            next.reset().setEffectiveWeight(oneShots > 0 ? BASE_DUCK : 1);
            next.play();
            if (base) base.crossFadeTo(next, BASE_FADE, false);
            base = next;
        },
        trigger: (slot, duration) => {
            const action = slot === 'cast' ? cast : attack;
            if (!action) return;
            const clipLen = action.getClip().duration;
            action.timeScale =
                duration && clipLen > duration ? clipLen / duration : 1;
            action.reset().setEffectiveWeight(1).play();
            oneShots++;
            base?.setEffectiveWeight(BASE_DUCK);
        },
        playDeath: () => {
            if (!death) return 0;
            mixer.stopAllAction();
            death.setLoop(THREE.LoopOnce, 1);
            death.clampWhenFinished = true;
            death.reset().setEffectiveWeight(1).play();
            return Math.min(death.getClip().duration, DEATH_LINGER_CAP);
        },
    };
}
