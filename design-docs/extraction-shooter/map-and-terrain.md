# Map & Terrain

The raid takes place on a **node-graph map** — a network of interconnected locations. Players navigate between nodes, and the map's structure drives the tactical decisions of the game. Maps are **fixed and hand-designed**, with each map featuring distinct Points of Interest (PoIs), wide connective terrain between them, and unique map events that may or may not activate each raid.

## Map as a Node Graph

The map is not a grid or hex map. It is a **graph of named nodes** connected by edges. Each node represents a distinct location (a room, clearing, structure, etc.), and edges represent traversable paths between them.

Nodes are grouped into two categories:

- **PoI nodes** — Nodes that belong to a named Point of Interest (a multi-room facility, compound, landmark, etc.).
- **Connective nodes** — Nodes that exist between PoIs, forming the traversable terrain that connects them.

This structure allows for:
- **Chokepoints**: Rare narrow passages (a bridge, a canyon, a tunnel entrance) that funnel traffic — meaningful *because* the rest of the map is wide.
- **Dead ends**: Nodes with one exit — safe from ranged fire but dangerous if someone follows you in.
- **Hub nodes**: Highly connected nodes where encounters are likely.
- **Flanking routes**: Multiple paths between any two points, rewarding map knowledge.

## Node Properties

Each node has the following properties:

| Property | Description |
|---|---|
| **Name** | Display name for the location. |
| **PoI** | Which Point of Interest this node belongs to, if any. `null` for connective nodes. |
| **Connections** | List of adjacent nodes (traversable in one MOVE action). |
| **Cover** | How protected the node is from ranged attacks (see below). |
| **Terrain Type** | Affects visibility modifiers (see [Visibility](./visibility.md)). |
| **Loot Table** | The loot pool and drop rates for this node (see [Loot Distribution](#loot-distribution)). |
| **Content** | What's on the node at raid start: PvE encounter, extraction point, spawn point, or empty. |

## Points of Interest (PoIs)

A PoI is a **named cluster of multiple nodes** that represents a significant location on the map — a facility, landmark, or structure. PoIs are the primary destinations during a raid. They contain the best loot, the most dangerous encounters, and the highest density of content.

### PoI Structure

Each PoI is composed of multiple internal nodes connected by edges. A PoI should feel like a real place to explore, not a single room to loot and leave. Internal navigation within a PoI involves tactical choices — which room to enter first, which hallway to take, where to hold position.

Example PoI — **Abandoned Lab**:

```
    [Reception] ──── [Main Corridor]
         │                │        ╲
    [Break Room]    [Server Room]   [Storage]
                          │
                     [Clean Room]
```

Each internal node has its own cover, terrain type, and loot table. The Server Room might have rare tech loot but no cover. The Storage room might have common supplies and partial cover. The Clean Room might hold the best loot in the PoI but be a dead end — dangerous if another player is between you and the exit.

### PoI Design Principles

- **Multiple internal nodes (4–8+ per PoI).** PoIs should feel spacious. Exploring one takes multiple turns, which means committing time and accepting risk.
- **Multiple entry points.** Most PoIs should have 2–3 connections to the surrounding connective terrain. This prevents a single player from locking down access and creates flanking opportunities.
- **Internal layout variety.** Some PoIs are linear (a sequence of rooms), some are branching (a hub with wings), some are loops (multiple paths through). Layout shapes the tactical experience.
- **Identity and narrative.** Each PoI has a name, a visual theme, and a reason to exist on the map. Players should remember them: "We fought at the Refinery," not "We fought at node cluster #3."

### Example PoIs

These are illustrative — specific PoIs are designed per map:

| PoI | Theme | Nodes | Notable Features |
|---|---|---|---|
| **Comm Tower** | Elevated, exposed | 4–5 | High ground, sightlines to surrounding terrain, amplifying visibility |
| **Abandoned Lab** | Interior, mixed cover | 5–7 | Dead-end rooms with rare loot, tight corridors |
| **Refinery** | Industrial, metal surfaces | 6–8 | Amplifying terrain (metal), complex internal layout, PvE encounters |
| **Bunker Network** | Underground, dampening | 5–6 | Full cover, dampening visibility, limited entry points |
| **Trading Post** | Mixed exterior/interior | 4–5 | Central location, high traffic, diverse loot |

## Connective Terrain

Connective terrain is the space **between** PoIs. These nodes create distance, routing decisions, and risk. They are not corridors — connective terrain is **wide**, offering multiple parallel paths between any two PoIs.

### Width Principle

Getting from one PoI to another should never force players down a single linear path. The connective space between two PoIs should offer several parallel nodes with different terrain properties, allowing players to choose their route based on playstyle and tactical need.

Rather than:

```
[PoI A] ── Road ── Crossroads ── Road ── [PoI B]
```

Connective terrain looks like:

```
                  [Ridge]
                 ↗       ↘
[PoI A] ── [Treeline] ── [Open Field] ── [PoI B]
                 ↘       ↗
              [Creek Bed]
```

Each parallel path has different properties:
- **The ridge** — Amplifying visibility, partial cover, sightlines to other paths. The overwatch position.
- **The treeline** — Dampening visibility, partial cover. The stealth route.
- **The open field** — Amplifying visibility, no cover, but the fastest path (fewest hops). The speed route.
- **The creek bed** — Dampening visibility, no cover, extra node hops. Quiet but exposed if found.

Two players moving between the same PoIs can pass without ever sharing a node. This is intentional — the map should feel open, not like a series of funnels.

### Connective Terrain Properties

- **Light or no loot.** Maybe a stray ammo drop or common consumable, nothing worth diverting for. The loot is at the PoIs.
- **Simple terrain profiles.** Connective nodes are defined by their cover and visibility properties, not by internal complexity.
- **Strategic value from positioning, not content.** A ridge between two PoIs isn't worth visiting for loot — it's worth visiting to watch the road below.

### Chokepoints as Exceptions

Because connective terrain is generally wide, the rare **chokepoints** become significant map features. A single bridge over a ravine, a narrow canyon pass, or a tunnel entrance into an underground PoI — these are notable *because* most of the map gives you freedom. Players learn and respect them.

Chokepoints should be:
- **Rare.** Most routes between PoIs have multiple parallel paths.
- **Avoidable.** There should always be an alternative route, even if it's longer or more dangerous in other ways.
- **Memorable.** Named, distinct, with clear tactical identity. "The Bridge" becomes a landmark players discuss.

## Cover

Cover determines how difficult it is to hit a player on a given node from range:

| Cover Level | Accuracy Modifier | Example Terrain |
|---|---|---|
| **None** | No modifier | Open field, creek, road |
| **Partial** | –10% incoming ranged accuracy | Valley, tree line, ruins |
| **Full** | Can only be targeted from same node | Bunker interior, cave, underground |

Cover only affects **incoming ranged attacks** (range 1+). Same-node (range 0) combat ignores cover — you're in the same location.

This means:
- Full-cover nodes are safe from snipers but dangerous if someone enters directly.
- No-cover nodes are fast to cross but deadly to linger on.
- Partial-cover nodes are the middle ground for most engagements.

## Terrain Types & Visibility

Terrain types modify a player's outgoing visibility (see [Visibility — Terrain Modifiers](./visibility.md#terrain-modifiers)):

| Terrain Type | Visibility Modifier | Cover Level (typical) |
|---|---|---|
| Open Field | +1 (amplifying) | None |
| Ridgeline | +1 (amplifying) | None–Partial |
| Water / Metal | +1 (amplifying) | None |
| Standard (default) | 0 | Partial |
| Dense Forest | –1 (dampening) | Partial |
| Cave / Underground | –2 (dampening) | Full |
| Bunker | –2 (dampening) | Full |

Terrain type and cover level often correlate but are independent properties. A ridgeline could have partial cover (rocks to hide behind) but amplifying visibility (elevated, exposed).

## Loot Distribution

Loot is concentrated at PoIs and sparse in connective terrain. Each node has a **loot table** that defines what can spawn there and at what probability.

### PoI Loot

Each PoI has a **thematic loot table** that reflects its identity:
- **Comm Tower** — Scout drones, signal flares, extraction tools.
- **Abandoned Lab** — Rare consumables, medical supplies, high-rarity utility cards.
- **Refinery** — Heavy ammo, armor, industrial equipment.
- **Bunker Network** — Weapons, heavy ammo, armor.
- **Trading Post** — Mixed loot from all categories, moderate rarity.

Individual nodes within a PoI draw from the PoI's loot table but may have their own weighting. The deepest room in a PoI (the dead end, the hardest to reach) should have the best odds for high-rarity drops.

### Connective Loot

Connective nodes have **light, generic loot tables** — common ammo, basic consumables. A player shouldn't divert their route to loot a connective node. The loot is incidental, found while passing through.

### Per-Raid Variation

Loot spawns are rolled per raid. The loot tables are fixed (tied to the map), but which specific items appear and where within a PoI varies each time. Players learn "the Lab has good medical loot" but can't predict exactly which node has the Medkit this raid.

## Map UI: Macro and Micro Views

With 60–80+ nodes per map, the UI must prevent information overload. The solution is **two zoom levels** that match how players think about the map.

### Macro View (Strategic)

The default view when zoomed out. Shows:
- **PoIs as labeled regions** — large, distinct zones on the map, not individual nodes.
- **Connective terrain as open space** between PoIs, with general route indicators.
- **Your position** highlighted within or between PoIs.
- **High-level information** — which PoIs you've visited, where you've heard gunfire, extraction point locations.

This is the "where do I want to go?" view. A player can glance at it and decide "I'm heading toward the Refinery" in seconds.

### Micro View (Tactical)

The view when zoomed in or when viewing your immediate area. Shows:
- **Individual nodes** in your vicinity (your current node, adjacent nodes, nearby PoI internals).
- **Cover, terrain type, and visible content** for nearby nodes.
- **Other visible players/entities** at their specific nodes.
- **Edge connections** showing exactly where you can move this turn.

This is the "what do I do this turn?" view. The decision space is small — 3–5 adjacent nodes — even though the full map is large.

### Why This Works With 30-Second Turns

The 30-second timer is plenty because:
- **Strategic decisions** (which PoI to target, which route to take) are made on the macro view between active moments. Players have been thinking about their route for multiple turns.
- **Tactical decisions** (which adjacent node to move to, whether to fight or flee) only involve the micro view and a handful of options.
- Players are never asked to parse 80 nodes in 30 seconds. They see the 3–5 nodes that matter right now.

## Map Size

Target map composition for a 4–6 player raid:

| Component | Count | Nodes Each | Total Nodes |
|---|---|---|---|
| PoIs | 4–6 | 4–8 | 16–48 |
| Connective terrain | — | — | 20–40 |
| **Total** | — | — | **~50–80** |

This gives enough space for players to avoid each other in the connective terrain while ensuring PoIs are high-traffic, high-tension zones. Exact numbers are subject to playtesting.

### Map Diameter

The maximum distance (in node hops) between any two points on the map should be around **8–12 hops**. This means:
- Crossing the full map takes 8–12 turns at minimum (significant time investment).
- Adjacent PoIs are 2–4 hops apart through connective terrain.
- Players can't easily chase someone across the entire map — disengaging and relocating is viable.

## Strategic Map Considerations

The map layout should create natural tension:

- **Valuable PoIs should be central or exposed.** High reward requires accepting high visibility and high traffic.
- **Extraction points should be at map edges.** Players must travel outward from the high-value center to extract, creating a natural flow.
- **Dampening terrain (caves, bunkers) should be deeper in the map or off the main path.** Stealth players can use these routes but they're longer or riskier in other ways.
- **Chokepoints are rare and avoidable.** Players must decide whether to take the fast route through a chokepoint or a wider but longer alternative.
- **Sightlines from vantage nodes should cover high-traffic paths.** Sniper positions are powerful but predictable — experienced players know where to expect them.
- **PoIs should have multiple entry points.** No single player can lock down a PoI by controlling one doorway.

## Zones as Functional Sites

Each map is a **Zone** — a section of Earth's surface converted by the Architect into a functional component of a relay node. Maps aren't just themed environments; they have a *purpose* in the Architect's construction plan. This purpose drives the PoI themes, PvE behavior, loot tables, and map events.

See [Lore Overview — What It's Building](./lore-overview.md#what-its-building) for full context on Zone types.

| Map | Pre-Imprint Location | Zone Function | How It Reads |
|---|---|---|---|
| **Vashon Complex** | Chemical plant | Synthesis (material production) | Machinery producing unknown compounds. Living fluid in tanks. Active production lines. |
| **Lachesis Array** | Telecom facility | Signal (inter-Zone coordination) | Dishes aimed at each other and the sky. Pulsing signals. Detection interference. |
| **Ward 17** | Hospital campus | Storage (data encoding) | Crystals growing from walls. Records become physical objects. Humming rooms. |
| **Threshold** | Mountain research station | Calibration (boundary testing) | Zone edge visible from inside. Fluctuating boundary. Measurement equipment. |

Players don't learn Zone functions from labels — they piece it together from environment, PvE behavior, and loot. See [Narrative Delivery](./narrative-delivery.md) for how this unfolds.

## Fixed Maps

Maps are **hand-designed and fixed**. Each map is a curated experience with intentional layouts, balanced PoI placement, and designed routing. Players learn maps over time, and map knowledge becomes a skill dimension.

Replayability comes from:
- **Per-raid loot variation** — Loot spawns are rolled each raid from fixed loot tables.
- **Per-raid PvE variation** — PvE encounter placement may vary within constraints.
- **Map events** — Zone-specific mechanics that may or may not activate each raid (see [Map Events](./map-events.md)).
- **Player behavior** — The same map plays differently depending on who's in the raid and what they do.

New maps are added over time as content updates. Each new map is a new Zone — narratively, the Architect building its next relay component. Each map has its own PoIs, connective layouts, loot tables, events, and Zone function.
