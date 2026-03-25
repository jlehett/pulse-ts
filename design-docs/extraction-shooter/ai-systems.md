# AI Systems

The game has two distinct AI roles that serve different purposes but follow the same underlying ruleset as human players.

## Shadow Players (Human Mimics)

Shadow Players are AI-controlled players that are **indistinguishable from real players**. They exist to ensure raids are populated even when matchmaking doesn't find enough humans.

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

### Post-Raid Disclosure

Whether the game reveals which opponents were Shadow Players after a raid is a design choice:
- **Never reveal**: Maintains the illusion. Players always assume they fought real people. Simpler.
- **Reveal after raid**: Shows a post-raid summary with "AI" tags. Lets players know the truth but doesn't affect gameplay.
- **TBD**: Decide based on playtesting and player feedback.

## PvE Encounters (Environmental Threats)

PvE encounters are **map features** — hostile entities fixed to specific nodes. They are not player-mimics; they serve a different purpose as known, predictable obstacles and loot sources.

### Behavior

- PvE entities are **fixed to nodes** (they do not roam, or they patrol between a small set of adjacent nodes on a fixed route).
- They attack any player who is on their node using the same combat mechanics (weapons, ammo, accuracy, damage).
- They have **predictable behavior**: always attacks the closest/most-visible player, always uses the same weapon type, does not use advanced tactics.
- They are present at specific nodes from the start of the raid and are visible to players who enter or scout those nodes.

### Purpose

PvE encounters serve several roles:
- **Known risk**: Players can plan around them. "That node has a turret — I need to go around or bring enough firepower."
- **Loot source**: Killing a PvE encounter drops guaranteed loot. Valuable, but costs HP and ammo to obtain.
- **Bait**: A player fighting a PvE encounter is making noise and taking damage — vulnerable to a third-party attack from another player.
- **Map control**: PvE encounters at chokepoints force players to either fight through or find alternate routes.

### PvE Encounter Examples

These are illustrative — the specific encounter types are TBD:

| Encounter | Weapon | HP | Behavior |
|---|---|---|---|
| Sentry Turret | Rifle (range 0–1, noise 3) | Low | Fires at anyone on or adjacent to its node. Stationary. |
| Patrol Drone | SMG (range 0–1, noise 2) | Low | Moves between 2 adjacent nodes on a fixed route. |
| Guard | Shotgun (range 0, noise 3) | Medium | Defends a single node aggressively. |
| Heavy | LMG (range 0–1, noise 5) | High | High damage, slow. Located at high-value loot nodes. |

### Same Ruleset Principle

Both Shadow Players and PvE encounters follow the same combat rules as human players:
- Same damage/HP/accuracy mechanics.
- Same ammo consumption (for Shadow Players; PvE encounters may have unlimited ammo — TBD).
- Same visibility and noise rules.

This means players never have to learn a separate "PvE combat system." If you know how PvP works, you know how PvE works. The only difference is AI decision-making quality and predictability.
