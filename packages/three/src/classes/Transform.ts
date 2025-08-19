import { Quaternion, Vector3 } from 'three';

export class Transform {
    private _position: Vector3 = new Vector3();
    private _rotation: Quaternion = new Quaternion();
    private _scale: Vector3 = new Vector3(1, 1, 1);

    get position() {
        return this._position;
    }

    get rotation() {
        return this._rotation;
    }

    get scale() {
        return this._scale;
    }
}
