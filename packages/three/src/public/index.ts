// Public surface re-exports for @pulse-ts/three
export { ThreeService, type ThreeOptions } from '../domain/services/Three';
export { ThreeRenderSystem } from '../domain/systems/render';
export { ThreeCameraPVSystem } from '../domain/systems/cameraPV';
export { ThreeTRSSyncSystem } from '../domain/systems/trsSync';
export { installThree } from './install';
export { useThreeContext, useThreeRoot, useObject3D } from './hooks';
export {
    StatsOverlaySystem,
    type StatsOverlayOptions,
} from '../domain/systems/statsOverlay';
