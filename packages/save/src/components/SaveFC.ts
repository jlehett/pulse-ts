import { Component } from '@pulse-ts/core';

/**
 * Save metadata for a function component.
 *
 * Attached to a node when an FC calls `useSaveFC(id, props)` so the save
 * file can record which FC and props to re-mount during rebuild loads.
 */
export class SaveFC extends Component {
    /**
     * The type of the FC.
     */
    type: string = '';
    /**
     * The props of the FC.
     */
    props: unknown = undefined;
}
