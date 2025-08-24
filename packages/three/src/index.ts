// Prefabs & handles
export { threePrefab, type PrefabFactory } from './decorators/three-prefab';
export { getObject3D, maybeGetObject3D } from './utils/object-handle';

// Plugin & driver
export { ThreePlugin } from './plugin/three-plugin';
export { RendererDriverNode } from './plugin/renderer-driver-node';

// Helpers
export { applyLocalTRSToObject3D } from './adapters/transform-sync';

// Mesh helpers / controls / loaders
export { MeshFactories } from './adapters/mesh-factories';
export { OrbitControlsAdapter } from './controls/orbit-controls-adapter';
export { createTextureLoader } from './resources/loaders';