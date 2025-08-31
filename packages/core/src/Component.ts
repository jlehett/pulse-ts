import type { Node } from './node';
import { kSetComponentOwner } from './keys';

/**
 * A base class for all components.
 */
export abstract class Component {
    private _owner!: Node;

    [kSetComponentOwner](owner: Node): void {
        this._owner = owner;
    }

    /**
     * The owner of the component.
     */
    get owner(): Node {
        return this._owner;
    }

    /**
     * Attaches the component to an owner. Override this method to implement
     * custom attachment logic.
     * @param owner The owner of the component.
     * @returns The component.
     */
    static attach<T extends Component>(this: new () => T, owner: Node): T {
        const c = new this();
        c[kSetComponentOwner](owner);
        return c;
    }
}
