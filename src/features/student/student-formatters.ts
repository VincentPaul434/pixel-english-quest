import type { PixelIconName } from '../../shared-components/PixelIcon';

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function dueLabel(value: string | null) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function iconForActivity(type: string): PixelIconName {
  if (type === 'quiz') return 'zap';
  if (type === 'speaking') return 'mic';
  if (type === 'profile') return 'magic';
  return 'book';
}
