import type { ChannelHandler } from '../types';

/**
 * Helper to define a typed channel name.
 *
 * @param name Channel string.
 * @returns A branded channel token usable with hooks/services.
 *
 * @example
 * import { channel } from '@pulse-ts/network'
 * const Chat = channel<{ text: string }>('chat')
 */
export function defineChannel<T = unknown>(name: string) {
    return { name } as const as { name: string } & { __t?: T };
}

/** Alias of {@link defineChannel} for a concise DSL. */
export const channel = defineChannel;

/** Type for a channel name. */
export type ChannelName = { name: string } | string;

/**
 * Normalize a channel token or string to its key string.
 *
 * @param ch Channel token or string.
 * @returns Channel key string.
 *
 * @example
 * channelKey('chat') // => 'chat'
 */
export function channelKey(ch: ChannelName): string {
    return typeof ch === 'string' ? ch : ch.name;
}

/**
 * Wrap a channel handler so it runs only once.
 *
 * @param fn Original handler.
 * @returns Wrapped handler that auto-unsubscribes after first call.
 */
export function once<T>(fn: ChannelHandler<T>): ChannelHandler<T> {
    let called = false;
    return (data, meta) => {
        if (called) return;
        called = true;
        fn(data, meta);
    };
}
