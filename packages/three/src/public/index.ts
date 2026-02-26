// Public surface re-exports for @pulse-ts/three
export { ThreeService, type ThreeOptions } from '../domain/services/Three';
export { ThreeRenderSystem } from '../domain/systems/render';
export { ThreeCameraPVSystem } from '../domain/systems/cameraPV';
export { ThreeTRSSyncSystem } from '../domain/systems/trsSync';
export { installThree } from './install';
export { useThreeContext, useThreeRoot, useObject3D } from './hooks';
export {
    useMesh,
    type GeometryType,
    type GeometryTypeMap,
    type BoxGeometryOptions,
    type SphereGeometryOptions,
    type CapsuleGeometryOptions,
    type CylinderGeometryOptions,
    type ConeGeometryOptions,
    type IcosahedronGeometryOptions,
    type OctahedronGeometryOptions,
    type PlaneGeometryOptions,
    type TorusGeometryOptions,
    type MeshMaterialOptions,
    type MeshShadowOptions,
    type UseMeshOptions,
    type UseMeshResult,
} from './useMesh';
export {
    useFollowCamera,
    type FollowCameraOptions,
    type FollowCameraResult,
} from './useFollowCamera';
export {
    StatsOverlaySystem,
    type StatsOverlayOptions,
} from '../domain/systems/statsOverlay';
