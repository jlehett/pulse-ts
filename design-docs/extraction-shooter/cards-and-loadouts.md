# Cards & Loadouts

## The Hand-as-Loadout Model

There is **no deck and no draw mechanic**. The cards a player selects for their loadout before the raid ARE their hand for the entire raid. Every card is always accessible — the tension is not "did I draw the right card" but "do I spend this card now or save it for later?"

This means:
- No draw RNG during the raid. All decisions are deliberate.
- Cards played during the raid are consumed (ammo depletes, consumables are used up).
- Loot cards found during the raid go into the hand immediately and can be used right away.
- If the player extracts, all remaining cards (loadout + loot) return to / join their collection.
- If the player dies, all cards (loadout + loot) are lost. Loadout cards are destroyed; remaining cards drop as loot on the death node.

## Card Categories

### Weapons (Persistent Equipment)

Weapons stay in hand for the entire raid and are not consumed on use. They are only lost on death.

See [Combat — Weapons](./combat.md#weapons) for full stat definitions and examples.

Key weapon stats: Damage, Ammo Type, Ammo Cost, Energy Cost, Range, Accuracy (per range band), Noise, Mobile.

### Armor (Persistent Equipment, Durability)

Armor cards absorb a fixed amount of damage before breaking. They are persistent (like weapons) but have limited durability:
- Each point of incoming damage reduces armor durability by 1.
- When durability hits 0, the armor card is destroyed.
- Armor does not regenerate during a raid.

Example:
```
Light Vest
  Durability: 4  |  Energy: 0 (passive)
  Rarity: Common

Heavy Plate
  Durability: 8  |  Energy: 0 (passive)
  Rarity: Rare
  Note: May reduce movement options or have other tradeoffs (TBD).
```

### Ammo (Consumable Stacks)

Each ammo card represents a stack of a specific ammo type. Firing a weapon deducts from the matching stack.

Ammo types:
- **Light** — Used by pistols, SMGs.
- **Heavy** — Used by rifles, snipers, LMGs.
- **Shells** — Used by shotguns.

Example:
```
Light Ammo
  Stack: ×6  |  Type: Light  |  Rarity: Common

Heavy Ammo
  Stack: ×4  |  Type: Heavy  |  Rarity: Common

Shells
  Stack: ×3  |  Type: Shells  |  Rarity: Uncommon
```

When all stacks of a given ammo type are empty, weapons requiring that type cannot fire.

### Consumables (Single-Use)

Used once and discarded. These are the utility cards that provide tactical flexibility.

Examples:
```
Medkit
  Effect: Restore 3 HP  |  Energy: 1  |  Rarity: Common

Scout Drone
  Effect: Reveal all occupants of a target node (bypasses visibility)
  Energy: 1  |  Range: 1–2 nodes  |  Rarity: Uncommon

Smoke Grenade
  Effect: Reduce incoming accuracy by 20–30% on your node for 1 turn
  Energy: 1  |  Rarity: Common

Trap
  Effect: Place on current node. Next player to arrive takes X damage.
  Energy: 2  |  Rarity: Uncommon
```

### Extraction Tools (Single-Use)

Cards that speed up or aid the extraction process.

Examples:
```
Signal Flare
  Effect: Reduce extraction time by 1 turn  |  Energy: 1  |  Rarity: Uncommon

Extraction Kit
  Effect: Begin extraction at any node (not just extraction points)
  Energy: 2  |  Rarity: Rare
```

### Attachments (TBD)

Potential future category: cards that modify weapon stats (e.g., Suppressor reduces noise by 1–2, Extended Magazine increases ammo stack by +2). Would attach to a weapon card in the loadout.

## Card Rarity

| Rarity | Frequency in Loot | Power Level |
|---|---|---|
| Common | Frequent drops | Basic, reliable |
| Uncommon | Moderate drops | Noticeable upgrade |
| Rare | Infrequent drops | Significant advantage |
| Epic | Very rare drops | Build-defining |
| Legendary | Extremely rare | Unique effects, high risk to bring |

Higher rarity cards are more painful to lose on death, which naturally creates the extraction shooter dynamic of "do I risk my best gear?"

## Loadout Structure

**Target loadout size: 8–12 cards total.**

Whether loadouts use fixed slots (e.g., 1 primary weapon, 1 sidearm, 1 armor, rest flexible) or a fully open card-count limit is TBD. Both have merits:

- **Fixed slots** enforce build diversity (you can't bring 4 weapons) and are easier to balance.
- **Open limit** allows creative builds (all-utility, ammo-heavy, multi-weapon) and feels more like a card game.

### The Default Knife

Every player always has access to a basic **Knife** card that:
- Does not count toward the loadout card limit.
- Is never lost on death.
- Is the fallback weapon for "hatchet runs" (going in with minimal or no gear).
- Stats: 2 damage, no ammo, 1 energy, range 0, noise 0, mobile.

## Card Anatomy

```
┌─────────────────────────┐
│  ASSAULT RIFLE           │
│  ━━━━━━━━━━━━━━━━━━━━━  │
│  Type:     Weapon        │
│  Ammo:     Heavy ×2      │
│  Energy:   2             │
│  Mobile:   No            │
│  Range:    0–1           │
│  Noise:    3             │
│  Accuracy: [85, 75]      │
│  Damage:   4             │
│  Rarity:   Uncommon      │
│  ━━━━━━━━━━━━━━━━━━━━━  │
│  Reliable. Loud.         │
└─────────────────────────┘
```

## Collection & Economy

How players acquire cards outside of raids (shop, crafting, card packs, starter collection) is **TBD**. Key considerations:
- New players need a viable starter collection that lets them participate immediately.
- The economy must support the loss-on-death loop without feeling punishing to the point of frustration.
- "Hatchet runs" (knife only, zero risk) should always be viable as a way to rebuild after losses.
