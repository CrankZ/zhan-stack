import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const git_hooks: TechCategory = {
  id: 'git_hooks',
  label: { zh: 'Git Hooks', en: 'Git Hooks' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'husky', name: 'Husky' },
        { key: 'lint-staged', name: 'lint-staged' },
      ],
    },
  ],
};
