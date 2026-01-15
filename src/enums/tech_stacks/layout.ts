import { SWIFT_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const layout: TechCategory = {
  id: 'layout',
  label: { zh: '布局', en: 'Layout' },
  groups: [
    {
      managers: SWIFT_MANAGERS,
      items: [{ key: 'SnapKit', name: 'SnapKit' }],
    },
  ],
};
