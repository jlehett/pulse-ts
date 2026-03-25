# Core Loop

The game follows a repeating loop: build a loadout, enter a raid, survive, extract.

## 1. Collection & Loadout

Players have a persistent card collection. Before each raid, they select cards from their collection to form a **loadout** (their hand for the raid). These cards are **at risk** — if the player dies during the raid, the cards are permanently lost from their collection.

The loadout decision is the first layer of risk:
- Bring powerful weapons? High combat effectiveness, but devastating if lost.
- Go in light (knife + minimal gear)? Low risk, but harder to survive encounters.
- Stack ammo for one strong weapon? Efficient but inflexible.

## 2. Queue & Matchmaking

Players hit "Deploy" to enter the matchmaking queue. The server runs on a **short timer** (10–15 seconds) rather than waiting for a target player count. When the timer fires, all currently queued players are placed into a raid together. This could be 1 player or several.

If the lobby is underpopulated, **Shadow Players** (AI that mimic real players) fill the gap. See [AI Systems](./ai-systems.md).

## 3. The Raid

The raid takes place on a **node-graph map** — a network of interconnected locations. See [Map & Terrain](./map-and-terrain.md).

Players navigate the map simultaneously, choosing actions each turn:
- Move between nodes
- Attack other players (within weapon range and visibility)
- Use utility cards (heal, scout, set traps)
- Loot nodes for new cards
- Engage PvE encounters
- Begin extraction at designated extraction points

All turns are **simultaneous and blind** — every player commits their action without seeing what others chose. See [Turn System](./turn-system.md).

**Loot cards go directly into the player's hand** and can be used immediately during the raid. But if the player dies, all loot is lost along with the loadout.

## 4. Extraction

Extraction points are specific nodes on the map. A player must spend multiple turns at an extraction point to extract. Extraction can be interrupted by combat. Successfully extracting ends the raid for that player.

## 5. Death

If a player's HP reaches 0, they are eliminated:
- All **loadout cards** are permanently destroyed (removed from their collection).
- All **loot cards** found during the raid are lost.
- The player's remaining cards drop on the node where they died, available for other players to loot.

## 6. Post-Raid

After extraction, the player sees a summary:
- Cards they extracted with (loadout cards return to collection + loot cards are added permanently).
- Net gain or loss.
- The player returns to the collection screen to build a new loadout for the next raid.

## Resource Depletion Arc

The raid has a natural tension arc driven by hand depletion:

- **Early raid**: Full hand, strong, confident. Push deeper.
- **Mid raid**: Hand is thinner from combat and utility use. Each card play is a harder choice.
- **Late raid**: Running low on ammo and consumables. Every decision is agonizing — extract now or push one more node?

This mirrors the extraction shooter experience of feeling progressively more vulnerable the longer you stay in a raid.
