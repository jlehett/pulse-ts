import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CUSTOM_MODELS, type ClipSlot } from '../../config/models';
import type { Team } from '../../sim/types';
import { createAnimator, type UnitAnimator } from './animator';
import { resolveClipNames } from './clipResolve';
import { fitTransform } from './modelFit';

/**
 * Loads, normalizes, and caches the custom unit models registered in
 * `config/models.ts`. Each model is fetched once, auto-fitted to construct
 * proportions, and then cheaply cloned per unit instance.
 */

/** A loaded, normalized model plus its animation data. */
interface ModelTemplate {
    root: THREE.Group;
    clips: THREE.AnimationClip[];
    resolved: Partial<Record<ClipSlot, string>>;
}

const templates = new Map<string, ModelTemplate>();
const pending = new Map<string, Promise<ModelTemplate | null>>();
const loader = new GLTFLoader();

/** Enemy hull tone custom models are tinted toward. */
const ENEMY_TINT = new THREE.Color(0xc9505e);
const ENEMY_TINT_STRENGTH = 0.4;

/** Brightness lift for imported materials (see {@link brighten}). */
const MAX_METALNESS = 0.2;
const EMISSIVE_LIFT = 0.3;

/**
 * Whether a registered custom model has finished loading.
 *
 * @param defId - Unit definition id.
 * @returns True once the normalized template is cached.
 *
 * @example
 * isCustomModelReady('kensei'); // false until the .glb arrives
 */
export function isCustomModelReady(defId: string): boolean {
    return templates.has(defId);
}

/**
 * Loads and normalizes the custom model registered for a unit, caching the
 * result. Resolves null when no model is registered or loading fails (the
 * unit keeps its procedural robot).
 *
 * @param defId - Unit definition id.
 * @returns The shared, normalized template (do not mutate).
 *
 * @example
 * await loadCustomModel('kensei');
 */
export function loadCustomModel(defId: string): Promise<ModelTemplate | null> {
    const def = CUSTOM_MODELS[defId];
    if (!def) return Promise.resolve(null);
    const cached = templates.get(defId);
    if (cached) return Promise.resolve(cached);
    let promise = pending.get(defId);
    if (!promise) {
        promise = loader
            .loadAsync(def.url)
            .then((gltf) => {
                const wrapper = new THREE.Group();
                wrapper.name = 'custom-model';
                gltf.scene.rotation.y = def.rotationY ?? 0;
                wrapper.add(gltf.scene);
                const box = new THREE.Box3().setFromObject(wrapper);
                const fit = fitTransform(box, def);
                wrapper.scale.setScalar(fit.scale);
                wrapper.position.set(
                    fit.position.x,
                    fit.position.y,
                    fit.position.z,
                );
                wrapper.traverse((o) => {
                    // Geometry/materials are shared across clones; flag them
                    // so one-off renderers (portraits) skip disposal.
                    o.userData.sharedAsset = true;
                    if (o instanceof THREE.Mesh) {
                        o.castShadow = false;
                        o.receiveShadow = false;
                        if (Array.isArray(o.material)) {
                            o.material.forEach(brighten);
                        } else {
                            brighten(o.material);
                        }
                    }
                });
                const template: ModelTemplate = {
                    root: wrapper,
                    clips: gltf.animations,
                    resolved: resolveClipNames(
                        gltf.animations.map((c) => c.name),
                        def.clips,
                    ),
                };
                templates.set(defId, template);
                pending.delete(defId);
                return template;
            })
            .catch((err: unknown) => {
                pending.delete(defId);
                console.warn(
                    `[overclock] Failed to load custom model for "${defId}" (${def.url}):`,
                    err,
                );
                return null;
            });
        pending.set(defId, promise);
    }
    return promise;
}

/** One cloned unit model plus its (possibly absent) clip animator. */
export interface CustomModelInstance {
    root: THREE.Group;
    /** Null for models that ship without animation clips. */
    animator: UnitAnimator | null;
}

/**
 * Clones the cached custom model for a unit instance, applying the enemy
 * tint when applicable and wiring an animator when the model has clips.
 *
 * @param defId - Unit definition id.
 * @param team - Which side fields the unit.
 * @returns A fresh instance, or null when the model is not loaded (yet).
 *
 * @example
 * const inst = customModelInstance('kensei', 'player');
 * if (inst) group.add(inst.root);
 */
export function customModelInstance(
    defId: string,
    team: Team,
): CustomModelInstance | null {
    const template = templates.get(defId);
    if (!template) return null;
    // SkeletonUtils.clone keeps skinned meshes bound to their own bones.
    const root = cloneSkinned(template.root) as THREE.Group;
    if (team === 'enemy' && (CUSTOM_MODELS[defId]?.teamTint ?? true)) {
        tintToward(root, ENEMY_TINT, ENEMY_TINT_STRENGTH);
    }
    const animator =
        template.clips.length > 0
            ? createAnimator(root, template.clips, template.resolved)
            : null;
    return { root, animator };
}

/**
 * Kicks off loading for every registered custom model. Call once at
 * startup so models are ready before the first board render / portrait.
 *
 * @example
 * preloadCustomModels();
 */
export function preloadCustomModels(): void {
    for (const defId of Object.keys(CUSTOM_MODELS)) {
        void loadCustomModel(defId);
    }
}

/**
 * Lifts an imported material to the scene's brightness levels. There is no
 * environment map, so glTF's typical metalness-1 surfaces render near
 * black; cap metalness and add a slight self-glow, mirroring the
 * procedural robots' materials.
 */
function brighten(mat: THREE.Material): void {
    if (!(mat instanceof THREE.MeshStandardMaterial)) return;
    mat.metalness = Math.min(mat.metalness, MAX_METALNESS);
    // Respect authored emissives; only lift materials without one.
    if (mat.emissiveMap || mat.emissive.getHex() !== 0) return;
    if (mat.map) {
        mat.emissiveMap = mat.map;
        mat.emissive.set(0xffffff);
    } else {
        mat.emissive.copy(mat.color);
    }
    mat.emissiveIntensity = EMISSIVE_LIFT;
}

/** Clones each mesh's materials and lerps their colors toward a tint. */
function tintToward(root: THREE.Object3D, tint: THREE.Color, t: number): void {
    root.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const tintOne = (mat: THREE.Material): THREE.Material => {
            const clone = mat.clone();
            clone.userData.sharedAsset = false;
            if ('color' in clone && clone.color instanceof THREE.Color) {
                clone.color.lerp(tint, t);
            }
            if ('emissive' in clone && clone.emissive instanceof THREE.Color) {
                clone.emissive.lerp(tint, t * 0.5);
            }
            return clone;
        };
        o.material = Array.isArray(o.material)
            ? o.material.map(tintOne)
            : tintOne(o.material);
    });
}
