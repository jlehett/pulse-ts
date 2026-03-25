# Matchmaking

The game is **online-only**. All raids are hosted on the server and entered through the matchmaking system.

## Design Principle: No Waiting

The matchmaking system is designed around the assumption that the player population may be very small (potentially a single player). It should **never** make a player wait for a full lobby. The system starts raids on a timer, not a headcount.

## Queue Flow

1. **Player hits "Deploy"** — They enter the matchmaking queue with their selected loadout.
2. **Short timer starts (or is already running)** — The server maintains a rolling matchmaking timer (10–15 seconds). If a timer is already counting down when the player joins, they join the existing countdown.
3. **Timer fires** — All players currently in the queue are placed into a new raid session together.
4. **Session spins up** — The server generates (or selects) a map, places players at spawn nodes, and populates the raid with Shadow Players and PvE encounters as needed.

## Lobby Sizing

| Players in Queue | Behavior |
|---|---|
| 1 | Raid starts with 1 human + Shadow Players filling the rest. |
| 2–4 | Ideal range. Shadow Players may or may not fill remaining slots depending on target lobby size. |
| 5+ | All humans placed in the same raid. Shadow Players may be reduced or absent. |

The **target lobby size** (total players including Shadow Players) is TBD — likely 4–6 total entities for a well-paced raid. This number should be tuned alongside map size.

## Session Lifecycle

1. **Queue** — Players wait (briefly) in the matchmaking queue.
2. **Raid Start** — Server creates the game session. Players receive the map layout and their spawn position. Raid begins.
3. **Raid Active** — Turns proceed. Players act, fight, loot, extract, or die.
4. **Raid End** — The raid ends when:
   - All human players have extracted or died.
   - A turn limit is reached (optional — forces extraction pressure, TBD).
   - A shrinking danger zone eliminates remaining players (optional — Tarkov-style raid timer, TBD).
5. **Post-Raid** — Each player sees their results (extracted loot, lost cards, etc.) and returns to the collection screen.

## Server Architecture

The matchmaking and game session systems run **server-side** using WebSocket connections:

- **Matchmaking service**: Manages the queue and timer. Groups players into sessions.
- **Game session**: Manages a single raid — map state, turn resolution, combat, loot, extraction. Each session is independent.
- **Transport**: WebSocket (persistent connection). The existing `@pulse-ts/network` package provides WebSocket server infrastructure (`attachWsServer`, room management) that can be leveraged.

### Server Authority

The server is **fully authoritative** over game state:
- The client submits actions (move, attack, use card).
- The server validates actions, resolves the turn, and sends results.
- The client cannot modify game state directly.

This is appropriate for a turn-based game — there's no need for client-side prediction or interpolation. The server resolves each turn and broadcasts the result.

## Rating / MMR

A skill-based matchmaking rating is **TBD**. With a small player population, strict MMR matching would increase wait times unacceptably. Options:
- No MMR initially — all players queue together.
- Soft MMR that influences Shadow Player difficulty (higher-rated players face tougher AI).
- Introduce MMR matching later when the population supports it.

## Anti-Cheat Considerations

Server authority handles most cheat vectors (can't modify HP, can't see hidden players, can't fake actions). The primary remaining concern is:
- **Information cheats**: A modified client could display information the server hasn't sent (e.g., all player positions). Mitigation: the server should only send visibility-appropriate information to each client. If a player isn't visible to you, the server doesn't tell your client they exist.
