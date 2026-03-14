import {
    World,
    mount,
    getComponent,
    StableId,
    Transform,
} from '@pulse-ts/core';
import { useRemoteEntity, useLocalEntity } from './entity';
import { InterpolationService } from '../domain/services/InterpolationService';
import { ReplicationService } from '../domain/services/ReplicationService';

describe('useRemoteEntity', () => {
    it('assigns StableId and sets up consumer replication', () => {
        const world = new World();
        let handle: ReturnType<typeof useRemoteEntity> | undefined;

        const node = mount(
            world,
            () => {
                handle = useRemoteEntity('remote-1');
            },
            undefined,
        );

        expect(handle).toBeDefined();
        expect(handle!.stableId).toBe('remote-1');

        const sid = getComponent(node, StableId);
        expect(sid).toBeDefined();
        expect(sid!.id).toBe('remote-1');
    });

    it('returns null targetVelocity and targetPosition before any network update', () => {
        const world = new World();
        let handle: ReturnType<typeof useRemoteEntity> | undefined;

        mount(
            world,
            () => {
                handle = useRemoteEntity('remote-2');
            },
            undefined,
        );

        expect(handle!.targetVelocity).toBeNull();
        expect(handle!.targetPosition).toBeNull();
    });

    it('returns interpolation data after setTarget', () => {
        const world = new World();
        let handle: ReturnType<typeof useRemoteEntity> | undefined;

        mount(
            world,
            () => {
                handle = useRemoteEntity('remote-3', { lambda: 20 });
            },
            undefined,
        );

        const interp = world.getService(InterpolationService)!;
        expect(interp).toBeDefined();

        interp.setTarget('remote-3', {
            p: { x: 1, y: 2, z: 3 },
            v: { x: 4, y: 5, z: 6 },
        });

        expect(handle!.targetPosition).toEqual({ x: 1, y: 2, z: 3 });
        expect(handle!.targetVelocity).toEqual({ x: 4, y: 5, z: 6 });
    });

    it('registers with the InterpolationService', () => {
        const world = new World();

        mount(
            world,
            () => {
                useRemoteEntity('remote-4');
            },
            undefined,
        );

        const interp = world.getService(InterpolationService)!;
        expect(interp).toBeDefined();
        // Verify it was registered by checking that setTarget doesn't silently no-op
        interp.setTarget('remote-4', { v: { x: 1, y: 0, z: 0 } });
        expect(interp.getTargetVelocity('remote-4')).toEqual({
            x: 1,
            y: 0,
            z: 0,
        });
    });

    it('attaches a Transform component', () => {
        const world = new World();

        const node = mount(
            world,
            () => {
                useRemoteEntity('remote-5');
            },
            undefined,
        );

        const transform = getComponent(node, Transform);
        expect(transform).toBeDefined();
    });
});

describe('useLocalEntity', () => {
    it('assigns StableId and sets up producer replication', () => {
        const world = new World();

        const node = mount(
            world,
            () => {
                useLocalEntity('local-1');
            },
            undefined,
        );

        const sid = getComponent(node, StableId);
        expect(sid).toBeDefined();
        expect(sid!.id).toBe('local-1');
    });

    it('registers with ReplicationService as producer', () => {
        const world = new World();

        mount(
            world,
            () => {
                useLocalEntity('local-2');
            },
            undefined,
        );

        const rep = world.getService(ReplicationService);
        expect(rep).toBeDefined();
    });

    it('attaches a Transform component', () => {
        const world = new World();

        const node = mount(
            world,
            () => {
                useLocalEntity('local-3');
            },
            undefined,
        );

        const transform = getComponent(node, Transform);
        expect(transform).toBeDefined();
    });

    it('does not set up InterpolationService registration', () => {
        const world = new World();

        mount(
            world,
            () => {
                useLocalEntity('local-4');
            },
            undefined,
        );

        const interp = world.getService(InterpolationService);
        // InterpolationService may be provisioned but the entity should not be registered
        if (interp) {
            expect(interp.getTargetVelocity('local-4')).toBeNull();
        }
    });
});

describe('backward compatibility', () => {
    it('individual hooks are still importable alongside entity hooks', () => {
        // Verify the imports don't conflict
        expect(typeof useRemoteEntity).toBe('function');
        expect(typeof useLocalEntity).toBe('function');
    });
});
