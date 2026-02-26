export { useParticles } from './useParticles';
export type {
    ParticlesOptions,
    ParticleEmitter,
    BlendingMode,
} from './useParticles';

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
