// Public scheduler adapters for `WorldOptions.scheduler` injection.
export type { Scheduler } from '../infra/scheduler';
export {
    RafScheduler,
    TimeoutScheduler,
    ManualScheduler,
} from '../infra/scheduler';
