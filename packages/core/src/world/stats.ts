import { createServiceKey, type ServiceKey } from '../keys';
import type { World } from '../world';

/**
 * The stats snapshot.
 */
export interface StatsSnapshot {
    /**
     * The FPS.
     */
    fps: number;
    /**
     * The fixed SPS.
     */
    fixedSps: number;
    /**
     * The frame ID.
     */
    frameId: number;
}

export interface StatsService {
    get(): StatsSnapshot;
}

export const STATS_SERVICE: ServiceKey<StatsService> =
    createServiceKey<StatsService>('pulse:stats');

/**
 * The world stats service.
 */
export class WorldStats implements StatsService {
    constructor(private world: World) {}

    /**
     * Gets the stats snapshot.
     * @returns The stats snapshot.
     */
    get(): StatsSnapshot {
        const { fps, fixedSps } = this.world.getPerf();
        return { fps, fixedSps, frameId: this.world.getFrameId() };
    }
}
