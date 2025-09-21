import { Component } from '../ecs/Component';

/**
 * Stable string identifier for a Node.
 *
 * - Used by @pulse-ts/save to match nodes in-place across sessions/runs.
 * - Assign via the `useStableId` hook.
 */
export class StableId extends Component {
    id: string = '';
}
