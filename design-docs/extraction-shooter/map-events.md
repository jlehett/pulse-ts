# Map Events

Each map has a pool of **unique events** — mechanics specific to that map that may or may not activate during a given raid. Events add per-raid variety to fixed map layouts and create dynamic tactical situations that players must adapt to.

## Core Concept

Events are **fixed to the map, not global**. Each map has its own set of possible events designed around its PoIs, terrain, and theme. They are not random modifiers pulled from a shared pool — they are hand-crafted mechanics that interact with the specific layout of the map.

Events are **opt-in uncertainty**. The map's terrain, PoIs, and connections are always the same. Players learn the map. But events introduce controlled variation — a player who knows the map well still can't predict exactly what conditions they'll face each raid.

## Event Activation

At raid start, the server rolls which events from the map's pool are active for this raid:

- Each event has an **activation chance** (e.g., 30%, 50%, 70%).
- Multiple events can be active in the same raid.
- Some events activate at raid start. Others trigger at a specific turn threshold or when a condition is met.
- Players are **not told** which events are active at raid start (unless the event has visible indicators). Discovery is part of the experience.

## Event Timing

Events fall into three timing categories:

### Raid-Start Events
Active from turn 1. The conditions exist from the moment the raid begins.

### Triggered Events
Activate when a condition is met during the raid — a turn threshold, a player entering a specific node, a certain number of kills, etc. Players may or may not see it coming.

### Timed Events
Activate at a fixed turn number (e.g., turn 8, turn 15). Players who learn the map's event pool will know *when* something could happen, even if they don't know *whether* it will.

## Example Events

These are illustrative, designed to show the range of what events can do. Specific events are created per map.

### Environmental Events

| Event | Timing | Effect |
|---|---|---|
| **Power Outage** | Timed (turn 10) | All Bunker/interior PoI nodes lose their dampening modifier for 3 turns. Fights inside become audible from outside. |
| **Fog Rolls In** | Raid-start | All Open Field connective nodes gain –1 visibility modifier. The exposed speed routes become stealthier. |
| **Flooding** | Timed (turn 8) | Creek/water nodes become impassable for 2 turns. Cuts off certain routes, forces rerouting. |
| **Structural Collapse** | Triggered (first explosion at PoI) | One internal connection within a PoI is severed. A hallway collapses, changing the internal routing. |

### Loot Events

| Event | Timing | Effect |
|---|---|---|
| **Supply Drop** | Timed (turn 6) | A high-value loot cache spawns at a specific connective node (marked on all players' maps when it lands). A race and a trap. |
| **Stash Revealed** | Raid-start | A hidden node within a PoI becomes accessible (a locked door opens, a hidden passage appears). Contains rare loot. |
| **Scavenger Surplus** | Raid-start | One PoI's loot table is upgraded — higher rarity rolls across all its nodes this raid. |

### Threat Events

| Event | Timing | Effect |
|---|---|---|
| **Roaming Heavy** | Raid-start | A high-HP PvE entity patrols between two PoIs through the connective terrain. Not fixed to a node — it moves on a schedule. |
| **Lockdown** | Triggered (alarm at PoI) | A PoI's exits are blocked for 2 turns. Anyone inside is trapped; anyone outside can't enter. Triggered by a specific action (looting a certain node, killing a PvE guard). |
| **Extraction Denied** | Timed (turn 12) | One extraction point is disabled for the rest of the raid. Players relying on it must reroute to another. |

### Information Events

| Event | Timing | Effect |
|---|---|---|
| **Surveillance Active** | Raid-start | A specific PoI has security cameras — all players on its nodes are visible to everyone on the map (marked on the macro view). High-risk, high-reward looting. |
| **Comms Intercept** | Timed (turn 5) | All players receive a one-time ping showing the general area (PoI or connective region) of every other player. A brief window of shared information. |
| **Dead Drop Intel** | Raid-start | A node in a connective area contains a "map" item. Looting it reveals all active events for this raid. Costs a turn to loot, but the information is valuable. |

## Event Design Principles

- **Events change conditions, not rules.** The core mechanics (combat, visibility, movement, cover) never change. Events modify the map — blocking paths, changing terrain properties, spawning content — but players always interact with these changes through the same systems they already know.
- **Events are learnable.** Each map has a fixed pool of possible events. Over time, players learn what *could* happen on a given map. "On this map, the bridge sometimes floods at turn 8 — I should have an alternate route planned." Map knowledge extends to event knowledge.
- **Events create decisions, not punishments.** A good event forces players to adapt their plan, not abandon it entirely. Losing one extraction point is a setback that forces rerouting, not a death sentence. A supply drop is an opportunity that can be ignored.
- **Events interact with the map's identity.** A flooding event belongs on a map with water features. A power outage belongs on a map with a Bunker PoI. Events should feel like they belong to the map, not like generic modifiers applied to it.
- **Not all events are visible.** Some events have obvious indicators (a supply drop landing, a node becoming impassable). Others are silent until a player encounters them (a hidden stash, a roaming heavy). Discovery is part of the gameplay.

## Event Count Per Map

Each map should have **6–10 possible events** in its pool. A typical raid activates **2–4 events**. This keeps any single raid feeling distinct without overwhelming players with simultaneous changes.

## Interaction With Other Systems

- **Visibility**: Events can modify terrain visibility modifiers (Power Outage, Fog). These feed into the existing visibility system — no new rules needed.
- **Movement**: Events can block or open connections (Flooding, Structural Collapse, Stash Revealed). The node graph is modified for the duration of the event.
- **Loot**: Events can add, upgrade, or relocate loot spawns. Loot tables are already per-node and per-raid, so events just modify the inputs.
- **PvE**: Events can add or modify PvE encounters (Roaming Heavy, Lockdown guards). PvE entities follow the same combat rules regardless of how they were spawned.
- **Information**: Events can grant or restrict information (Surveillance, Comms Intercept, Dead Drop Intel). These interact with the visibility and detection tier systems.
