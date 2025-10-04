import { TransportService } from '../../domain/services/TransportService';
import { ReservedChannels } from '../../domain/messaging/reserved';

/** Envelope for signaling messages forwarded by the broker on `__signal`. */
export type SignalEnvelope = {
    /** Recipient peer id. */
    to: string;
    /** Optional origin peer id (filled by sender). */
    from?: string;
    /** Signal kind. */
    type: 'hello' | 'offer' | 'answer' | 'ice';
    /** Signal payload (SDP, ICE, etc.). */
    payload: any;
};

/**
 * Minimal signaling client riding on TransportService over the broker.
 *
 * @param svc TransportService used for signaling.
 * @param selfId Local peer id.
 *
 * @example
 * const sig = new RtcSignalingClient(transportService, 'peer-a')
 * sig.start((env) => console.log('got signal', env))
 * sig.send('peer-b', 'hello', {})
 */
export class RtcSignalingClient {
    private off?: () => void;

    constructor(
        private svc: TransportService,
        private selfId: string,
    ) {
        svc.setSelfId(selfId);
    }

    /** Starts listening for signaling messages addressed to `selfId`. */
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

    /** Stops listening for signaling messages. */
    stop() {
        this.off?.();
        this.off = undefined;
    }

    /** Sends a signaling envelope to a peer via the reserved channel. */
    send(to: string, type: SignalEnvelope['type'], payload: any) {
        const env: SignalEnvelope = { to, from: this.selfId, type, payload };
        this.svc.publish(ReservedChannels.SIGNAL, env);
    }
}
