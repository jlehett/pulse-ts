# Turn System

All players act simultaneously each turn. No one sees what others chose until the server resolves the turn.

## Turn Structure

Each turn has two parts:

1. **Planning** (all players simultaneously, 30-second timer) — Each player selects their action and any cards to play. When the timer expires (or all players have submitted), planning ends.

2. **Resolution** (server-driven) — The server processes all submitted actions simultaneously and broadcasts results to all players.

## Posture: HOLD vs. MOVE

Each turn, a player implicitly adopts one of two postures based on their chosen action:

### HOLD

The player stays on their current node. They get full access to their energy pool and can play any cards — weapons, defense, utility, extraction.

### MOVE

The player moves to an adjacent node. They still get their energy pool, but with restrictions:
- **Mobile weapons only** (e.g., pistol, knife) — heavier weapons cannot be used while moving.
- **Accuracy penalty** on any weapon used (–15–20% across all range bands).
- **Defensive and utility cards** can be used freely (shields, heals, etc.).

This creates a meaningful tradeoff: moving gives you repositioning but limits your offensive capability. Holding ground gives full firepower but makes you predictable.

### Arriving on a Node

When a player moves to a new node, they arrive in MOVE posture. This means:
- They cannot fire non-Mobile weapons on the turn they arrive.
- They must survive one turn before they can use heavy weapons.
- This prevents alpha-striking — you can't sprint into a room and immediately unload a shotgun.

This is particularly important for **third-partying**: a player who moves into an ongoing fight arrives exposed and limited for one turn before becoming a full threat.

## Energy

Each turn, players receive a fixed amount of energy (exact number TBD — likely 3 or 4). Energy is **use-it-or-lose-it** — it does not carry over between turns. Unspent energy is wasted.

Energy is spent to play cards during the planning phase. The energy budget forces choices:
- Fire a heavy weapon (2–3 energy) and have little left for defense.
- Fire a light weapon (1 energy) and also heal or shield.
- Go all-in on utility (scout + heal) without attacking.

## Resolution Order

When the server resolves a turn, actions are processed in this order:

1. **Defensive cards resolve** — Shields, armor activation, damage reduction from all players.
2. **Utility cards resolve** — Heals, scout drones, traps placed, smoke grenades.
3. **Attacks resolve** — All damage is applied simultaneously against the defensive state from step 1. Two players attacking each other both deal damage — you cannot kill someone "first" to avoid their shot.
4. **Movement resolves** — All moving players arrive at their destinations.
5. **PvE triggers** — Newly arrived players at PvE encounter nodes have the encounter queued for next turn (arrival delay).
6. **Extraction ticks** — Extraction progress increments for players who chose extraction.
7. **Death check** — Any player at 0 HP is eliminated. Their cards drop on their node.
8. **Visibility update** — Each player's visibility radius is recalculated based on what they did this turn (see [Visibility](./visibility.md)).

## Disengagement

Since turns are simultaneous, disengagement is a **blind decision**. Neither player knows if the other will fight or flee.

| Player A | Player B | Result |
|---|---|---|
| Attack | Attack | Both take damage. Both stay on node. |
| Attack | Move (flee) | A's attack hits B (disengage penalty). B escapes to their chosen node. |
| Move (flee) | Attack | B's attack hits A. A escapes. |
| Move (flee) | Move (flee) | Both leave, no damage. They may go to the same or different nodes. |
| Utility | Attack | B's attack hits A. A's utility resolves (heal, shield, etc.). Both stay. |
| Attack | Utility | A's attack hits B. B's utility resolves. Both stay. |

There is **no pursuit mechanic**. If a player flees, the other player can try to follow next turn — but they must guess which adjacent node the fleeing player moved to. The fleeing player chooses the terrain; the pursuer is guessing.

This creates a prisoner's dilemma every turn that players share a node: fight or flight, committed blind.

## Turn Timer

- **30 seconds** for the planning phase.
- If a player doesn't submit before the timer, they default to HOLD with no cards played (they do nothing).
- The timer keeps pace up and prevents stalling.
