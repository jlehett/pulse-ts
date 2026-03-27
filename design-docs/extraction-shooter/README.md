# Extraction Card Game — Design Document

An online-only digital card game inspired by extraction shooters. Players deploy printed biological shells into alien Zones, risk stabilized gear to enter raids, fight PvE and PvP encounters through simultaneous turn-based card combat, loot new cards, and attempt to extract before their shell is destroyed. Death means losing everything you brought in and everything you found — but your consciousness survives for the next print.

## Documents

### Core Systems
| Document | Description |
|---|---|
| [Core Loop](./core-loop.md) | High-level game flow: shell selection, loadout, contracts, matchmaking, raid, extraction |
| [Turn System](./turn-system.md) | Simultaneous turns, HOLD/MOVE posture, resolution order, timing |
| [Combat](./combat.md) | Weapons, ammo, accuracy, range, damage, mutual kills, disengagement |
| [Visibility](./visibility.md) | Action-based visibility, noise profiles, terrain modifiers, detection tiers, scouting |
| [Cards & Loadouts](./cards-and-loadouts.md) | Card types, weapon stats, loadout structure, the hand-as-loadout model |
| [Shells](./shells.md) | Printed operators, shell variants (Catalyst, Weaver, Parasite, Conductor, Phantom, Revenant), cores |

### World & Maps
| Document | Description |
|---|---|
| [Map & Terrain](./map-and-terrain.md) | Fixed node-graph maps, PoIs, connective terrain, cover, loot distribution, Zone functions, macro/micro UI |
| [Map Events](./map-events.md) | Per-Zone events that activate per raid: environmental, loot, threat, information |
| [AI Systems](./ai-systems.md) | Shadow Players (Architect's predictive models), PvE Zone entities, difficulty tiers |
| [Matchmaking](./matchmaking.md) | Queue, lobby timer, session spin-up, low-population handling |

### Narrative & Factions
| Document | Description |
|---|---|
| [Lore Overview](./lore-overview.md) | The Imprint, Zones, the Architect, the relay, stabilization, shells, the complete truth, revelation arc |
| [Factions](./factions.md) | Seven factions: Helix, UNZRA, Wardens, Meridian, Edda, Vaunt, RECLAM — contracts, upgrade trees, story arcs |
| [Narrative Delivery](./narrative-delivery.md) | How story surfaces: environment, loot, contracts, PvE behavior, Shadow Player evolution |

## Design Principles

- **Every action has an information cost.** Moving, looting, and shooting all reveal your position to varying degrees. Staying hidden means staying passive.
- **Tension comes from incomplete information.** Turns are simultaneous and blind. You never know what the other player chose until resolution.
- **Risk and reward are always linked.** Better loot is deeper in the map. Stronger weapons are louder. Longer raids mean more loot but more exposure.
- **No artificial waiting.** Matchmaking doesn't wait for full lobbies. AI fills gaps. Turns have timers.
- **Same ruleset everywhere.** PvE and PvP use identical mechanics. AI players follow the same card/weapon/ammo system as humans.
