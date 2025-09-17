[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / World

# Class: World

Defined in: [core/src/world.ts:52](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L52)

The World class is the main class for the Pulse engine.
It manages the nodes and the tick system.

## Constructors

### Constructor

> **new World**(`opts`): `World`

Defined in: [core/src/world.ts:70](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L70)

#### Parameters

##### opts

[`WorldOptions`](../interfaces/WorldOptions.md) = `{}`

#### Returns

`World`

## Properties

### nodes

> `readonly` **nodes**: `Set`\<[`Node`](Node.md)\>

Defined in: [core/src/world.ts:55](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L55)

## Methods

### add()

> **add**\<`T`\>(`node`): `T`

Defined in: [core/src/world.ts:157](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L157)

Adds a node to the world.

#### Type Parameters

##### T

`T` *extends* [`Node`](Node.md)

#### Parameters

##### node

`T`

The node to add.

#### Returns

`T`

The node.

***

### addSystem()

> **addSystem**\<`T`\>(`system`): `T`

Defined in: [core/src/world.ts:412](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L412)

Adds a system to the world.

#### Type Parameters

##### T

`T` *extends* [`System`](System.md)

#### Parameters

##### system

`T`

The system to add.

#### Returns

`T`

The system.

***

### clearScene()

> **clearScene**(): `void`

Defined in: [core/src/world.ts:124](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L124)

Removes all user nodes from the world while preserving internal system nodes.
Destroys root nodes (and their subtrees) excluding the internal system node.

#### Returns

`void`

***

### debugStats()

> **debugStats**(): `object`

Defined in: [core/src/world.ts:270](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L270)

Gets the debug stats of the world.

#### Returns

`object`

The debug stats.

##### fixedSps

> **fixedSps**: `number`

##### fps

> **fps**: `number`

##### frameId

> **frameId**: `number`

##### nodes

> **nodes**: `number`

##### ticks

> **ticks**: `object`

###### ticks.fixed

> **fixed**: `object`

###### ticks.fixed.early

> **early**: `object`

###### ticks.fixed.early.active

> **active**: `number`

###### ticks.fixed.early.disabled

> **disabled**: `boolean`

###### ticks.fixed.early.ms

> **ms**: `number`

###### ticks.fixed.early.order

> **order**: `number`[]

###### ticks.fixed.early.size

> **size**: `number`

###### ticks.fixed.late

> **late**: `object`

###### ticks.fixed.late.active

> **active**: `number`

###### ticks.fixed.late.disabled

> **disabled**: `boolean`

###### ticks.fixed.late.ms

> **ms**: `number`

###### ticks.fixed.late.order

> **order**: `number`[]

###### ticks.fixed.late.size

> **size**: `number`

###### ticks.fixed.update

> **update**: `object`

###### ticks.fixed.update.active

> **active**: `number`

###### ticks.fixed.update.disabled

> **disabled**: `boolean`

###### ticks.fixed.update.ms

> **ms**: `number`

###### ticks.fixed.update.order

> **order**: `number`[]

###### ticks.fixed.update.size

> **size**: `number`

###### ticks.frame

> **frame**: `object`

###### ticks.frame.early

> **early**: `object`

###### ticks.frame.early.active

> **active**: `number`

###### ticks.frame.early.disabled

> **disabled**: `boolean`

###### ticks.frame.early.ms

> **ms**: `number`

###### ticks.frame.early.order

> **order**: `number`[]

###### ticks.frame.early.size

> **size**: `number`

###### ticks.frame.late

> **late**: `object`

###### ticks.frame.late.active

> **active**: `number`

###### ticks.frame.late.disabled

> **disabled**: `boolean`

###### ticks.frame.late.ms

> **ms**: `number`

###### ticks.frame.late.order

> **order**: `number`[]

###### ticks.frame.late.size

> **size**: `number`

###### ticks.frame.update

> **update**: `object`

###### ticks.frame.update.active

> **active**: `number`

###### ticks.frame.update.disabled

> **disabled**: `boolean`

###### ticks.frame.update.ms

> **ms**: `number`

###### ticks.frame.update.order

> **order**: `number`[]

###### ticks.frame.update.size

> **size**: `number`

##### transforms

> **transforms**: `number`

***

### getAmbientAlpha()

> **getAmbientAlpha**(): `number`

Defined in: [core/src/world.ts:285](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L285)

Gets the ambient alpha.

#### Returns

`number`

The ambient alpha.

***

### getFrameId()

> **getFrameId**(): `number`

Defined in: [core/src/world.ts:293](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L293)

Gets the frame ID.

#### Returns

`number`

The frame ID.

***

### getPerf()

> **getPerf**(): `object`

Defined in: [core/src/world.ts:300](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L300)

Returns current performance stats.

#### Returns

`object`

##### fixedSps

> **fixedSps**: `number`

##### fps

> **fps**: `number`

***

### getService()

> **getService**\<`T`\>(`service`): `undefined` \| `T`

Defined in: [core/src/world.ts:386](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L386)

Gets a service.

#### Type Parameters

##### T

`T` *extends* [`Service`](Service.md)

#### Parameters

##### service

The service to get.

[`Ctor`](../type-aliases/Ctor.md)\<`T`\> | `ThisParameterType`\<`T`\>

#### Returns

`undefined` \| `T`

The service.

***

### getSystem()

> **getSystem**\<`T`\>(`system`): `undefined` \| `T`

Defined in: [core/src/world.ts:423](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L423)

Gets a system.

#### Type Parameters

##### T

`T` *extends* [`System`](System.md)

#### Parameters

##### system

The system to get.

[`Ctor`](../type-aliases/Ctor.md)\<`T`\> | `ThisParameterType`\<`T`\>

#### Returns

`undefined` \| `T`

The system.

***

### getTimeScale()

> **getTimeScale**(): `number`

Defined in: [core/src/world.ts:362](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L362)

Gets the time scale of the world.

#### Returns

`number`

The time scale.

***

### isPaused()

> **isPaused**(): `boolean`

Defined in: [core/src/world.ts:346](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L346)

Checks if the world is paused.

#### Returns

`boolean`

True if the world is paused, false otherwise.

***

### mount()

> **mount**\<`P`\>(`fc`, `props?`, `opts?`): [`Node`](Node.md)

Defined in: [core/src/world.ts:148](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L148)

Mounts a function component.

#### Type Parameters

##### P

`P`

#### Parameters

##### fc

[`FC`](../type-aliases/FC.md)\<`P`\>

The function component to mount.

##### props?

`P`

The props to pass to the component.

##### opts?

The options for the mount.

###### parent?

`null` \| [`Node`](Node.md)

#### Returns

[`Node`](Node.md)

The node that was mounted.

***

### onNodeAdded()

> **onNodeAdded**(`fn`): () => `void`

Defined in: [core/src/world.ts:132](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L132)

Subscribes to node added events.

#### Parameters

##### fn

(`node`) => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### onNodeParentChanged()

> **onNodeParentChanged**(`fn`): () => `void`

Defined in: [core/src/world.ts:110](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L110)

Subscribes to node parent change events.

#### Parameters

##### fn

(`e`) => `void`

The function to call when a node parent changes.

#### Returns

A function to unsubscribe.

> (): `void`

##### Returns

`void`

***

### onNodeRemoved()

> **onNodeRemoved**(`fn`): () => `void`

Defined in: [core/src/world.ts:137](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L137)

Subscribes to node removed events.

#### Parameters

##### fn

(`node`) => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### pause()

> **pause**(): `void`

Defined in: [core/src/world.ts:331](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L331)

Pauses the world.

#### Returns

`void`

***

### provideService()

> **provideService**\<`T`\>(`service`): `T`

Defined in: [core/src/world.ts:375](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L375)

Provides a service.

#### Type Parameters

##### T

`T` *extends* [`Service`](Service.md)

#### Parameters

##### service

`T`

The service to provide.

#### Returns

`T`

The service.

***

### registerSystemTick()

> **registerSystemTick**(`kind`, `phase`, `fn`, `order`): `object`

Defined in: [core/src/world.ts:209](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L209)

Registers a system tick function.

#### Parameters

##### kind

[`UpdateKind`](../type-aliases/UpdateKind.md)

The kind of tick.

##### phase

[`UpdatePhase`](../type-aliases/UpdatePhase.md)

The phase of the tick.

##### fn

[`TickFn`](../type-aliases/TickFn.md)

The tick function.

##### order

`number` = `0`

The order of the tick.

#### Returns

`object`

The tick registration.

##### dispose()

> **dispose**(): `void`

###### Returns

`void`

***

### registerTick()

> **registerTick**(`node`, `kind`, `phase`, `fn`, `order`): [`TickRegistration`](../interfaces/TickRegistration.md)

Defined in: [core/src/world.ts:232](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L232)

Registers a tick on a node.

#### Parameters

##### node

[`Node`](Node.md)

The node to register the tick on.

##### kind

[`UpdateKind`](../type-aliases/UpdateKind.md)

The kind of tick.

##### phase

[`UpdatePhase`](../type-aliases/UpdatePhase.md)

The phase of the tick.

##### fn

[`TickFn`](../type-aliases/TickFn.md)

The tick function.

##### order

`number` = `0`

The order of the tick.

#### Returns

[`TickRegistration`](../interfaces/TickRegistration.md)

The tick registration.

***

### registerTransform()

> **registerTransform**(`t`): `void`

Defined in: [core/src/world.ts:312](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L312)

Registers a transform.

#### Parameters

##### t

[`Transform`](Transform.md)

The transform to register.

#### Returns

`void`

***

### remove()

> **remove**(`node`): `void`

Defined in: [core/src/world.ts:181](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L181)

Removes a node from the world.

#### Parameters

##### node

[`Node`](Node.md)

The node to remove.

#### Returns

`void`

***

### removeService()

> **removeService**\<`T`\>(`service`): `void`

Defined in: [core/src/world.ts:396](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L396)

Removes a service from the world.

#### Type Parameters

##### T

`T` *extends* [`Service`](Service.md)

#### Parameters

##### service

The service to remove.

[`Ctor`](../type-aliases/Ctor.md)\<`T`\> | `ThisParameterType`\<`T`\>

#### Returns

`void`

***

### removeSystem()

> **removeSystem**\<`T`\>(`system`): `void`

Defined in: [core/src/world.ts:433](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L433)

Removes a system from the world.

#### Type Parameters

##### T

`T` *extends* [`System`](System.md)

#### Parameters

##### system

The system to remove.

[`Ctor`](../type-aliases/Ctor.md)\<`T`\> | `ThisParameterType`\<`T`\>

#### Returns

`void`

***

### reparent()

> **reparent**(`child`, `newParent`): `void`

Defined in: [core/src/world.ts:197](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L197)

Reparents a child under a new parent (or detaches when null).

#### Parameters

##### child

[`Node`](Node.md)

##### newParent

`null` | [`Node`](Node.md)

#### Returns

`void`

***

### resume()

> **resume**(): `void`

Defined in: [core/src/world.ts:338](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L338)

Resumes the world.

#### Returns

`void`

***

### setNodeTicksEnabled()

> **setNodeTicksEnabled**(`node`, `enabled`): `void`

Defined in: [core/src/world.ts:449](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L449)

Sets the enabled state of a node.

#### Parameters

##### node

[`Node`](Node.md)

The node to set the enabled state of.

##### enabled

`boolean`

The enabled state of the node.

#### Returns

`void`

***

### setPhaseEnabled()

> **setPhaseEnabled**(`kind`, `phase`, `enabled`): `void`

Defined in: [core/src/world.ts:459](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L459)

Sets the enabled state of a phase.

#### Parameters

##### kind

[`UpdateKind`](../type-aliases/UpdateKind.md)

The kind of tick.

##### phase

[`UpdatePhase`](../type-aliases/UpdatePhase.md)

The phase of the tick.

##### enabled

`boolean`

The enabled state of the phase.

#### Returns

`void`

***

### setTimeScale()

> **setTimeScale**(`scale`): `void`

Defined in: [core/src/world.ts:354](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L354)

Sets the time scale of the world.

#### Parameters

##### scale

`number`

The time scale.

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: [core/src/world.ts:247](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L247)

Starts the world.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [core/src/world.ts:254](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L254)

Stops the world.

#### Returns

`void`

***

### tick()

> **tick**(`dtMs`): `void`

Defined in: [core/src/world.ts:262](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L262)

Ticks the world.

#### Parameters

##### dtMs

`number`

The delta time in milliseconds.

#### Returns

`void`

***

### unregisterTransform()

> **unregisterTransform**(`t`): `void`

Defined in: [core/src/world.ts:320](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/world.ts#L320)

Unregisters a transform.

#### Parameters

##### t

[`Transform`](Transform.md)

The transform to unregister.

#### Returns

`void`
