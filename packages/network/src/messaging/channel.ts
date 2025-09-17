import type { ChannelHandler } from '../types';

/**
 * Helper to define a typed channel name.
 * @param name The name of the channel.
 * @returns The channel name.
 */
export function defineChannel<T = unknown>(name: string) {
    return { name } as const as { name: string } & { __t?: T };
}

/**
 * Alias of defineChannel for a more concise DSL.
 */
export const channel = defineChannel;

/**
 * Type for a channel name.
 */
export type ChannelName = { name: string } | string;

/**
 * Get the key for a channel.
 * @param ch The channel.
 * @returns The key.
 */
export function channelKey(ch: ChannelName): string {
    return typeof ch === 'string' ? ch : ch.name;
}

/**
 * Once handler for a channel.
 * @param fn The handler.
 * @returns The handler.
 */
export function once<T>(fn: ChannelHandler<T>): ChannelHandler<T> {
    let called = false;
    return (data, meta) => {
        if (called) return;
        called = true;
        fn(data, meta);
    };
}
