import { defineStore } from '@pulse-ts/core';

/**
 * Store definition for shared dash cooldown progress.
 * Written by LocalPlayerNode each frame, read by HUD and touch controls
 * to display cooldown indicators.
 *
 * Per-player cooldown progress: 0 = on cooldown, 1 = ready.
 *
 * @example
 * ```ts
 * import { useStore } from '@pulse-ts/core';
 * import { DashCooldownStore } from '../dashCooldown';
 *
 * const [cooldown, setCooldown] = useStore(DashCooldownStore);
 * setCooldown({ progress: [0.5, cooldown.progress[1]] });
 * ```
 */
export const DashCooldownStore = defineStore('dashCooldown', () => ({
    progress: [1, 1] as [number, number],
}));
