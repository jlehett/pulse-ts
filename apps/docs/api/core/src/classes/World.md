[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / World

# Class: World

Defined in: [packages/core/src/domain/world/world.ts:57](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L57)

The World class is the main class for the Pulse engine.
It manages the nodes and the tick system.

## Implements

- `WorldTimingApi`
- `WorldTransformRegistry`

## Constructors

### Constructor

> **new World**(`opts`): `World`

Defined in: [packages/core/src/domain/world/world.ts:75](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L75)

#### Parameters

##### opts

[`WorldOptions`](../interfaces/WorldOptions.md) = `{}`

#### Returns

`World`

## Properties

### nodes

> `readonly` **nodes**: `Set`\<[`Node`](Node.md)\>

Defined in: [packages/core/src/domain/world/world.ts:60](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L60)

## Methods

### add()

> **add**\<`T`\>(`node`): `T`

Defined in: [packages/core/src/domain/world/world.ts:175](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L175)

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

Defined in: [packages/core/src/domain/world/world.ts:430](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L430)

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

Defined in: [packages/core/src/domain/world/world.ts:133](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L133)

Removes all user nodes from the world while preserving internal system nodes.
Destroys root nodes (and their subtrees) excluding the internal system node.

Example:
```ts
const w = new World();
w.add(new Node());
w.clearScene(); // removes user nodes; internal system node remains
```

#### Returns

`void`

***

### debugStats()

> **debugStats**(): `object`

Defined in: [packages/core/src/domain/world/world.ts:288](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L288)

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

Defined in: [packages/core/src/domain/world/world.ts:303](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L303)

Gets the ambient alpha.

#### Returns

`number`

The ambient alpha.

#### Implementation of

`WorldTimingApi.getAmbientAlpha`

***

### getFrameId()

> **getFrameId**(): `number`

Defined in: [packages/core/src/domain/world/world.ts:311](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L311)

Gets the frame ID.

#### Returns

`number`

The frame ID.

#### Implementation of

`WorldTimingApi.getFrameId`

***

### getPerf()

> **getPerf**(): `object`

Defined in: [packages/core/src/domain/world/world.ts:318](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L318)

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

Defined in: [packages/core/src/domain/world/world.ts:404](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L404)

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

Defined in: [packages/core/src/domain/world/world.ts:441](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L441)

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

Defined in: [packages/core/src/domain/world/world.ts:380](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L380)

Gets the time scale of the world.

#### Returns

`number`

The time scale.

***

### isPaused()

> **isPaused**(): `boolean`

Defined in: [packages/core/src/domain/world/world.ts:364](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L364)

Checks if the world is paused.

#### Returns

`boolean`

True if the world is paused, false otherwise.

***

### mount()

> **mount**\<`P`\>(`fc`, `props?`, `opts?`): [`Node`](Node.md)

Defined in: [packages/core/src/domain/world/world.ts:166](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L166)

Mounts a function component into the world.

#### Type Parameters

##### P

`P`

#### Parameters

##### fc

[`FC`](../type-aliases/FC.md)\<`P`\>

The function component to mount.

##### props?

`P`

Optional props to pass to the component.

##### opts?

Optional parent to attach the created node under.

###### parent?

`null` \| [`Node`](Node.md)

#### Returns

[`Node`](Node.md)

The mounted node.

Example:
```ts
function Mover() {
  useFrameUpdate((dt) => void 0);
}
const w = new World();
const node = w.mount(Mover);
```

***

### onNodeAdded()

> **onNodeAdded**(`fn`): () => `void`

Defined in: [packages/core/src/domain/world/world.ts:141](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L141)

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

Defined in: [packages/core/src/domain/world/world.ts:112](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L112)

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

Defined in: [packages/core/src/domain/world/world.ts:146](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L146)

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

Defined in: [packages/core/src/domain/world/world.ts:349](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L349)

Pauses the world.

#### Returns

`void`

***

### provideService()

> **provideService**\<`T`\>(`service`): `T`

Defined in: [packages/core/src/domain/world/world.ts:393](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L393)

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

### query()

> **query**\<`Has`, `Not`\>(`has`, `opts?`): `object`

Defined in: [packages/core/src/domain/world/world.ts:504](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L504)

Convenience typed query creator bound to this world.
Equivalent to `defineQuery(has, opts).run(world)` but avoids re-creating the query
if you hold onto the returned object.

#### Type Parameters

##### Has

`Has` *extends* readonly [`ComponentCtor`](../type-aliases/ComponentCtor.md)[]

##### Not

`Not` *extends* readonly [`ComponentCtor`](../type-aliases/ComponentCtor.md)[] = \[\]

#### Parameters

##### has

`Has`

##### opts?

###### not?

`Not`

#### Returns

`object`

##### count()

> `readonly` **count**: () => `number`

###### Returns

`number`

##### run()

> `readonly` **run**: () => `IterableIterator`\<\[[`Node`](Node.md), ...\{ \[K in string \| number \| symbol\]: InstanceType\<Has\[K\<K\>\]\> \}\[\]\], `any`, `any`\>

###### Returns

`IterableIterator`\<\[[`Node`](Node.md), ...\{ \[K in string \| number \| symbol\]: InstanceType\<Has\[K\<K\>\]\> \}\[\]\], `any`, `any`\>

##### some()

> `readonly` **some**: () => `boolean`

###### Returns

`boolean`

***

### registerSystemTick()

> **registerSystemTick**(`kind`, `phase`, `fn`, `order`): `object`

Defined in: [packages/core/src/domain/world/world.ts:227](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L227)

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

> **registerTick**(`node`, `kind`, `phase`, `fn`, `order`): `TickRegistration`

Defined in: [packages/core/src/domain/world/world.ts:250](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L250)

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

`TickRegistration`

The tick registration.

***

### registerTransform()

> **registerTransform**(`t`): `void`

Defined in: [packages/core/src/domain/world/world.ts:330](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L330)

Registers a transform.

#### Parameters

##### t

[`Transform`](Transform.md)

The transform to register.

#### Returns

`void`

#### Implementation of

`WorldTransformRegistry.registerTransform`

***

### remove()

> **remove**(`node`): `void`

Defined in: [packages/core/src/domain/world/world.ts:199](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L199)

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

Defined in: [packages/core/src/domain/world/world.ts:414](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L414)

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

Defined in: [packages/core/src/domain/world/world.ts:451](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L451)

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

Defined in: [packages/core/src/domain/world/world.ts:215](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L215)

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

Defined in: [packages/core/src/domain/world/world.ts:356](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L356)

Resumes the world.

#### Returns

`void`

***

### setNodeTicksEnabled()

> **setNodeTicksEnabled**(`node`, `enabled`): `void`

Defined in: [packages/core/src/domain/world/world.ts:467](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L467)

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

Defined in: [packages/core/src/domain/world/world.ts:477](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L477)

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

Defined in: [packages/core/src/domain/world/world.ts:372](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L372)

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

Defined in: [packages/core/src/domain/world/world.ts:265](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L265)

Starts the world.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/core/src/domain/world/world.ts:272](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L272)

Stops the world.

#### Returns

`void`

***

### tick()

> **tick**(`dtMs`): `void`

Defined in: [packages/core/src/domain/world/world.ts:280](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L280)

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

Defined in: [packages/core/src/domain/world/world.ts:338](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/world/world.ts#L338)

Unregisters a transform.

#### Parameters

##### t

[`Transform`](Transform.md)

The transform to unregister.

#### Returns

`void`

#### Implementation of

`WorldTransformRegistry.unregisterTransform`
