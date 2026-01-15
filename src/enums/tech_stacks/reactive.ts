import { SWIFT_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const reactive: TechCategory = {
  id: 'reactive',
  label: { zh: '响应式', en: 'Reactive' },
  groups: [
    {
      managers: SWIFT_MANAGERS,
      items: [{ key: 'RxSwift', name: 'RxSwift' }],
    },
  ],
};
