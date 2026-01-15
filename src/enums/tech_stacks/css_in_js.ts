import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const css_in_js: TechCategory = {
  id: 'css_in_js',
  label: { zh: 'CSS-in-JS', en: 'CSS-in-JS' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'styled-components', name: 'styled-components' },
        { key: '@emotion/styled', name: 'Emotion Styled' },
        { key: '@emotion/react', name: 'Emotion React' },
      ],
    },
  ],
};
