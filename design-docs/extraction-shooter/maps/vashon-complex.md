# Vashon Complex — Synthesis Zone

**Pre-Imprint:** Vashon Chemical Processing — a mid-sized industrial chemical plant on the outskirts of a port city. Produced petrochemical derivatives, industrial solvents, and pharmaceutical precursors. Employed ~400 workers. Operated 24/7 across three shifts.

**Post-Imprint:** The Architect converted Vashon into a **Synthesis Zone** — a material production facility that manufactures compounds used by other Zones in the relay's construction. The original machinery has been repurposed. Tanks that held solvents now contain living bioluminescent fluid. Pipe networks that moved chemicals now circulate substances that don't appear on any periodic table. The production lines still run, but what they produce serves the Architect's purpose, not human industry.

**Zone Function:** Synthesis. Vashon produces stabilization compounds (valuable to Runners) and exotic materials that are transported to other Zones. This makes it one of the most profitable Zones to run — and one of the most actively maintained by the Architect's systems.

**Map Identity:** Industrial, loud, dangerous. Metal surfaces create amplifying terrain throughout the interior PoIs. Production processes generate ambient noise that masks movement in some areas but creates unpredictable visibility spikes in others. The Zone *works* — players can see and hear the machinery operating, feel the rhythm of production cycles. Vashon isn't a ruin. It's a factory with new management.

---

## Map Overview

**Total nodes:** 68
**PoIs:** 5 (32 PoI nodes)
**Connective terrain:** 36 nodes
**Extraction points:** 3
**Spawn points:** 4 (distributed around the map perimeter)
**Max diameter:** 11 hops
**Player count:** 4–6 (with Shadow Players filling gaps)

### Layout

```
                            [EXFIL: North Gate]
                                    |
                            [Cooling Basins] ──── north connective ────┐
                               /        \                              |
                    ┌── west connective   central connective ──────────┤
                    |          |                  |                     |
              [Lab Wing] ── [THE CRUCIBLE] ── east connective ── [Control Nexus]
                    |          |                  |                     |
                    ├── sw connective     south connective ────────────┘
                    |                            |
          [EXFIL: West Seam]             [Storage Yard]
                                               |
                                     [EXFIL: South Dock]
```

The Crucible sits at the center — the most valuable and most dangerous PoI. Four other PoIs surround it at varying distances. Three extraction points sit at the map edges, requiring players to move outward from the high-value center.

---

## Points of Interest

### 1. The Crucible (Central — 8 nodes)

The heart of Vashon's production. A massive open-plan processing hall where the primary synthesis occurs. Pre-Imprint, this was the main reactor building — a multi-story structure housing catalytic crackers, distillation columns, and mixing vats. The Imprint kept the bones and rewired everything inside.

**Layout:**

```
[Gantry Overlook]
       |
[East Entrance] ── [Main Processing Floor] ── [West Entrance]
                          |           \
                    [Mixing Vats]    [Pipe Junction]
                          |                |
                    [Reactor Core]   [Overflow Chamber]
                                          |
                                    [Deep Tank]
```

**Entries:** 3 — East Entrance, West Entrance, and a dangerous climb up to Gantry Overlook from the north connective terrain.

#### Node Details

| Node | Cover | Terrain | Loot | PvE | Notes |
|---|---|---|---|---|---|
| **East Entrance** | Partial | Metal (+1) | Common stabilization compounds | None | Wide loading door. Visible from east connective. First room most players enter. |
| **West Entrance** | Partial | Metal (+1) | Common stabilization compounds | None | Mirror of East. Connects to Lab Wing route. |
| **Main Processing Floor** | None | Metal (+1) | Uncommon stabilization compounds, ammo | **Processor Drone** (maintenance, medium HP) | The central hub. Huge open space, no cover, metal floor amplifies everything. The Processor Drone patrols in a loop — it won't chase, but it will attack anyone on its path. Avoiding it requires timing its route. |
| **Gantry Overlook** | Partial | Metal (+1) | Uncommon utility cards | None | Elevated platform above the Processing Floor. Partial cover from railings. Has sightlines down to Main Processing Floor — ranged attacks hit anyone below. Only accessible from north connective (a climb) or from Main Processing Floor (a ladder). The sniper position. |
| **Mixing Vats** | Partial | Water (+1) | Uncommon stabilization compounds | None | Rows of converted chemical vats now containing bioluminescent fluid. The fluid reacts to vibration — any combat action here generates +1 additional visibility. The vats provide partial cover but you're glowing. |
| **Pipe Junction** | Full | Standard (0) | Common ammo, consumables | None | Cramped intersection of converted pipe networks. Full cover — you can't be shot from outside — but only one connection to Overflow Chamber and one to Main Processing Floor. A bottleneck. Safe to hold, dangerous to enter if someone's inside. |
| **Reactor Core** | None | Metal (+1) | **Rare stabilization compounds, rare weapon cards** | **Core Guardian** (response, high HP) | The dead-end prize room. Pre-Imprint: the reactor housing. Now: a chamber where the primary synthesis reaction occurs. Living fluid circulates through crystalline structures that pulse with light. No cover, maximum amplification, and the Core Guardian activates when anyone enters. The best loot on the map — but the loudest, most exposed, most dangerous node. |
| **Overflow Chamber** | Partial | Water (+1) | Uncommon stabilization compounds | None | Excess fluid from the Reactor Core collects here. Ankle-deep bioluminescent liquid. The fluid dampens footstep sounds but amplifies combat noise — MOVE actions here don't generate visibility, but COMBAT actions generate +2. A stealth approach to Deep Tank. |
| **Deep Tank** | Partial | Water (+1) | **Rare Imprint artifacts** | **Maintenance Crawler** (maintenance, low HP) | The deepest node in the Crucible. A submerged processing tank only half-visible above the fluid line. Contains Imprint artifacts — exotic materials with properties Zone-unique to Vashon. The Maintenance Crawler is non-aggressive unless you loot the node — then it pursues for 3 turns, trying to return the materials. |

**Strategic Notes:**
- The Crucible is where most PvP happens. It's central, it's loud, and it has the best loot. Players converge here.
- The Main Processing Floor is a deathtrap — no cover, metal amplification, and a drone patrolling. But you *have* to cross it to reach the valuable back rooms.
- Gantry Overlook is the power position. A player with a ranged weapon on the Gantry controls the Processing Floor. But getting there requires the north approach — exposed.
- Reactor Core vs. Deep Tank is the Crucible's internal dilemma: Core has the best stabilization loot but the hardest PvE guardian and zero cover. Deep Tank has the best artifacts but requires going through Overflow Chamber and dealing with the Crawler on exit.
- Pipe Junction is the safe room. Full cover, central position. But it's a dead end if someone blocks the exits.

**Environmental Storytelling:**
- **Before:** Safety signs in faded English. A break schedule pinned to a wall, half-converted to crystalline lattice. Steel-toed boot prints in dust that transitions to organic residue.
- **Transition:** The reactor housing is half original steel, half grown crystal. The seam is visible — you can touch the line where industrial engineering becomes alien biology.
- **Function:** The crystalline structures in the Reactor Core pulse in rhythm. The fluid in the vats moves *against* gravity in places. Production reports — in Architect notation — scroll across surfaces that used to be instrument panels.

---

### 2. Cooling Basins (North — 5 nodes)

Pre-Imprint: the cooling tower complex and water treatment facility. Four massive concrete basins surrounded by pipe infrastructure. Now: the basins contain thermal regulation fluid that maintains optimal temperatures across the Zone. The fluid glows a deep amber and radiates warmth. The air above the basins shimmers with heat distortion.

**Layout:**

```
[Pump Station] ── [Basin Walkway] ── [North Basin]
                        |
                  [Central Basin]
                        |
                  [Filtration Room]
```

**Entries:** 2 — Pump Station connects to north connective terrain. Basin Walkway has a secondary connection to central connective terrain toward the Crucible.

#### Node Details

| Node | Cover | Terrain | Loot | PvE | Notes |
|---|---|---|---|---|---|
| **Pump Station** | Partial | Metal (+1) | Common ammo | None | Entry node. Converted pump machinery — large, industrial, provides partial cover behind equipment. The ambient hum of pumps masks quiet actions — HOLD here generates 0 visibility regardless of terrain modifier. |
| **Basin Walkway** | None | Water (+1) | Common stabilization compounds | None | Narrow walkways between the basins. No cover — you're exposed on a catwalk over glowing fluid. Connects to both basins and has secondary entry from central connective. The hub of the PoI and its most dangerous node. |
| **North Basin** | None | Water (+1) | Uncommon thermal compounds (Vashon-specific) | **Thermal Regulator** (maintenance, medium HP) | The largest basin. Fluid surface glows amber. The Thermal Regulator floats in the basin, maintaining temperature. It's not aggressive — it only attacks if you loot the node or enter the fluid (which some paths require). Thermal compounds are Vashon-unique stabilization materials worth premium trade value. |
| **Central Basin** | Partial | Water (+1) | Uncommon thermal compounds | None | Smaller basin with scaffolding providing partial cover. The scaffolding is pre-Imprint maintenance infrastructure — ladders, walkways, tool racks half-converted to Zone material. Less loot than North Basin but safer to access. |
| **Filtration Room** | Full | Standard (0) | **Rare thermal compounds** | None | Underground room beneath the basins where fluid is processed before recirculation. Full cover — concrete walls on all sides. Contains the rarest thermal compounds in the PoI. But it's a dead end with one exit to Central Basin. If someone is on Central Basin when you're in Filtration Room, you're trapped. |

**Strategic Notes:**
- Cooling Basins is the map's northern PoI and the closest to the North Gate extraction. Players heading to North Gate almost always pass through or near the Basins.
- The loot is Vashon-specific thermal compounds — premium stabilization materials that sell for more than standard compounds. Worth the detour.
- The PoI is exposed. Water terrain amplifies visibility, and the walkways have no cover. Fighting here is loud and visible from the connective terrain.
- Filtration Room is the dead-end trap. Great loot, full cover, but one exit. Experienced players avoid it unless they're certain nobody's following.
- The Thermal Regulator is passive until provoked — a smart player can loot Central Basin and leave North Basin untouched, avoiding the fight entirely.

**Environmental Storytelling:**
- **Before:** Faded "NO SWIMMING" signs. A safety chain across one walkway, still intact. Concrete surfaces with water staining patterns that stopped thirty years ago — the new fluid doesn't stain the same way.
- **Transition:** The basin walls are original concrete on top, grown crystal on the bottom. The fluid line marks the exact boundary of conversion. Below the line, the basins aren't concrete anymore — they're alive.
- **Function:** The fluid circulates in patterns that correspond to production cycles in the Crucible. When the Crucible's output increases, the basins glow brighter. The thermal regulation is visible and rhythmic — players can learn to read the basins' color as an indicator of Crucible activity.

---

### 3. Control Nexus (East — 6 nodes)

Pre-Imprint: the administrative and process control building. Office spaces, a server room, a control center with screens monitoring every process in the plant. Now: the screens still display data, but in Architect notation. The servers process information that has nothing to do with chemical production. The offices have been converted into data-processing nodes — desks replaced by crystalline computing substrates.

**Layout:**

```
[Reception] ── [Main Corridor] ── [Control Center]
     |                |
[Office Wing]   [Server Room]
                      |
                [Archive Vault]
```

**Entries:** 2 — Reception connects to east connective terrain. Main Corridor has a secondary connection to central connective terrain.

#### Node Details

| Node | Cover | Terrain | Loot | PvE | Notes |
|---|---|---|---|---|---|
| **Reception** | Partial | Standard (0) | Common consumables | None | Former lobby. Half-converted furniture provides cover. The front desk is crystalline now but still recognizable. A safe entry point — standard terrain, partial cover. |
| **Main Corridor** | None | Standard (0) | Common ammo | **Watcher** (response/passive, low HP) | Long corridor connecting all rooms. No cover — it's a hallway. The Watcher sits at the corridor's midpoint. It doesn't attack — it *observes*. When the Watcher detects a player, it sends a signal that activates the Reclaimer in the Archive Vault. Killing the Watcher silently (one-shot, no combat noise) prevents the Reclaimer from activating. Missing the kill or using a loud weapon triggers the alert. |
| **Office Wing** | Partial | Standard (0) | Uncommon data fragments, consumables | None | Converted offices. Cubicle partitions (some crystalline, some original) provide partial cover. This is the primary data fragment location on the map — lore-heavy loot. The terminals still display pre-Imprint employee records interspersed with Architect notation. |
| **Control Center** | Partial | Metal (+1) | Uncommon utility cards, data fragments | None | The operational heart of the original plant — banks of monitors, control panels, operator chairs. Now displays Zone-wide process data in real time. Metal surfaces amplify visibility. Contains utility cards and data fragments that reference other Zones (cross-Zone lore drops). |
| **Server Room** | Full | Metal (+1) | Uncommon stabilization compounds, data fragments | None | Racks of converted server hardware. Full cover — the racks create a maze of narrow aisles. Metal terrain means combat is deafening, but the full cover makes it hard to be targeted from outside. Contains mixed loot: stabilization compounds from the server cooling systems and data fragments from the storage media. |
| **Archive Vault** | Full | Standard (0) | **Rare data fragments, rare utility cards** | **Reclaimer** (response/active, high HP) — dormant unless Watcher triggers | Deepest room. Pre-Imprint: the secure document storage. Now: a crystalline data archive where the Zone stores operational logs. Full cover, dead end, best loot in the PoI. The Reclaimer is dormant unless the Watcher in Main Corridor sends an alert. If activated, the Reclaimer pursues toward Archive Vault to recover materials. If the Watcher is killed silently, the Reclaimer stays dormant for the entire raid — the Archive is unguarded. |

**Strategic Notes:**
- Control Nexus is the data PoI. Data fragments are concentrated here, making it essential for lore-hunters and Edda contract runners.
- The Watcher/Reclaimer relationship is the PoI's central puzzle. Players who learn the map know: kill the Watcher quietly, and the Archive is free. Get spotted or use a loud weapon, and you're fighting a high-HP Reclaimer in a dead-end room.
- Server Room is the safe loot option — full cover, decent loot, no PvE. But it's adjacent to Archive Vault, so if the Reclaimer activates, it passes through Server Room on its patrol.
- Control Center contains cross-Zone data fragments — lore items that reference Lachesis, Ward 17, and other Zones. These are how Edda's priority contract chain builds the cross-Zone narrative.
- The PoI is quieter than the Crucible. Standard terrain in most rooms, no water or excessive metal. Fights here are more contained.

**Environmental Storytelling:**
- **Before:** Employee of the Month photos on the wall, faces half-obscured by crystal growth. A motivational poster ("SAFETY IS EVERYONE'S RESPONSIBILITY") that's been seamlessly integrated into a data display surface — the poster's text is now interspersed with Architect notation, as if the Imprint treated it as data.
- **Transition:** The server racks are the clearest transition point. Bottom half: original Dell/HP hardware with blinking lights. Top half: crystalline computing substrates that pulse in synchronization. The transition line is perfectly horizontal, as if the Imprint rose like water.
- **Function:** The monitors in Control Center display process flows for the entire Zone. A player who studies them across multiple raids can learn to predict production surges, thermal fluctuations, and transport entity routes. This information is useful but requires investment to decode.

---

### 4. Storage Yard (South — 7 nodes)

Pre-Imprint: the tank farm and shipping warehouse. Rows of massive cylindrical storage tanks, a loading dock for tanker trucks, and a warehouse for packaged products. Now: the tanks store synthesized materials waiting for transport to other Zones. The warehouse has been converted into a staging area where materials are packaged into forms compatible with the relay's inter-Zone logistics.

**Layout:**

```
                  [Tank Row East]
                  /             \
[Loading Dock] ── [Central Lane] ── [Tank Row West]
                        |
                  [Warehouse Floor]
                  /             \
      [Shipping Bay]       [Staging Area]
```

**Entries:** 3 — Loading Dock from south connective terrain, Tank Row East from east connective, Tank Row West from a secondary path near the west connective terrain. The most accessible PoI on the map.

#### Node Details

| Node | Cover | Terrain | Loot | PvE | Notes |
|---|---|---|---|---|---|
| **Loading Dock** | Partial | Standard (0) | Common ammo, consumables | None | Open-air dock where tanker trucks once loaded. Concrete platforms and converted loading equipment provide partial cover. The most common entry point. Close to South Dock extraction — many players treat this as a grab-and-go stop. |
| **Central Lane** | None | Open Field (+1) | Common stabilization compounds | None | Wide paved road between the tank rows. Completely exposed — no cover, amplifying terrain. Moving through Central Lane is fast but visible. The shortcut through the PoI that everyone can see you take. |
| **Tank Row East** | Partial | Metal (+1) | Uncommon stabilization compounds | **Material Carrier** (transport, medium HP) | Narrow spaces between massive converted tanks. Partial cover from tank walls. The Material Carrier moves on a fixed route between Tank Row East and Tank Row West, passing through Central Lane. It's a transport entity — large, fast, on a schedule. It doesn't hunt you, but if you're on its path when it passes, you take heavy collision damage. Learning its timing is key. |
| **Tank Row West** | Partial | Metal (+1) | Uncommon stabilization compounds | None | Mirror of Tank Row East. Same cover, same terrain. The Material Carrier's other endpoint. Contains a **Weaver dormant connection** to Warehouse Floor — a maintenance hatch that was sealed during the conversion. |
| **Warehouse Floor** | Partial | Standard (0) | Uncommon ammo, utility cards | None | Open warehouse space with converted shelving and packaging equipment. Partial cover from shelving units. General-purpose loot — ammo and utility cards rather than stabilization compounds. A good resupply stop. |
| **Shipping Bay** | None | Metal (+1) | Uncommon stabilization compounds, consumables | None | Former truck bay, now a materials staging point. No cover — it's a wide open bay door. Contains processed stabilization compounds ready for "shipment." Near the South Dock extraction, making it a common last stop before exfil. |
| **Staging Area** | Partial | Standard (0) | **Rare stabilization compounds, rare Imprint artifacts** | **Packaging Drone** (maintenance, low HP) | The deep room where the Zone packages materials for inter-Zone transport. Partial cover from packaging machinery. Contains the PoI's best loot — but the Packaging Drone works here continuously. It's low HP but fights back when interrupted. The packaging machinery itself is a narrative prop: players can watch materials being compressed, sealed, and loaded onto transport entities. The materials are *going somewhere*. |

**Strategic Notes:**
- Storage Yard is the "easy" PoI — most accessible, three entry points, moderate PvE, good general loot. It's where new players learn the game.
- The Material Carrier is the PoI's signature hazard. It moves on a timed schedule between the tank rows. Players must learn the timing or risk getting hit. It doesn't chase — it just moves, and you're in the way.
- Central Lane is the trap. Fast route through the PoI but completely exposed. Experienced players use Tank Row East/West to move through with partial cover.
- Staging Area is worth visiting for rare loot, but the Packaging Drone and the dead-end position make it risky.
- Three entries mean Storage Yard is hard to control. Multiple players can be in the PoI simultaneously without knowing it.

**Environmental Storytelling:**
- **Before:** Faded HAZMAT placards on the tanks (FLAMMABLE LIQUID, CLASS 3). A clipboard with a half-finished shipping manifest, ink faded, paper turning crystalline at the edges. Truck tire tracks in concrete that end at a wall of Zone material — the truck was there when the Imprint hit.
- **Transition:** The tanks themselves are the starkest transition. Original steel cylinders on the outside, but cut open (some are damaged), the interior is biological. The metal shell is a cocoon around something alive.
- **Function:** The Staging Area is where the Zone's purpose is most visible. Players can watch the packaging process in real time: raw materials arrive, are compressed into dense geometric forms, and are loaded onto transport entities that carry them out of the PoI toward other Zones. The materials are labeled in Architect notation. A data fragment found here translates one label as a destination code — the first hint that Zones send materials to each other.

---

### 5. Lab Wing (West — 6 nodes)

Pre-Imprint: the quality control laboratory and R&D wing. Clean rooms, gas chromatographs, mass spectrometers, fume hoods. Where Vashon tested its products and developed new formulations. Now: the instruments have been repurposed for Zone-specific analysis. The clean rooms are the only spaces in the Zone where the Imprint's conversion is *incomplete* — patches of pre-Imprint environment persist, as if the Architect couldn't fully convert the sterile conditions.

**Layout:**

```
[Lab Entrance] ── [Instrument Hall] ── [Analysis Chamber]
                        |
                  [Clean Room A]
                        |
                  [Clean Room B]
                        |
                  [Specimen Vault]
```

**Entries:** 2 — Lab Entrance from west connective terrain. Instrument Hall has a secondary connection to the Crucible's West Entrance through a converted corridor.

#### Node Details

| Node | Cover | Terrain | Loot | PvE | Notes |
|---|---|---|---|---|---|
| **Lab Entrance** | Partial | Standard (0) | Common consumables | None | Converted airlock — the original lab required contamination controls, and the Imprint preserved the structure. Partial cover from decontamination equipment. A safe entry point. |
| **Instrument Hall** | Partial | Metal (+1) | Uncommon utility cards, data fragments | None | Long room lined with converted analytical instruments. The instruments still function — scanning, measuring, analyzing — but what they're measuring isn't human chemistry. Metal surfaces from the equipment amplify visibility. Contains data fragments that describe the Zone's production output in scientific terms — the most technically detailed lore drops on the map. |
| **Analysis Chamber** | None | Metal (+1) | Uncommon stabilization compounds | **Analyzer** (maintenance, low HP) | Former sample prep room. Now an active analysis station where the Zone tests its own output. No cover. The Analyzer entity runs continuous tests — it's essentially a robotic lab technician. Low HP, not particularly dangerous, but it generates visibility when it operates (loud machinery). Killing it stops the noise. |
| **Clean Room A** | Partial | Standard (0) | Uncommon medical consumables | None | One of the only partially un-Imprinted spaces in any Zone. The sterile environment resisted full conversion. Original white walls are visible beneath patchy crystalline growth. Medical consumables spawn here — items derived from pharmaceutical precursors that the Imprint couldn't fully convert. These are unique to Lab Wing. |
| **Clean Room B** | Full | Dampening (-1) | **Rare medical consumables, rare utility cards** | None | Deeper clean room. The Imprint's conversion is even less complete here — almost entirely original pre-Imprint environment. Dampening terrain (the sterile conditions dampen Zone signals). Full cover from lab benches and equipment. Contains the rarest medical consumables on the map. |
| **Specimen Vault** | Full | Dampening (-1) | **Rare Imprint artifacts, anomalous items** | **Specimen** (unique entity — see below) | The deepest room in Lab Wing and one of the most dangerous on the map. A sealed vault where the Zone stores... something. Full cover, dampening terrain. Contains the rarest items on the entire map: Imprint artifacts and **anomalous items** (items that don't fit any category — see [Narrative Delivery](./narrative-delivery.md)). The Specimen entity is unique to this room. |

#### The Specimen

The Specimen is a unique PvE entity found only in Specimen Vault. It doesn't fit the standard maintenance/transport/response categories.

**Behavior:** The Specimen is stationary. It does not attack. It does not move. It is *watching*. When a player enters Specimen Vault, the Specimen *observes* — the player's detection tier is set to maximum for 2 turns (visible to every player on the map). The Specimen is broadcasting your presence.

If you attack the Specimen, it defends itself — medium HP, hits hard. If you leave without attacking it, it continues observing but doesn't pursue.

The Specimen is a Storage-type entity in a Synthesis Zone — it shouldn't be here. Its presence is anomalous. Data fragments found in Lab Wing reference "Sample 17-V" in Architect notation, described as "a monitoring instance relocated from [Ward 17 designation] for cross-site observation." The Specimen was *transferred* from Ward 17, the Storage Zone. The Zones are sharing resources.

This is one of the earliest cross-Zone connections players can discover, and it's only visible to players who push deep into Lab Wing and find the data fragments to contextualize what they see.

**Strategic Notes:**
- Lab Wing is the most narratively rich PoI on the map. The partially un-Imprinted clean rooms are unique — nowhere else in any Zone shows the Imprint's conversion failing.
- The loot is medical-focused and includes anomalous items. Players hunting for rare, unusual items come here.
- The PoI is relatively quiet (standard and dampening terrain) but deep. Specimen Vault is 5 nodes from the nearest entry. Committing to the full run takes many turns.
- The Specimen is a narrative encounter disguised as a PvE encounter. Players who just want loot will kill it. Players who are paying attention will wonder why a Ward 17 entity is in Vashon.
- Connection to the Crucible through Instrument Hall means players can flow between the two PoIs, but the corridor is the only link — a chokepoint.

**Environmental Storytelling:**
- **Before:** A whiteboard with chemical formulas still partially legible. Lab notebooks in a drawer — real paper, real handwriting, partially crystallized. A coffee mug with a company logo ("VASHON CHEM — SOLUTIONS FOR INDUSTRY") that's been perfectly preserved, untouched by the Imprint. It's just sitting on a bench.
- **Transition:** Clean Room A is the most dramatic transition point on the map. The boundary between Imprinted and un-Imprinted material is visible *on the walls*. You can stand in the room and see where the Imprint stopped. In some places the crystalline growth reaches out like fingers. In others, the white wall stands clean. It looks like the Imprint *tried* and *failed*.
- **Function:** Instrument Hall reveals the Zone's quality control process. The instruments analyze production output — players can see readings on converted screens that show compound purity, yield rates, and error margins. The Zone is testing its own work. The Specimen Vault is the mystery: why is the Zone keeping a Ward 17 entity here? What is it learning from observing Runners?

---

## Connective Terrain

### North Connective (Crucible ↔ Cooling Basins) — 5 nodes

```
                   [Pipe Ridge]
                  /            \
[Crucible North] ── [Scrap Yard] ── [Basins South]
                  \            /
                   [Drainage Channel]
                        |
                   [Overflow Grate]
```

| Node | Cover | Terrain | Loot | Notes |
|---|---|---|---|---|
| **Pipe Ridge** | Partial | Metal (+1) | None | Elevated pipe network running north. Partial cover from pipes. Amplifying — you're exposed above the scrap yard. Has sightlines to Scrap Yard below. The overwatch route. |
| **Scrap Yard** | Partial | Standard (0) | Common ammo | Junkyard of pre-Imprint equipment half-converted to Zone material. Partial cover from debris. The standard middle route. |
| **Drainage Channel** | None | Water (+1) | None | Runoff channel from the Cooling Basins. No cover, water amplifies. The fast route but exposed. |
| **Overflow Grate** | Full | Dampening (-1) | Common consumables | Underground drainage grate. Full cover, dampening. The slow, safe route — requires extra hops. **Weaver dormant connection** to Filtration Room in Cooling Basins. |
| **Crucible North** / **Basins South** | — | — | — | Hub nodes connecting to respective PoIs. |

### East Connective (Crucible ↔ Control Nexus) — 5 nodes

```
                   [Transformer Yard]
                  /                  \
[Crucible East] ── [Access Road] ── [Nexus West]
                  \                  /
                   [Cable Trench]
```

| Node | Cover | Terrain | Loot | Notes |
|---|---|---|---|---|
| **Transformer Yard** | None | Metal (+1) | None | Converted electrical infrastructure. No cover, metal amplifies. Dangerous but direct. Has sightlines to Access Road. |
| **Access Road** | None | Open Field (+1) | Common consumables | Wide paved road. No cover, amplifying. The fastest route — one hop — but completely exposed. |
| **Cable Trench** | Full | Dampening (-1) | None | Underground cable conduit. Full cover, dampening. The safe route but adds a hop. **Weaver dormant connection** to Server Room in Control Nexus. |

### Central Connective (Crucible ↔ Storage Yard) — 5 nodes

```
                   [Conveyor Bridge]
                  /                 \
[Crucible South] ── [Yard Road] ── [Yard North]
                  \                 /
                   [Culvert]
```

| Node | Cover | Terrain | Loot | Notes |
|---|---|---|---|---|
| **Conveyor Bridge** | None | Metal (+1) | Common stabilization compounds | Elevated conveyor system that transported materials between the Crucible and Storage. Still operational — materials move along it. No cover. The Material Carrier from Storage Yard occasionally uses this route. |
| **Yard Road** | None | Open Field (+1) | None | Paved service road. Standard exposed route. |
| **Culvert** | Partial | Water (+1) | None | Drainage culvert running under the service road. Partial cover, water terrain. An alternative to the exposed road. |

### West Connective (Crucible ↔ Lab Wing) — 4 nodes

```
[Crucible West] ── [Corridor] ── [Lab Approach]
                                       |
                                  [Waste Trench]
```

| Node | Cover | Terrain | Loot | Notes |
|---|---|---|---|---|
| **Corridor** | Partial | Standard (0) | None | Enclosed corridor connecting the main processing building to the lab wing. The only **chokepoint** on the map. One node wide, unavoidable if taking the direct route. Partial cover from structural columns. This is "the Corridor" — players name it, plan around it, and fight over it. |
| **Lab Approach** | Partial | Standard (0) | Common consumables | Open area outside the Lab Wing entrance. Alternative entry to the PoI bypassing the Corridor. |
| **Waste Trench** | None | Water (+1) | None | Chemical waste channel that runs along the building exterior. No cover, water amplifies. The alternative to the Corridor — longer but avoids the chokepoint. |

### Southwest Connective (Lab Wing ↔ West Exfil) — 3 nodes

```
[Lab South] ── [Perimeter Road] ── [West Seam]
                      |
                 [Treeline]
```

| Node | Cover | Terrain | Loot | Notes |
|---|---|---|---|---|
| **Perimeter Road** | None | Open Field (+1) | None | Service road along the Zone boundary. Exposed. |
| **Treeline** | Partial | Dense Forest (-1) | Common consumables | Patch of converted trees along the boundary. Dampening, partial cover. The quiet route to West Seam extraction. |

### North-East Connective (Cooling Basins ↔ Control Nexus) — 4 nodes

```
[Basins East] ── [Parking Lot] ── [Nexus North]
                       |
                  [Loading Bay]
```

| Node | Cover | Terrain | Loot | Notes |
|---|---|---|---|---|
| **Parking Lot** | None | Open Field (+1) | None | Former employee parking. Exposed. Cars are half-converted — some are recognizable, some are just shapes. |
| **Loading Bay** | Partial | Standard (0) | Common ammo | Former delivery bay. Partial cover from converted loading equipment. |

---

## Extraction Points

### North Gate (North edge)

**Location:** North of Cooling Basins, 1 hop from Pump Station.

**Description:** The original employee vehicle entrance to the facility. RECLAM reinforced the gate structure and built an extraction corridor through the boundary seam. The gate is recognizable — chain-link fence (half-crystalline), a guard booth (fully converted), and the RECLAM extraction airlock standing in contrast: clean human engineering surrounded by Zone material.

**Approach:** Players must cross through or near Cooling Basins to reach North Gate. The most direct extraction for players coming from the Crucible or Control Nexus.

**Tactical notes:** The 1-hop approach from Pump Station means players extracting here can be ambushed from Cooling Basins. The Pump Station's ambient hum masks approach sounds but also means you can't hear someone coming.

### South Dock (South edge)

**Location:** South of Storage Yard, 1 hop from Shipping Bay.

**Description:** The original tanker truck loading dock. RECLAM converted it into a drive-through extraction point — you enter the dock, the airlock cycles, you're out. The original dock infrastructure is visible: concrete platforms, loading arms, painted lane markers. The RECLAM extraction corridor is built directly into the dock's original structure.

**Approach:** Players must cross through or near Storage Yard. The most accessible extraction — Storage Yard has three entry points, and South Dock is close to all of them.

**Tactical notes:** The highest-traffic extraction. Most players who don't want to commit to deep PoI runs will grab what they can from Storage Yard and exfil here. Expect ambushes.

### West Seam (West edge)

**Location:** Southwest of Lab Wing, 2 hops from Lab Entrance via Perimeter Road or Treeline.

**Description:** A natural boundary seam along the facility's western perimeter. Less developed than the other extraction points — RECLAM's infrastructure here is minimal, more of a field camp than a proper corridor. The seam is visible as a shimmer in the air where Zone material transitions to normal matter.

**Approach:** Requires crossing southwest connective terrain from Lab Wing. The most remote extraction — players coming from the Crucible or eastern PoIs have a long run to reach it.

**Tactical notes:** Low traffic because of distance. The quiet extraction for players who prioritize safety over speed. The Treeline provides a dampening approach. But if this extraction is disabled by a map event, players relying on it are in serious trouble.

---

## Spawn Points

4 spawn points distributed around the map perimeter:

| Spawn | Location | Nearest PoI | Notes |
|---|---|---|---|
| **Spawn A** | North edge, east of North Gate | Cooling Basins (2 hops) | Northern spawn. Quick access to Basins or Control Nexus. |
| **Spawn B** | East edge | Control Nexus (2 hops) | Eastern spawn. Direct line to Nexus. Longer route to Crucible. |
| **Spawn C** | South edge, east of South Dock | Storage Yard (2 hops) | Southern spawn. Quick access to Storage or South Dock extraction. |
| **Spawn D** | West edge, north of West Seam | Lab Wing (2 hops) | Western spawn. Quick access to Lab Wing. Furthest from Crucible. |

Spawns are designed so no player starts within detection range of another, and all players are roughly equidistant (2–3 hops) from the nearest PoI. No player starts with a significant positional advantage.

---

## Weaver Dormant Connections

These are pre-Imprint pathways that Weavers can detect and traverse. They exist as structural ghosts in the Zone material — sealed doors, collapsed tunnels, buried conduits from the original chemical plant.

| Connection | From | To | Pre-Imprint Origin |
|---|---|---|---|
| **Maintenance Hatch** | Tank Row West (Storage Yard) | Warehouse Floor (Storage Yard) | Maintenance access between tank farm and warehouse. Sealed during conversion. |
| **Drainage Pipe** | Overflow Grate (North connective) | Filtration Room (Cooling Basins) | Overflow drainage from the cooling system. Submerged in fluid. |
| **Cable Conduit** | Cable Trench (East connective) | Server Room (Control Nexus) | Electrical cable run between the power grid and server room. |
| **Emergency Exit** | Reactor Core (Crucible) | Pipe Junction (Crucible) | Emergency evacuation route from the reactor housing. Sealed under safety regulations pre-Imprint. |
| **Waste Line** | Analysis Chamber (Lab Wing) | Mixing Vats (Crucible) | Chemical waste return line from the lab to the main processing floor. |
| **Ventilation Shaft** | Clean Room B (Lab Wing) | Lab Entrance (Lab Wing) | HVAC shaft for the clean room system. Shortcut through the PoI's linear layout. |

**Design notes:** Weaver connections are designed to provide meaningful shortcuts without breaking the map's balance. Each connection saves 1–2 hops or bypasses a dangerous node. The Emergency Exit in the Crucible is the most valuable — it turns the Reactor Core dead end into a loop, giving Weavers an escape route that nobody else has.

---

## PvE Entity Summary

| Entity | Location | Type | HP | Behavior |
|---|---|---|---|---|
| **Processor Drone** | Main Processing Floor (Crucible) | Maintenance | Medium | Patrols in a loop. Attacks anyone on its path. Timing-based avoidance. |
| **Core Guardian** | Reactor Core (Crucible) | Response | High | Activates when a player enters the node. Aggressive, high damage. Guards the best loot. |
| **Maintenance Crawler** | Deep Tank (Crucible) | Maintenance | Low | Passive until looting occurs. Pursues for 3 turns to recover materials. |
| **Thermal Regulator** | North Basin (Cooling Basins) | Maintenance | Medium | Passive until looting occurs or player enters fluid. Defends the basin. |
| **Watcher** | Main Corridor (Control Nexus) | Response (passive) | Low | Stationary. Observes. Alerts the Reclaimer. Kill it silently to prevent activation. |
| **Reclaimer** | Archive Vault (Control Nexus) | Response (active) | High | Dormant unless Watcher alerts. Pursues toward Archive Vault to recover materials. |
| **Material Carrier** | Tank Row East ↔ Tank Row West (Storage Yard) | Transport | Medium | Fixed route, timed schedule. Collision damage. Doesn't target players deliberately. |
| **Packaging Drone** | Staging Area (Storage Yard) | Maintenance | Low | Continuous operation. Fights back when interrupted. Low threat. |
| **Analyzer** | Analysis Chamber (Lab Wing) | Maintenance | Low | Continuous operation. Generates noise. Low threat. |
| **Specimen** | Specimen Vault (Lab Wing) | Unique (Storage-type) | Medium | Stationary. Observes. Broadcasts player position for 2 turns. Defends if attacked. Ward 17 origin — anomalous. |

**Narrative pattern:** PvE behavior in Vashon is production-focused. Entities carry materials, maintain machinery, package output, and analyze product quality. They're factory workers. They attack Runners not out of hostility but because Runners are disrupting the factory's operation. The Watcher/Reclaimer pair is the exception — response systems designed to recover stolen materials. And the Specimen is the anomaly — a monitoring entity from another Zone, evidence that the Zones cooperate.

---

## Map Events

Vashon's event pool contains **8 possible events**. A typical raid activates **2–3**.

### Production Surge (Raid-start, 40% chance)

The Crucible's output doubles. All loot tables in the Crucible are upgraded one rarity tier. But production activity increases PvE awareness — all entities in the Crucible have expanded detection range (+1 node) for the entire raid.

**Narrative:** The Architect ramped up synthesis. More product means more for Runners to take — and more reason for Zone systems to protect it.

### Thermal Spike (Timed — turn 6, 35% chance)

The Cooling Basins overheat. For 3 turns, all Water-terrain nodes on the map gain +1 additional visibility modifier (water becomes extremely amplifying). Players on water nodes are highly visible. After 3 turns, conditions normalize.

**Narrative:** A production surge in the Crucible overloaded the thermal regulation system. The basins flared, heating the fluid past normal parameters. The Zone corrected itself — but for a few minutes, everything got very bright.

### Pipeline Breach (Timed — turn 8, 30% chance)

A pipe ruptures in the north connective terrain. Drainage Channel becomes impassable for the rest of the raid (flooded with hot fluid). Players relying on that route must reroute through Pipe Ridge, Scrap Yard, or Overflow Grate.

**Narrative:** The elevated production caused a structural failure in a transfer pipe. The Zone will repair it — but not during this raid.

### Carrier Reroute (Raid-start, 50% chance)

The Material Carrier in Storage Yard expands its route. Instead of patrolling only between Tank Row East and Tank Row West, it now also travels through the Central connective terrain (Conveyor Bridge) to the Crucible and back. Players in the connective terrain between Storage Yard and the Crucible must now watch for the Carrier.

**Narrative:** The Architect rerouted material transport to support increased output. The factory floor expanded.

### West Seam Degradation (Timed — turn 10, 25% chance)

The West Seam extraction point is disabled for the rest of the raid. The boundary thickened — the seam is no longer viable. Players relying on West Seam must reroute to North Gate or South Dock.

**Narrative:** The Architect's construction activity temporarily strengthened the Zone boundary at the western seam. RECLAM reports it as "seam instability" — from the Architect's perspective, the construction is simply proceeding.

### Surplus Cache (Raid-start, 45% chance)

A bonus loot node appears in the south connective terrain (between Storage Yard and the Crucible) — a material cache that fell off a transport route. Contains uncommon-to-rare stabilization compounds. Visible on all players' maps from raid start. A known location with known value — a race and a trap.

**Narrative:** Material transport between the Crucible and Storage Yard dropped a load. It happens in any factory.

### Specimen Broadcast (Triggered — first player enters Specimen Vault, 40% chance)

When the first player enters Specimen Vault, the Specimen transmits a Zone-wide pulse instead of its normal observation. All players' positions are briefly revealed to all other players (1-turn global visibility). The Specimen then returns to normal behavior.

**Narrative:** The Specimen reported something to Ward 17. The transmission was powerful enough to light up every stabilized shell on the map. What did it report? Why?

### Dead Shift (Raid-start, 30% chance)

All maintenance entities on the map enter a low-power state for the first 5 turns of the raid. They don't patrol, don't attack, don't react. After turn 5, they resume normal behavior. Response entities (Watcher, Reclaimer, Core Guardian) are unaffected.

**Narrative:** The Zone's maintenance cycle entered a scheduled downtime — the Architect's systems have rhythms, and Runners happened to arrive during a pause. Factory night shift.

---

## Secrets and Hidden Content

### The Coffee Mug (Lab Wing — Clean Room A)

A perfectly preserved coffee mug with the Vashon Chemical company logo sits on a lab bench. It's the only completely un-Imprinted manufactured object in the Zone. If a player loots it, it appears in their inventory as a **common consumable** with no gameplay effect.

But its item description reads: "A ceramic mug. 'VASHON CHEM — SOLUTIONS FOR INDUSTRY.' Found in an un-Imprinted section of Lab Wing. The mug is unremarkable. The question is why the Imprint left it alone."

This mug is referenced in three data fragments across three different Zones (Ward 17, Lachesis, Threshold). Collecting all three fragments and the mug reveals that the un-Imprinted clean rooms aren't a failure of conversion — they're *quarantine*. The Architect deliberately avoided converting sterile environments because it didn't understand what the sterile conditions were protecting against. The clean rooms are the Architect being *cautious*. This is one of the earliest hints that the Architect has more nuanced behavior than "convert everything."

### Process Flow (Control Center)

The monitors in Control Center display a real-time process flow diagram for Vashon's operations. Most of it is in Architect notation and unreadable. But one section of the diagram shows a **map** — a schematic of connected nodes that doesn't match Vashon's layout. It matches the *inter-Zone connection topology*. This is a map of how the Zones connect to each other.

Players who screenshot this or describe it to the community seed the Era 2 revelation that the Zones are interconnected. It's visible from the first raid, but nobody knows what they're looking at until cross-Zone data fragments provide context.

### Kov's Bootprint (Main Processing Floor)

A single bootprint in the zone material near East Entrance. Not pre-Imprint — the material is post-conversion. Someone walked through here *after* the Imprint, in a physical body. No shell. No stabilization.

This is Kov's bootprint — the Runner from the Revenant lore who ran the first Dead Sprint extraction. Kov's early career was at Vashon, before the printing program. The bootprint dates to the physical-Runner era.

No data fragment explicitly confirms this. It's a detail for the community to discover, debate, and eventually connect to the Revenant backstory.

### The Material Carrier's Destination

Players who follow the Material Carrier's extended route (during Carrier Reroute event) notice it doesn't just loop. On its return trip from the Crucible, it pauses at a node in the central connective terrain for exactly one turn. It's *unloading* — transferring processed materials to something underground. The node has no loot, no special properties. But it's where the Zone sends finished product downward, into infrastructure players can't access.

This is a hint at the Assembly Zone — the deep layer where relay components are being assembled. Players won't understand this until Era 3, but the evidence is present from launch.

---

## Loot Summary by Rarity

| Rarity | Where to Find | Notes |
|---|---|---|
| **Common** | Connective terrain, PoI entry nodes | Ammo, basic consumables, common stabilization compounds |
| **Uncommon** | PoI mid-depth nodes | Stabilization compounds, utility cards, data fragments, thermal compounds |
| **Rare** | PoI deep nodes (Reactor Core, Filtration Room, Archive Vault, Staging Area, Specimen Vault, Clean Room B) | Rare compounds, weapons, Imprint artifacts, rare data fragments |
| **Anomalous** | Specimen Vault only | Items that don't fit any category. Extremely rare. Narrative-significant. |

**Vashon-specific loot:** Thermal compounds (Cooling Basins), medical consumables (Lab Wing clean rooms), cross-Zone data fragments (Control Center), anomalous items (Specimen Vault). Players who want these items must run Vashon specifically.
