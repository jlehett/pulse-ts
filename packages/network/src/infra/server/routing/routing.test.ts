import { handleRegisteredChannel } from './routing';
import { ChannelRegistry } from './channels';

describe('handleRegisteredChannel', () => {
    it('runs validate/onMessage/route and forwards when not consumed', () => {
        const reg = new ChannelRegistry();
        const log: string[] = [];
        reg.register('chat', {
            validate: (d) => typeof d?.text === 'string',
            onMessage: (d) => {
                log.push('on:' + d.text);
                // do not consume
                return false;
            },
            route: () => ['room-1'],
        });
        const packet = { channel: 'chat', data: { text: 'hi' } } as any;
        const peer = { id: 'p1', rooms: new Set<string>(['room-x']) } as any;
        const forwarded: any[] = [];
        handleRegisteredChannel(
            reg,
            packet,
            peer,
            (pkt, rooms, exceptId) => forwarded.push({ pkt, rooms, exceptId }),
            {},
        );
        expect(log).toEqual(['on:hi']);
        expect(forwarded[0].pkt).toEqual(packet);
        expect(Array.from(forwarded[0].rooms!)).toEqual(['room-1']);
        expect(forwarded[0].exceptId).toBe('p1');
    });
});
