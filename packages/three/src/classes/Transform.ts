import { Node, type World } from '@pulse-ts/core';
import { Quaternion, Vector3 } from 'three';

export interface TransformProps {
    position?: Vector3;
    rotation?: Quaternion;
    scale?: Vector3;
}

export class Transform extends Node {
    private _localPosition!: Vector3;
    private _localRotation!: Quaternion;
    private _localScale!: Vector3;

    constructor(world: World, props: TransformProps) {
        super(world);

        this._localPosition = props.position ?? new Vector3();
        this._localRotation = props.rotation ?? new Quaternion();
        this._localScale = props.scale ?? new Vector3(1, 1, 1);
    }

    get localPosition(): Vector3 {
        return this._localPosition.clone();
    }

    set localPosition(value: Vector3) {
        this._localPosition.copy(value);
    }

    get worldPosition(): Vector3 {
        const parentTransforms = this.getParentTransforms();

        return parentTransforms.reduce(
            (acc, transform) => acc.add(transform.worldPosition),
            this.localPosition,
        );
    }

    get localRotation(): Quaternion {
        return this._localRotation.clone();
    }

    set localRotation(value: Quaternion) {
        this._localRotation.copy(value);
    }

    get worldRotation(): Quaternion {
        const parentTransforms = this.getParentTransforms();

        return parentTransforms.reduce(
            (acc, transform) => acc.multiply(transform.worldRotation),
            this.localRotation,
        );
    }

    get localScale(): Vector3 {
        return this._localScale.clone();
    }

    set localScale(value: Vector3) {
        this._localScale.copy(value);
    }

    get worldScale(): Vector3 {
        const parentTransforms = this.getParentTransforms();

        return parentTransforms.reduce(
            (acc, transform) => acc.multiply(transform.worldScale),
            this.localScale,
        );
    }

    private getParentTransforms(): Transform[] {
        const transforms: Transform[] = [];

        let parent = this.parent?.parent;
        while (parent) {
            if ((parent as any).transform) {
                transforms.push((parent as any).transform);
            }
            parent = parent.parent;
        }

        return transforms;
    }
}
