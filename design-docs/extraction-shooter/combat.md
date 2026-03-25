# Combat

Combat occurs within the unified turn system — there is no separate "combat mode." When hostile entities share a node (or are within weapon range and visible), players can target them with attacks as their turn action.

## Weapons

Weapons are persistent equipment cards. They stay in the player's hand for the entire raid and are not consumed on use. They are only lost if the player dies.

Each weapon has the following stats:

| Stat | Description |
|---|---|
| **Damage** | HP dealt on a successful hit. |
| **Ammo Type** | Which ammo stack the weapon consumes (e.g., Light, Heavy, Shells). |
| **Ammo Cost** | How many ammo units are consumed per shot. |
| **Energy Cost** | Energy spent to fire the weapon this turn. |
| **Range** | Maximum node distance at which the weapon can target (0 = same node only, 1 = adjacent, 2 = two nodes away). |
| **Accuracy** | Hit probability at each range band (array of percentages). |
| **Noise** | How far the shot reveals the player's presence (see [Visibility](./visibility.md)). |
| **Mobile** | Whether the weapon can be used in MOVE posture. |

### Weapon Examples

```
Knife
  Damage: 2  |  Ammo: None  |  Energy: 1
  Range: 0  |  Accuracy: [95]  |  Noise: 0  |  Mobile: Yes

Suppressed Pistol
  Damage: 2  |  Ammo: Light ×1  |  Energy: 1
  Range: 0–1  |  Accuracy: [85, 50]  |  Noise: 1  |  Mobile: Yes

Pistol
  Damage: 3  |  Ammo: Light ×1  |  Energy: 1
  Range: 0–1  |  Accuracy: [90, 55]  |  Noise: 2  |  Mobile: Yes

SMG
  Damage: 3  |  Ammo: Light ×2  |  Energy: 2
  Range: 0–1  |  Accuracy: [85, 65]  |  Noise: 2  |  Mobile: Maybe (TBD)

Shotgun
  Damage: 6  |  Ammo: Shells ×2  |  Energy: 2
  Range: 0  |  Accuracy: [90]  |  Noise: 3  |  Mobile: No

Assault Rifle
  Damage: 4  |  Ammo: Heavy ×2  |  Energy: 2
  Range: 0–1  |  Accuracy: [85, 75]  |  Noise: 3  |  Mobile: No

Sniper Rifle
  Damage: 6  |  Ammo: Heavy ×3  |  Energy: 3
  Range: 0–2  |  Accuracy: [60, 80, 70]  |  Noise: 4  |  Mobile: No

LMG
  Damage: 5  |  Ammo: Heavy ×3  |  Energy: 3
  Range: 0–1  |  Accuracy: [80, 60]  |  Noise: 5  |  Mobile: No
```

All values are illustrative and subject to tuning.

## Ammo

Ammo cards are consumable stacks. A single ammo card represents a pool (e.g., "Light Ammo ×6"). Each weapon shot deducts from the appropriate ammo stack. When a stack hits 0, any weapon that requires that ammo type cannot be fired until the player loots more.

Ammo types:
- **Light** — Pistols, SMGs.
- **Heavy** — Rifles, Snipers, LMGs.
- **Shells** — Shotguns.

Ammo is one of the most common loot drops, but finding the *right* type for your weapons is the tension. Looting Heavy Ammo when you're running a pistol build doesn't help — but it might help if you loot a rifle off a dead player.

## Range

Weapons can target players on distant nodes, not just the same node:

| Range Value | Meaning |
|---|---|
| 0 | Same node only (melee, shotgun). |
| 1 | Same node or one node away (most firearms). |
| 2 | Up to two nodes away (sniper-class weapons). |

Targeting at range requires **visibility** — the attacker must be able to see the target. See [Visibility](./visibility.md) for how players become visible or remain hidden.

## Accuracy & Chance

Every attack has a hit probability determined by the weapon's accuracy profile at the given range. This is the game's primary source of randomness.

```
Same node (range 0):    High accuracy, 85–95%. Close-range fights are decisive.
One node away (range 1): Moderate accuracy, 50–80%. Weapon-dependent.
Two nodes away (range 2): Lower accuracy, 45–70%. Sniper-class weapons excel here.
```

### Accuracy Modifiers

- **Moving penalty**: –15–20% when firing a Mobile weapon in MOVE posture.
- **Cover**: Some nodes provide cover bonuses that reduce incoming accuracy (see [Map & Terrain](./map-and-terrain.md)).
- **Smoke / utility cards**: Certain cards reduce incoming accuracy for one turn.

### Why Range-Based Accuracy Works

The randomness is always tied to player decisions:
- Which weapon you brought (accuracy profile).
- What range you're engaging at (positioning choices).
- Whether you're moving (posture choice).
- Whether you scouted first (information investment).

A miss doesn't feel arbitrary because the player can trace it to a decision they made. A hit at long range feels earned for the same reason.

## Mutual Kills

Because attacks resolve simultaneously, it is possible for two players to kill each other on the same turn. Both players' loot drops on their respective nodes (or the same node if they were co-located).

Mutual kills are rare at range due to accuracy probabilities (both shots need to land), but more common at close range where accuracy is high. This reinforces the risk of close-quarters combat.

## Melee: The Fallback

Every player should have access to a basic **Knife** that is:
- Never at risk (not lost on death — it's a permanent default card).
- Infinite use, no ammo cost.
- Low damage, range 0, silent (noise 0), mobile.
- The "hatchet run" equivalent: your absolute fallback when you have nothing else.

## Damage & HP

Players have an **HP pool for the entire raid**, not per-encounter. Damage taken in one fight carries into the next. This creates attrition pressure — another reason to extract early rather than push deeper.

Healing is possible via consumable cards (medkits), but these are limited and must be part of the loadout or looted during the raid.

## Armor

Armor is a persistent equipment card (like weapons). It absorbs a fixed amount of damage before breaking. Armor absorbs damage before HP is reduced.

Armor does not regenerate during a raid — once broken, it's gone unless the player loots a new armor card.
