# Core Loop

The game follows a repeating loop: select a shell, build a loadout, pick a contract, enter a raid, survive, extract.

## 1. Shell Selection

Players choose a **shell variant** for the raid — a printed biological body with unique abilities. All shells share identical base stats; the choice defines your passive ability, active ability, and core modification. Players can equip one **core** per shell to customize how abilities function. Shells and cores are persistent (not lost on death). See [Shells](./shells.md).

## 2. Collection & Loadout

Players have a persistent card collection. Before each raid, they select cards from their collection to form a **loadout** (their hand for the raid). These cards are **at risk** — if the player dies during the raid, the cards are permanently lost from their collection. All cards work in all shells — there are no shell-based card restrictions.

The loadout decision is the first layer of risk:
- Bring powerful weapons? High combat effectiveness, but devastating if lost.
- Go in light (knife + minimal gear)? Low risk, but harder to survive encounters.
- Stack ammo for one strong weapon? Efficient but inflexible.

Cards are **stabilized gear** — equipment treated with Zone-derived compounds that let them function inside the Zones. This is why they're valuable and why losing them hurts: you lose both the equipment and the stabilization investment. See [Lore Overview — Stabilization](./lore-overview.md#stabilization).

## 3. Contract Selection

Players optionally select a **faction contract** before deploying. Contracts provide objectives, narrative framing, and faction rewards. Players can also deploy independent (no contract). See [Factions](./factions.md).

## 4. Queue & Matchmaking

Players hit "Deploy" to enter the matchmaking queue. The server runs on a **short timer** (10–15 seconds) rather than waiting for a target player count. When the timer fires, all currently queued players are placed into a raid together. This could be 1 player or several.

If the lobby is underpopulated, **Shadow Players** (AI that mimic real players) fill the gap. See [AI Systems](./ai-systems.md).

## 5. The Raid

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

## 6. Extraction

Extraction points are **boundary seams** — weak points in the Zone's edge where RECLAM engineers have built stabilized corridors back to the clean world. Extraction takes time (the stabilization field must cycle) and can be interrupted by combat. See [Lore Overview — Extraction Points](./lore-overview.md#extraction-points--boundary-seams).

## 7. Death

If a player's HP reaches 0, their shell is destroyed and they are eliminated:
- All **loadout cards** are permanently destroyed (removed from their collection).
- All **loot cards** found during the raid are lost.
- The player's remaining cards drop on the node where they died, available for other players to loot.
- The player's **shell and core are NOT lost** — these are persistent collection items.

The player's consciousness is safe at the printing facility. A new shell can be printed. But the gear is gone. See [Lore Overview — Shells](./lore-overview.md#shells--printed-operators).

**Exception:** Revenant shells enter Dead Sprint on lethal damage instead of dying immediately. See [Shells — Revenant](./shells.md#revenant--the-one-that-doesnt-stay-dead).

## 8. Post-Raid

After extraction (or death), the player sees a summary:
- Cards they extracted with (loadout cards return to collection + loot cards are added permanently).
- Net gain or loss.
- **Faction contract results** — objectives completed, standing earned, debrief text.
- The player returns to the shell/loadout/contract screen for the next raid.

## Resource Depletion Arc

The raid has a natural tension arc driven by hand depletion:

- **Early raid**: Full hand, strong, confident. Push deeper.
- **Mid raid**: Hand is thinner from combat and utility use. Each card play is a harder choice.
- **Late raid**: Running low on ammo and consumables. Every decision is agonizing — extract now or push one more node?

This mirrors the extraction shooter experience of feeling progressively more vulnerable the longer you stay in a raid.
