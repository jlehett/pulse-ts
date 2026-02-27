// Low-level callback-driven particle emitter (escape hatch)
export { useParticles } from './useParticles';
export type {
    ParticlesOptions,
    ParticleEmitter,
    BlendingMode,
} from './useParticles';

// High-level convenience hooks
export { installParticles } from './installParticles';
export { useParticleBurst } from './useParticleBurst';
export type { ParticleBurstOptions, BurstFn } from './useParticleBurst';
export { useParticleEmitter } from './useParticleEmitter';
export type {
    ParticleEmitterOptions,
    EmitterHandle,
} from './useParticleEmitter';

// Service + install options (for advanced use)
export { ParticlesService } from '../domain/ParticlesService';
export type {
    ParticlesInstallOptions,
    ParticleStyleOptions,
} from '../domain/ParticlesService';

// Animated values
export { useAnimate } from './useAnimate';
export type {
    WaveType,
    EasingPreset,
    EasingOption,
    OscillateAmplitudeOptions,
    OscillateRangeOptions,
    RateOptions,
    TweenOptions,
    AnimateOptions,
    AnimatedValue,
} from './useAnimate';

// Re-export domain types consumers need for init/update callbacks
export type {
    Particle,
    Vec3Mut,
    ColorMut,
    Point3,
    InitFn,
    UpdateFn,
} from '../domain/ParticlePool';
