import { SWIFT_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const image: TechCategory = {
  id: 'image',
  label: { zh: '图片', en: 'Image' },
  groups: [
    {
      managers: SWIFT_MANAGERS,
      items: [{ key: 'Kingfisher', name: 'Kingfisher' }],
    },
  ],
};
