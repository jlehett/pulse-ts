import { TransportService } from '../../domain/services/TransportService';
import { ReservedChannels } from '../../domain/messaging/reserved';

export type SignalEnvelope = {
    to: string;
    from?: string;
    type: 'hello' | 'offer' | 'answer' | 'ice';
    payload: any;
};

/** Minimal signaling client riding on TransportService over the broker. */
export class RtcSignalingClient {
    private off?: () => void;

    constructor(
        private svc: TransportService,
        private selfId: string,
    ) {
        svc.setSelfId(selfId);
    }

    start(onMessage: (env: SignalEnvelope) => void) {
        this.off = this.svc.subscribe<SignalEnvelope>(
            ReservedChannels.SIGNAL,
            (env) => {
                // Drop messages not addressed to us (TransportService also guards)
                if (env?.to !== this.selfId) return;
                onMessage(env);
            },
        );
    }

    stop() {
        this.off?.();
        this.off = undefined;
    }

    send(to: string, type: SignalEnvelope['type'], payload: any) {
        const env: SignalEnvelope = { to, from: this.selfId, type, payload };
        this.svc.publish(ReservedChannels.SIGNAL, env);
    }
}
