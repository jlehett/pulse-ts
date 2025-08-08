import { Node } from './Node';

/**
 * A DynamicNode is a Node that has an `onUpdate` method that is called
 * on each tick of the World.
 */
export abstract class DynamicNode extends Node {
    /**
     * The lifecycle method that is called on each tick of the World.
     *
     * @param delta The time in seconds since the last update
     */
    abstract onUpdate(delta: number): void;
}
