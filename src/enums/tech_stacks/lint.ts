import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const lint: TechCategory = {
  id: 'lint',
  label: { zh: '代码规范', en: 'Code Quality' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'eslint', name: 'ESLint' },
        { key: 'prettier', name: 'Prettier' },
        { key: 'stylelint', name: 'Stylelint' },
        { key: '@biomejs/biome', name: 'Biome' },
        { key: 'oxlint', name: 'oxlint' },
      ],
    },
  ],
};
