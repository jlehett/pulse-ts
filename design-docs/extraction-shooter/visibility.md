# Visibility

Visibility determines whether a player can be seen (and therefore targeted) by other players. It is **dynamic** — a player's visibility radius changes each turn based on the actions they took.

## Core Concept

Every player has a **visibility radius** that represents how far away other players can detect them, measured in node distance. A visibility of 0 means the player is only detectable by others on the same node. A visibility of 4 means players up to 4 nodes away receive some information about their presence.

Visibility is a **consequence of actions**, not a persistent stat. Staying quiet keeps you hidden. Acting reveals you. Every decision in the game carries an information cost.

## Action-Based Visibility

A player's visibility radius after a turn is determined by the most "visible" action they took that turn:

| Action | Base Visibility | Notes |
|---|---|---|
| Held position, did nothing | 0 | Invisible beyond same node. Crouching in a corner. |
| Used quiet utility (heal, shield) | 0 | Minimal exposure. |
| Used noisy utility (scout drone) | 1 | Some noise from deployment. |
| Moved into a node | 1 | Footsteps. Adjacent players sense arrival. |
| Looted | 1–2 | Rummaging takes time and makes noise. |
| Fired a weapon | Weapon's Noise stat | The primary visibility driver. See below. |

If multiple actions are taken in one turn (e.g., fire a weapon + use a medkit), the **highest visibility value** applies.

## Weapon Noise Profiles

Each weapon has a **Noise** stat that determines how far the shot is detectable:

| Weapon | Noise | Reasoning |
|---|---|---|
| Knife | 0 | Silent. |
| Suppressed Pistol | 1 | Quiet but not invisible. |
| Pistol | 2 | Standard gunshot. |
| SMG | 2–3 | Rapid fire, carries further. |
| Rifle | 3 | Loud, echoes. |
| Shotgun | 3 | Thunderous but doesn't carry as far as rifle caliber. |
| Sniper Rifle | 4 | Echoes across the map. |
| LMG | 4–5 | Unmistakable. Everyone in a wide radius knows. |

### Suppressors

Suppressors could exist as **attachment cards** that modify a weapon's noise stat (e.g., –1 or –2 noise). This adds a loadout decision: a Suppressed Rifle (noise 1 instead of 3) does slightly less damage but keeps you far more hidden. Suppressors take up a card slot in the loadout, so bringing one means leaving something else behind.

## Terrain Modifiers

Nodes on the map can modify a player's outgoing visibility:

### Dampening Terrain (reduces visibility)

| Terrain | Modifier | Effect |
|---|---|---|
| Dense Forest | –1 | Muffles sound. A rifle shot (noise 3) registers as 2. |
| Cave / Underground | –2 | Nearly soundproof. Fights here are hard to detect from outside. |
| Bunker | –2 | Enclosed, insulated. |

### Amplifying Terrain (increases visibility)

| Terrain | Modifier | Effect |
|---|---|---|
| Open Field | +1 | Sound carries. Fully exposed. |
| Ridgeline | +1 | Elevated and exposed. |
| Water / Metal Structure | +1 | Footsteps and impacts echo. Even movement is louder. |

A player's effective visibility for a turn is: `max(0, base_visibility + terrain_modifier)`.

## Detection Tiers

What a receiving player actually perceives depends on how close they are to the source relative to the source's visibility radius:

### Edge of Visibility Radius (max range)

- Vague, non-directional information.
- Gunshot: "You hear a distant gunshot." No direction, no weapon type.
- Movement: "You hear faint footsteps nearby." No direction.

### One Node Inside Visibility Radius

- Directional information with some detail.
- Gunshot: "Gunfire to the north — sounds like a rifle." Direction + weapon class.
- Movement: "Movement detected at [adjacent node name]." Specific node identified.

### Same Node

- Full visibility. The player is seen. They can be targeted by any weapon.
- Their posture, actions, and presence are known.

This information gradient means awareness is **progressive**. You hear something vague, move closer to investigate, get more detail, then decide whether to engage. This mirrors the audio-based situational awareness loop in extraction shooters.

## Interaction With Scouting

Scout cards (e.g., Scout Drone) **bypass the visibility system entirely**. A scout reveals all occupants of a target node regardless of their current visibility radius. A player sitting at visibility 0, perfectly hidden, is revealed by a scout.

This makes scouting the **hard counter to stealth builds** and gives scout cards high strategic (and trade) value. It also means scouting is a form of "spending a card to gain information" — a clear, fair cost.

## Emergent Stealth vs. Aggression

The visibility system naturally creates a spectrum of playstyles without requiring a class system:

- **Low-noise loadouts** (knife, suppressed weapons, dampening terrain) allow near-invisible play but sacrifice damage output.
- **High-noise loadouts** (rifle, sniper, LMG) are powerful but constantly broadcast their position, inviting third-parties and counter-play.
- **Information-focused loadouts** (scout drones, traps) let players hunt others by tracking their noise signatures and scouting likely positions.

The core tension: **power costs visibility, and visibility invites danger.**
