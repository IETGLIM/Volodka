/** Human-readable schedule activity for interaction hints. */
export function formatNpcActivityHint(activity: string | undefined): string | undefined {
  if (!activity) return undefined;
  switch (activity) {
    case 'idle':
      return 'Отдыхает';
    case 'walk':
      return 'Идёт по делам';
    case 'work':
      return 'Занят работой';
    case 'read':
      return 'Читает';
    case 'sleep':
      return 'Спит — не беспокоить';
    case 'talk':
      return 'Разговаривает';
    case 'rest':
      return 'Отдыхает у стены';
    default:
      return undefined;
  }
}
