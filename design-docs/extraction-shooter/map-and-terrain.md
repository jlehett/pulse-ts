# Map & Terrain

The raid takes place on a **node-graph map** — a network of interconnected locations. Players navigate between nodes, and the map's structure drives the tactical decisions of the game.

## Map as a Node Graph

The map is not a grid or hex map. It is a **graph of named nodes** connected by edges. Each node represents a distinct location (a room, clearing, structure, etc.), and edges represent traversable paths between them.

Example map fragment:

```
    [Overlook] ──────── [Ridge]
        │                  │
    [Valley] ── [Creek] ── [Bunker]
        │                     │
    [Cave]              [Extraction]
```

This structure allows for:
- **Chokepoints**: Nodes with few connections that are hard to avoid (Creek is on many paths).
- **Dead ends**: Nodes with one exit (Cave) — safe from ranged fire but dangerous if someone follows you in.
- **Hub nodes**: Highly connected nodes where encounters are likely.
- **Flanking routes**: Multiple paths between any two points, rewarding map knowledge.

## Node Properties

Each node has the following properties:

| Property | Description |
|---|---|
| **Name** | Display name for the location. |
| **Connections** | List of adjacent nodes (traversable in one MOVE action). |
| **Cover** | How protected the node is from ranged attacks (see below). |
| **Terrain Type** | Affects visibility modifiers (see [Visibility](./visibility.md)). |
| **Content** | What's on the node: loot, PvE encounter, extraction point, or empty. |

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

## Strategic Map Considerations

The map layout should create natural tension:

- **Valuable loot nodes should be in exposed or central positions.** High reward requires accepting high visibility and high traffic.
- **Extraction points should be at map edges or corners.** Players must travel outward from the high-value center to extract, creating a natural flow.
- **Dampening terrain (caves, bunkers) should be deeper in the map or off the main path.** Stealth players can use these routes but they're longer or riskier in other ways.
- **Chokepoints should be unavoidable for certain paths.** Players must decide whether to take the fast, dangerous route through a chokepoint or the longer, quieter flanking path.
- **Sightlines from vantage nodes should cover high-traffic paths.** Sniper positions are powerful but predictable — experienced players know where to expect them.

## Map Generation

Whether maps are **fixed** (hand-designed) or **procedurally generated** (random node graph with constraints) is TBD. Considerations:

### Fixed Maps
- Easier to balance and tune.
- Players learn the map over time, adding a skill dimension.
- Requires more content creation effort.

### Procedural Maps
- Infinite replayability.
- Harder to balance and ensure fair loot/extraction placement.
- Removes map knowledge as a skill (or makes scouting even more critical).

### Hybrid Approach
- Hand-designed map templates with procedural content placement (loot, PvE encounters, extraction points vary per raid).
- Players learn the terrain layouts but can't predict exactly where loot or threats will be.

## Map Size

Map size should be tuned relative to player count and desired session length:
- Too small: constant PvP, no room for stealth or avoidance.
- Too large: players rarely encounter each other, boring mid-game.

Target: enough nodes that players can avoid each other if they choose, but encounters are likely if anyone pushes toward high-value areas. Exact node count TBD based on playtesting.
