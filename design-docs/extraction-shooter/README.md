# Extraction Card Game — Design Document

An online-only digital card game inspired by extraction shooters. Players risk cards from their collection to enter raids, fight PvE and PvP encounters through simultaneous turn-based card combat, loot new cards, and attempt to extract before dying. Death means losing everything you brought in and everything you found.

## Documents

| Document | Description |
|---|---|
| [Core Loop](./core-loop.md) | High-level game flow: collection, loadout, matchmaking, raid, extraction, post-raid |
| [Turn System](./turn-system.md) | Simultaneous turns, HOLD/MOVE posture, resolution order, timing |
| [Combat](./combat.md) | Weapons, ammo, accuracy, range, damage, mutual kills, disengagement |
| [Visibility](./visibility.md) | Action-based visibility, noise profiles, terrain modifiers, detection tiers, scouting |
| [Cards & Loadouts](./cards-and-loadouts.md) | Card types, weapon stats, loadout structure, the hand-as-loadout model |
| [Map & Terrain](./map-and-terrain.md) | Node-graph maps, terrain properties, cover, sightlines, chokepoints |
| [AI Systems](./ai-systems.md) | Shadow Players (human mimics), PvE encounters, difficulty tiers |
| [Matchmaking](./matchmaking.md) | Queue, lobby timer, session spin-up, low-population handling |

## Design Principles

- **Every action has an information cost.** Moving, looting, and shooting all reveal your position to varying degrees. Staying hidden means staying passive.
- **Tension comes from incomplete information.** Turns are simultaneous and blind. You never know what the other player chose until resolution.
- **Risk and reward are always linked.** Better loot is deeper in the map. Stronger weapons are louder. Longer raids mean more loot but more exposure.
- **No artificial waiting.** Matchmaking doesn't wait for full lobbies. AI fills gaps. Turns have timers.
- **Same ruleset everywhere.** PvE and PvP use identical mechanics. AI players follow the same card/weapon/ammo system as humans.
