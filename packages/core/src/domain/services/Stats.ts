import { Service } from '../ecs/base/Service';

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

/**
 * The world stats service.
 */
export class StatsService extends Service {
    /**
     * Gets the stats snapshot.
     * @returns The stats snapshot.
     */
    get(): StatsSnapshot {
        if (!this.world)
            throw new Error('StatsService is not attached to a world');

        const { fps, fixedSps } = this.world.getPerf();
        return { fps, fixedSps, frameId: this.world.getFrameId() };
    }
}
