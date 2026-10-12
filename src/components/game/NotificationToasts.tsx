export { NotificationToastsPanel as NotificationToasts } from '@/components/game/notificationToasts/NotificationToastsPanel';

/* FIX (v4.48.5): реэкспорт show*Karma/Energy/Stress/SkillToast удалён —
 * API не имел ни одного внешнего вызывающего (стат-тосты приходят через
 * стор-зеркало). notificationToastApi.ts удалён. */
