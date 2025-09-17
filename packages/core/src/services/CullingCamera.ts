import { Service } from '../Service';

/**
 * A service that provides a culling camera.
 */
export class CullingCamera extends Service {
    constructor(public projView: Float32Array) {
        super();
    }
}
