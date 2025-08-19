import { SpatialNode } from '../interfaces/SpatialNode';
import { Node, World } from '@pulse-ts/core';
import * as Three from 'three';
import { Transform } from './Transform';
import { ThreeModule } from '../modules/ThreeModule';

export interface RenderableProps {
    mesh: Three.Object3D;
    transform?: {
        position?: Three.Vector3;
        rotation?: Three.Quaternion;
        scale?: Three.Vector3;
    };
}

export class Renderable extends Node implements SpatialNode {
    private _mesh!: Three.Object3D;

    transform!: Transform;

    get mesh(): Three.Object3D {
        return this._mesh;
    }

    constructor(world: World, props: RenderableProps) {
        super(world);

        this._mesh = props.mesh;
        this.transform = this.createChild(Transform, {
            position: props.transform?.position,
            rotation: props.transform?.rotation,
            scale: props.transform?.scale,
        });

        const threeModule = this.world.getModule('three') as ThreeModule;
        threeModule.addRenderable(this);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onUpdate(_delta: number) {
        const worldPosition = this.transform.worldPosition;
        const worldRotation = this.transform.worldRotation;
        const worldScale = this.transform.worldScale;

        this._mesh.position.set(
            worldPosition.x,
            worldPosition.y,
            worldPosition.z,
        );

        this._mesh.rotation.set(
            worldRotation.x,
            worldRotation.y,
            worldRotation.z,
        );

        this._mesh.scale.set(worldScale.x, worldScale.y, worldScale.z);
    }

    onDestroy() {
        const threeModule = this.world.getModule('three') as ThreeModule;
        threeModule.removeRenderable(this);
    }
}
