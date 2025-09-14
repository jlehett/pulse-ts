/**
 * The reserved channels.
 */
export const ReservedChannels = {
    /** The reserved channel for RPCs. */
    RPC: '__rpc',
    /** The reserved channel for REPLICATIONS. */
    REPL: '__rep',
    /** The reserved channel for RELIABLE messages. */
    RELIABLE: '__rel',
    /** The reserved channel for CLOCK messages. */
    CLOCK: '__clock',
    /** The reserved channel for ROOM messages. */
    ROOM: '__room',
    /** The reserved channel for WebRTC signaling messages. */
    SIGNAL: '__signal',
} as const;

/**
 * The type of a reserved channel.
 */
export type ReservedChannel =
    (typeof ReservedChannels)[keyof typeof ReservedChannels];
