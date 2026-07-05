import type { EventDef } from './types';

/**
 * Signal events — narrative choice nodes on the run map. Outcomes are
 * resolved by the run layer.
 */
export const EVENTS: EventDef[] = [
    {
        id: 'derelict-freighter',
        title: 'Derelict Freighter',
        body: 'A cargo hauler drifts dead in the lane, hold intact. Its distress beacon still chirps on a Scrapline frequency.',
        choices: [
            {
                label: 'Strip the hold',
                detail: 'Gain 10 gold.',
                outcome: { type: 'gold', amount: 10 },
            },
            {
                label: 'Reroute its reactor',
                detail: 'Restore 12 core integrity.',
                outcome: { type: 'coreRepair', amount: 12 },
            },
            {
                label: 'Answer the beacon',
                detail: '60%: a construct joins you. 40%: ambush damages your core for 8.',
                outcome: {
                    type: 'gamble',
                    winChance: 0.6,
                    win: { type: 'freeUnit', costTier: 3 },
                    lose: { type: 'coreDamage', amount: 8 },
                },
            },
        ],
    },
    {
        id: 'black-market-uplink',
        title: 'Black Market Uplink',
        body: 'An encrypted vendor node offers combat firmware, no questions asked. The checksum does not match anything legal.',
        choices: [
            {
                label: 'Buy the firmware',
                detail: 'Pay 8 gold, gain an augment.',
                costGold: 8,
                outcome: { type: 'augment' },
            },
            {
                label: 'Sell your telemetry',
                detail: 'Gain 8 gold.',
                outcome: { type: 'gold', amount: 8 },
            },
            {
                label: 'Disconnect',
                detail: 'Nothing happens.',
                outcome: { type: 'nothing' },
            },
        ],
    },
    {
        id: 'training-grounds',
        title: 'Abandoned Proving Grounds',
        body: 'A shuttered test range, targeting drones still humming. Your constructs could run the gauntlet — carefully.',
        choices: [
            {
                label: 'Run combat drills',
                detail: 'Gain 6 XP.',
                outcome: { type: 'xp', amount: 6 },
            },
            {
                label: 'Salvage the drones',
                detail: 'Gain 6 gold.',
                outcome: { type: 'gold', amount: 6 },
            },
            {
                label: 'Overclock the range',
                detail: '50%: gain 12 XP. 50%: take 6 core damage.',
                outcome: {
                    type: 'gamble',
                    winChance: 0.5,
                    win: { type: 'xp', amount: 12 },
                    lose: { type: 'coreDamage', amount: 6 },
                },
            },
        ],
    },
    {
        id: 'stranded-construct',
        title: 'Stranded Construct',
        body: 'A powered-down construct sits half-buried in slag, core still warm. Its manufacturer tag has been filed off.',
        choices: [
            {
                label: 'Reactivate it',
                detail: 'A cost-2 construct joins your bench.',
                outcome: { type: 'freeUnit', costTier: 2 },
            },
            {
                label: 'Strip it for parts',
                detail: 'Gain 7 gold.',
                outcome: { type: 'gold', amount: 7 },
            },
        ],
    },
    {
        id: 'coolant-leak',
        title: 'Coolant Leak',
        body: 'Your transport is bleeding coolant across the deck. Fixing it properly means cannibalizing spare plating.',
        choices: [
            {
                label: 'Patch it properly',
                detail: 'Pay 5 gold, restore 15 core integrity.',
                costGold: 5,
                outcome: { type: 'coreRepair', amount: 15 },
            },
            {
                label: 'Ride it out',
                detail: 'Take 5 core damage.',
                outcome: { type: 'coreDamage', amount: 5 },
            },
        ],
    },
];

/** Lookup of events by id. */
export const EVENT_BY_ID: ReadonlyMap<string, EventDef> = new Map(
    EVENTS.map((e) => [e.id, e]),
);
