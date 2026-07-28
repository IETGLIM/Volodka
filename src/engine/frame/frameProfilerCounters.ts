/** Re-export — counters live in shared so store↛engine layer guard holds. */
export {
  resetFrameProfilerCounters,
  incrementZustandNotification,
  incrementReactRender,
  getZustandNotificationsThisFrame,
  getReactRendersThisFrame,
  installFrameProfilerInstrumentation,
  wrapStoreSubscribe,
} from '@/shared/dev/frameProfilerCounters';
