import { World } from './classes/World';
import { Node } from './classes/Node';
import { DynamicNode } from './classes/DynamicNode';

interface InertialValueBlueprintProps {
    value: number;
    velocity: number;
    drag: number;
}

class InertialValue extends DynamicNode {
    value: number;
    velocity: number;
    drag: number;

    constructor(world: World, props: InertialValueBlueprintProps) {
        super(world);
        this.value = props.value;
        this.velocity = props.velocity;
        this.drag = props.drag;
    }

    onUpdate(delta: number) {
        this.value += this.velocity * delta;
        this.velocity *= 1 - this.drag * delta;
        if (Math.abs(this.velocity) < 0.001) {
            this.velocity = 0; // Stop if velocity is negligible
        }
    }
}

interface CameraBlueprintProps {
    pos: [number, number, number];
    zoom: number;
    tilt: number;
}

class Camera extends Node {
    pos: [InertialValue, InertialValue, InertialValue];
    zoom: InertialValue;
    tilt: InertialValue;

    constructor(world: World, props: CameraBlueprintProps) {
        super(world);

        this.pos = [
            this.createChild(InertialValue)({
                value: props.pos[0],
                velocity: 0,
                drag: 0,
            }),
            this.createChild(InertialValue)({
                value: props.pos[1],
                velocity: 0,
                drag: 0,
            }),
            this.createChild(InertialValue)({
                value: props.pos[2],
                velocity: 0,
                drag: 0,
            }),
        ];

        this.zoom = this.createChild(InertialValue)({
            value: props.zoom,
            velocity: 0,
            drag: 0,
        });
        this.tilt = this.createChild(InertialValue)({
            value: props.tilt,
            velocity: 0,
            drag: 0,
        });
    }
}

// Example usage

const world = new World();

world.createNode(Camera)({
    pos: [0, 0, 0],
    zoom: 1,
    tilt: 0,
});

world.start();
