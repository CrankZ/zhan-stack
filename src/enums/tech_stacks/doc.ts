import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const doc: TechCategory = {
  id: 'doc',
  label: { zh: '组件文档', en: 'Component Documentation' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [{ key: 'storybook', name: 'Storybook' }],
    },
  ],
};
