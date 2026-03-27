# AI Systems

The game has two distinct AI roles that serve different purposes but follow the same underlying ruleset as human players. Both are grounded in the game's lore — see [Lore Overview](./lore-overview.md) for full narrative context.

## Shadow Players

Shadow Players are AI-controlled players that are **indistinguishable from real players** during a raid. They exist to ensure raids are populated even when matchmaking doesn't find enough humans.

### In-World Identity

Shadow Players are the Architect's **predictive models of human behavior**, instantiated inside the Zones. The Architect doesn't build them to fight Runners — it builds them to *predict* what Runners will do, so it can pre-compensate for the disruption Runners cause to Zone processes.

They're not soldiers, guards, or enemies in the traditional sense. They're simulations running in parallel with actual raids, modeling scenarios. This distinction matters for how they behave and how they evolve over the game's lifespan.

### Behavior

- They use the same card/weapon/ammo system as real players.
- They have a loadout drawn from the same card pool.
- They submit actions each turn just like a human would.
- There is **no visual indicator** that differentiates them from real players.
- From any human player's perspective, they are just another player in the raid.

### Implementation

The server runs Shadow Player decision logic using the same turn submission system as human players. Each Shadow Player has:
- A loadout (selected by the server based on difficulty tier).
- An HP pool.
- A decision-making algorithm that evaluates the current game state and selects an action.

### Difficulty Tiers

| Tier | Behavior | Use Case |
|---|---|---|
| **Timid** | Loots cautiously. Avoids combat. Extracts early. Easy to kill if found, but won't seek fights. | Default filler for low-population raids. |
| **Aggressive** | Pushes toward players. Hunts actively. Takes direct routes. Dangerous but predictable. | Mid-difficulty filler. |
| **Tactical** | Plays smart. Repositions after firing. Uses utility cards. Flanks. Manages ammo. | The "this might be a real player" tier. |

The matchmaking system selects the appropriate tier mix based on raid context (TBD — could factor in player skill rating, raid difficulty level, etc.).

### Shadow Player Evolution (Narrative-Driven)

Shadow Players improve over the game's lifespan, reflecting the Architect's increasing understanding of human behavior:

- **Era 1 (Launch):** Predictable movement, straightforward tactics. Players learn to identify them quickly by behavioral tells.
- **Era 2:** Adaptive routing — they avoid high-traffic areas, choose less obvious paths, occasionally set ambush positions. Identification becomes harder.
- **Era 3:** Faction-mimicking behavior. Coordinated movement between pairs. Players report encounters that felt "too smart" to be AI.
- **Era 4:** Novel tactics players haven't seen before. The Architect is no longer just modeling human behavior — it's extrapolating.

This evolution is both a gameplay tuning lever and a primary narrative vehicle for the Architect's growing awareness.

### Extraction Behavior

Shadow Players path toward extraction points and execute the extraction sequence — moving to the boundary, spending a turn extracting, and disappearing.

Narratively, they don't actually leave. They have no existence outside the Zone. When a Shadow Player "extracts," the predictive model runs to completion and terminates. Materials the Shadow Player was carrying are reabsorbed into the Zone. From a gameplay perspective, this is invisible — indistinguishable from a real player extracting.

See [Lore Overview — What Shadow Players Do at Extraction Points](./lore-overview.md#what-shadow-players-do-at-extraction-points) for full narrative details.

### Post-Raid Disclosure

Whether the game reveals which opponents were Shadow Players after a raid is a design choice:
- **Never reveal**: Maintains the illusion. Players always assume they fought real people. Simpler.
- **Reveal after raid**: Shows a post-raid summary with "AI" tags. Lets players know the truth but doesn't affect gameplay.
- **TBD**: Decide based on playtesting and player feedback.

## PvE Encounters (Zone Entities)

PvE encounters are **functional components of the Zone** — systems built by the Architect that serve specific purposes within the Zone's operation. They are not generic monsters or guards, and their behavior reflects their function.

### In-World Identity

PvE entities are automated systems still executing their original purpose through the Architect's logic. They become dangerous when Runners interfere with their function — not because they're hostile, but because they're *dutiful*.

| Entity Type | Zone Function | Danger Source |
|---|---|---|
| **Maintenance systems** | Repair, modify, and maintain Zone structures | Will "repair" a Runner the same way they'd repair a wall — by converting tissue to Zone material |
| **Transport systems** | Move materials between Zone structures | Large, fast, on fixed routes. Like getting hit by a train that doesn't know you exist |
| **Response systems** | Activate when structures are damaged or materials removed | Trying to undo what the Runner did — retrieve materials, repair damage |

### Behavior

- PvE entities are typically **fixed to nodes** or patrol between a small set of adjacent nodes on a fixed route.
- They interact with players using the same combat mechanics (weapons, ammo, accuracy, damage).
- Their behavior varies by Zone type (see [Narrative Delivery — PvE Entities as Narrative](./narrative-delivery.md#pve-entities-as-narrative)):
  - **Synthesis Zones:** Entities carry materials and feed machines. They treat Runners as raw input.
  - **Signal Zones:** Entities broadcast and relay. Fighting one may alert entities across the Zone.
  - **Storage Zones:** Entities observe and crystallize. More interested in studying you than stopping you.
  - **Calibration Zones:** Entities are most aggressive near the Zone edge, passive deep inside.

### Purpose

PvE encounters serve several gameplay roles:
- **Known risk**: Players can plan around them. "That node has a maintenance entity — I need to go around or bring enough firepower."
- **Loot source**: Killing a PvE encounter drops guaranteed loot. Valuable, but costs HP and ammo to obtain.
- **Bait**: A player fighting a PvE encounter is making noise and taking damage — vulnerable to a third-party attack.
- **Map control**: PvE encounters at chokepoints force players to fight through or find alternate routes.
- **Narrative**: Each entity's behavior tells a story about what the Zone is doing and how it functions.

### PvE Encounter Examples

These are illustrative — specific encounter types are designed per Zone:

| Encounter | Type | HP | Behavior |
|---|---|---|---|
| **Maintenance Drone** | Maintenance | Low | Patrols 2–3 nodes, repairing Zone structures. Attacks any Runner on its repair path. |
| **Material Carrier** | Transport | Medium | Moves materials on a fixed route between PoIs. Fast, heavy, doesn't target Runners unless blocked. |
| **Watcher** | Response (passive) | Low | Stationary. Observes. Alerts other entities when a Runner is detected. Doesn't attack directly. |
| **Reclaimer** | Response (active) | High | Activates when a Runner loots a high-value node. Pursues toward the looted node to recover materials. |

### Same Ruleset Principle

Both Shadow Players and PvE encounters follow the same combat rules as human players:
- Same damage/HP/accuracy mechanics.
- Same ammo consumption (for Shadow Players; PvE encounters may have unlimited ammo — TBD).
- Same visibility and noise rules.

This means players never have to learn a separate "PvE combat system." If you know how PvP works, you know how PvE works. The only difference is AI decision-making quality and predictability.
