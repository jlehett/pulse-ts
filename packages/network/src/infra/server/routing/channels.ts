export type ChannelValidate = (data: any, peer: { id: string }) => boolean;
export type ChannelOnMessage = (
    data: any,
    peer: { id: string },
    server: any,
) => boolean | void; // return true to consume
export type ChannelRoute = (
    data: any,
    peer: { id: string },
) => Iterable<string> | null | undefined;

export type ChannelOptions = {
    validate?: ChannelValidate;
    onMessage?: ChannelOnMessage;
    route?: ChannelRoute;
};

/** Simple registry for per-channel server hooks/options. */
export class ChannelRegistry {
    private map = new Map<string, ChannelOptions>();

    register(name: string, opts: ChannelOptions) {
        this.map.set(name, opts);
        return () => this.map.delete(name);
    }

    get(name: string): ChannelOptions | undefined {
        return this.map.get(name);
    }
}
