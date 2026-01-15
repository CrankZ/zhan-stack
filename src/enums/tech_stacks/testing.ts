import { JS_MANAGERS, PYTHON_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const testing: TechCategory = {
  id: 'testing',
  label: { zh: '测试', en: 'Testing' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'jest', name: 'Jest' },
        { key: 'mocha', name: 'Mocha' },
        { key: 'vitest', name: 'Vitest' },
        { key: 'cypress', name: 'Cypress' },
        { key: 'playwright', name: 'Playwright' },
      ],
    },
    {
      managers: PYTHON_MANAGERS,
      items: [{ key: 'pytest', name: 'pytest' }],
    },
  ],
};
