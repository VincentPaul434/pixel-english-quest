import type { PixelIconName } from '../../shared-components/PixelIcon';
import type { Category } from '../academy/models/types';

export const categoryDetails: Record<Category, { label: string; icon: PixelIconName; description: string }> = {
  reading: { label: 'Reading', icon: 'book', description: 'Read and understand magical stories' },
  grammar: { label: 'Grammar', icon: 'grammar', description: 'Build accurate, confident sentences' },
  listening: { label: 'Listening', icon: 'headphones', description: 'Follow spoken English clearly' },
  speaking: { label: 'Speaking', icon: 'mic', description: 'Practise phrases and pronunciation' }
};
