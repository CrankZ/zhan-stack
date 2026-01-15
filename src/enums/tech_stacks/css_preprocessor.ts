import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const css_preprocessor: TechCategory = {
  id: 'css_preprocessor',
  label: { zh: 'CSS预处理', en: 'CSS Preprocessor' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'sass', name: 'Sass' },
        { key: 'less', name: 'Less' },
      ],
    },
  ],
};
